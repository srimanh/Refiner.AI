const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

// Store running processes
const runningProcesses = new Map();

// Helper function to get workspace directory
const getWorkspaceDir = (owner, repo) => {
    // Clean the repository name to be filesystem-friendly
    const cleanRepo = repo.replace(/[^a-zA-Z0-9-_]/g, '_');
    // Use absolute path for workspace directory
    const workspaceDir = path.resolve(__dirname, '..', '..', 'workspaces', cleanRepo);
    
    // Ensure the directory exists
    if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    // Log the workspace directory for debugging
    console.log('Workspace directory:', workspaceDir);
    
    return workspaceDir;
};

// Helper function to read node_modules directory
const readNodeModulesDir = async (dir) => {
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const modules = [];

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                const modulePath = path.join(dir, entry.name);
                const contents = [];

                // Read common files in the module directory
                try {
                    const moduleEntries = await fs.promises.readdir(modulePath);
                    for (const file of moduleEntries) {
                        if (['package.json', 'README.md'].includes(file) || 
                            (file === 'dist' || file === 'src') && 
                            (await fs.promises.stat(path.join(modulePath, file))).isDirectory()) {
                            contents.push({
                                name: file,
                                type: file === 'dist' || file === 'src' ? 'dir' : 'file',
                                path: path.join('node_modules', entry.name, file)
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error reading module ${entry.name}:`, err);
                }

                modules.push({
                    name: entry.name,
                    type: 'dir',
                    path: path.join('node_modules', entry.name),
                    contents
                });
            }
        }

        return modules;
    } catch (err) {
        console.error('Error reading node_modules:', err);
        return [];
    }
};

// Initialize workspace
const initializeWorkspace = async (workspaceDir, repoUrl) => {
    try {
        // Create workspace directory if it doesn't exist
        await fs.promises.mkdir(workspaceDir, { recursive: true });

        // Check if git is already initialized
        if (!fs.existsSync(path.join(workspaceDir, '.git'))) {
            console.log('Cloning repository...', repoUrl, 'into', workspaceDir);
            // Remove any existing contents
            if (fs.existsSync(workspaceDir)) {
                await execPromise(`rm -rf "${workspaceDir}"`);
                await fs.promises.mkdir(workspaceDir, { recursive: true });
            }
            await execPromise(`git clone "${repoUrl}" "${workspaceDir}"`);
            console.log('Repository cloned successfully');
        } else {
            // If repo exists, fetch and reset to match remote
            console.log('Repository exists, updating...');
            await execPromise('git fetch origin', { cwd: workspaceDir });
            await execPromise('git reset --hard origin/main', { cwd: workspaceDir });
            console.log('Repository updated successfully');
        }

        return true;
    } catch (error) {
        console.error('Error initializing workspace:', error);
        throw error;
    }
};

// Execute terminal command
router.post('/execute', async (req, res) => {
    try {
        const { command, cwd, repoUrl } = req.body;
        if (!command || !cwd || !repoUrl) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        const [owner, repo] = cwd.split('/');
        const workspaceDir = getWorkspaceDir(owner, repo);
        console.log('Executing in workspace:', workspaceDir);

        // Initialize workspace
        await initializeWorkspace(workspaceDir, repoUrl);

        // Handle npm run dev specifically
        if (command === 'npm run dev') {
            try {
                // Check if package.json exists and has a dev script
                const packageJsonPath = path.join(workspaceDir, 'package.json');
                if (!fs.existsSync(packageJsonPath)) {
                    throw new Error('package.json not found');
                }

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (!packageJson.scripts || !packageJson.scripts.dev) {
                    throw new Error('No dev script found in package.json');
                }

                // Kill any existing process
                const existingProcess = runningProcesses.get(workspaceDir);
                if (existingProcess) {
                    existingProcess.kill();
                    runningProcesses.delete(workspaceDir);
                }

                // Find an available port
                const findAvailablePort = async (startPort) => {
                    const net = require('net');
                    const server = net.createServer();
                    
                    return new Promise((resolve, reject) => {
                        server.listen(startPort, () => {
                            const port = server.address().port;
                            server.close(() => resolve(port));
                        });
                        
                        server.on('error', () => {
                            resolve(findAvailablePort(startPort + 1));
                        });
                    });
                };

                let port = await findAvailablePort(3001);

                // Start the dev server with the new port
                const serverProcess = exec(`npm run dev`, {
                    cwd: workspaceDir,
                    env: { ...process.env, PORT: port.toString() }
                });

                // Store the process
                runningProcesses.set(workspaceDir, serverProcess);

                let output = '';
                let serverStarted = false;
                let serverUrl = '';

                serverProcess.stdout.on('data', (data) => {
                    console.log('Dev server output:', data);
                    output += data;
                    // Check for Vite's port in the output
                    const portMatch = data.toString().match(/Local:\s+http:\/\/localhost:(\d+)/);
                    if (portMatch) {
                        port = parseInt(portMatch[1]);
                        serverUrl = `http://localhost:${port}`;
                        serverStarted = true;
                    } else if (data.includes('ready in')) {
                        serverStarted = true;
                    }
                });

                serverProcess.stderr.on('data', (data) => {
                    console.error('Dev server error:', data);
                    output += data;
                });

                // Wait for server to start
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (serverStarted) {
                            resolve();
                        } else {
                            reject(new Error('Server failed to start'));
                        }
                    }, 5000); // Increased timeout for Vite startup
                });

                return res.json({
                    success: true,
                    output: output || 'Dev server started successfully',
                    serverUrl,
                    isServerRunning: true,
                    port
                });
            } catch (error) {
                console.error('Error running dev server:', error);
                return res.status(500).json({
                    success: false,
                    error: `Failed to run dev server: ${error.message}`,
                    output: error.stack
                });
            }
        }

        // Handle npm install
        if (command.startsWith('npm install')) {
            console.log('Starting npm install in:', workspaceDir);
            
            // Run npm install with detailed output
            const { stdout, stderr } = await execPromise('npm install --verbose', { 
                cwd: workspaceDir,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            // Get installed modules
            const nodeModulesDir = path.join(workspaceDir, 'node_modules');
            const modules = fs.existsSync(nodeModulesDir) ? 
                await fs.promises.readdir(nodeModulesDir) : [];

            // Filter out system files and get only package directories
            const packageModules = modules.filter(m => 
                !m.startsWith('.') && 
                fs.statSync(path.join(nodeModulesDir, m)).isDirectory()
            );

            return res.json({ 
                success: true, 
                output: stdout + (stderr ? `\n${stderr}` : ''),
                modules: packageModules,
                workspaceDir // Return the workspace directory for verification
            });
        }

        // Handle specific commands
        if (command === 'ls') {
            const files = await fs.promises.readdir(workspaceDir);
            return res.json({ 
                success: true, 
                output: files.join('\n'),
                files: files // Include files array for frontend processing
            });
        }

        // For other commands
        const { stdout, stderr } = await execPromise(command, { 
            cwd: workspaceDir,
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        return res.json({ 
            success: true, 
            output: stdout + (stderr ? `\n${stderr}` : '')
        });
    } catch (error) {
        console.error('Command execution error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            output: error.stdout + (error.stderr ? `\n${error.stderr}` : '')
        });
    }
});

// Get node_modules contents
router.get('/node-modules', async (req, res) => {
    try {
        const { cwd } = req.query;
        if (!cwd) {
            return res.status(400).json({ success: false, error: 'Missing cwd parameter' });
        }

        const [owner, repo] = cwd.split('/');
        const workspaceDir = getWorkspaceDir(owner, repo);
        const nodeModulesDir = path.join(workspaceDir, 'node_modules');

        if (!fs.existsSync(nodeModulesDir)) {
            return res.json({ success: true, modules: [] });
        }

        const modules = await readNodeModulesDir(nodeModulesDir);
        return res.json({ success: true, modules });
    } catch (error) {
        console.error('Error reading node_modules:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 