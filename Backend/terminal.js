const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);
const simpleGit = require('simple-git');

// Store running processes
const runningProcesses = new Map();

// Helper function to get workspace directory
const getWorkspaceDir = (owner, repo) => {
    try {
        // Clean the repository name to be filesystem-friendly
        const cleanRepo = repo.replace(/[^a-zA-Z0-9-_]/g, '_');
        
        // Use absolute path for workspace directory
        const workspaceDir = path.resolve(__dirname, '..', '..', 'workspaces', cleanRepo);
        
        // Ensure the directory exists
        if (!fs.existsSync(workspaceDir)) {
            fs.mkdirSync(workspaceDir, { recursive: true });
        }
        
        return workspaceDir;
    } catch (error) {
        console.error('Error in getWorkspaceDir:', error);
        throw new Error(`Failed to get workspace directory: ${error.message}`);
    }
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

// Initialize workspace with Git
const initializeWorkspace = async (workspaceDir, repoUrl) => {
    try {
        const git = simpleGit(workspaceDir);
        
        // Check if git is already initialized
        if (!fs.existsSync(path.join(workspaceDir, '.git'))) {
            console.log('Cloning repository...', repoUrl, 'into', workspaceDir);
            // Remove any existing contents
            if (fs.existsSync(workspaceDir)) {
                await fs.promises.rm(workspaceDir, { recursive: true, force: true });
                await fs.promises.mkdir(workspaceDir, { recursive: true });
            }
            await git.clone(repoUrl, workspaceDir);
            console.log('Repository cloned successfully');
        } else {
            // Check if there are any uncommitted changes
            const { stdout: status } = await execPromise('git status --porcelain', { cwd: workspaceDir });
            if (!status) {
                // Only update if there are no uncommitted changes
                console.log('Repository exists, updating...');
                await git.fetch('origin', 'main');
                await git.reset(['--hard', 'origin/main']);
                console.log('Repository updated successfully');
            } else {
                console.log('Repository exists with uncommitted changes, skipping update');
            }
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
        console.log('Execute command request:', { command, cwd, repoUrl });

        if (!command || !cwd || !repoUrl) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // Extract owner and repo
        let [owner, repo] = cwd.split('/');
        if (!repo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid repository format. Expected format: owner/repository' 
            });
        }

        // Clean repo name
        repo = repo.trim();
        const workspaceDir = getWorkspaceDir(owner, repo);
        const git = simpleGit(workspaceDir);

        console.log('Executing command in workspace:', workspaceDir);

        // Initialize workspace only if it's not a git command
        if (!command.startsWith('git ')) {
            await initializeWorkspace(workspaceDir, repoUrl);
        }

        // Handle git commands
        if (command.startsWith('git ')) {
            const gitCommand = command.slice(4);
            
            try {
                // Configure git user if not already configured
                await git.addConfig('user.email', 'refinerai@example.com');
                await git.addConfig('user.name', 'RefinerAI');
                
                // Handle specific git commands
                if (gitCommand.startsWith('add')) {
                    // First check if there are any changes
                    const { stdout: status } = await execPromise('git status --porcelain', { cwd: workspaceDir });
                    if (!status) {
                        return res.json({ 
                            success: true, 
                            output: 'No changes to stage'
                        });
                    }
                    
                    const { stdout, stderr } = await execPromise('git add .', { cwd: workspaceDir });
                    return res.json({ 
                        success: true, 
                        output: stdout + (stderr ? '\n' + stderr : '')
                    });
                } else if (gitCommand.startsWith('commit')) {
                    // First check if there are any staged changes
                    const { stdout: status } = await execPromise('git status --porcelain', { cwd: workspaceDir });
                    if (!status) {
                        return res.json({ 
                            success: true, 
                            output: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean'
                        });
                    }
                    
                    const message = gitCommand.split('commit -m ')[1]?.replace(/"/g, '') || 'Update files';
                    const { stdout, stderr } = await execPromise(`git commit -m "${message}"`, { cwd: workspaceDir });
                    return res.json({ 
                        success: true, 
                        output: stdout + (stderr ? '\n' + stderr : '')
                    });
                } else if (gitCommand.startsWith('push')) {
                    // First check if there are any commits to push
                    const { stdout: status } = await execPromise('git status --porcelain', { cwd: workspaceDir });
                    if (!status) {
                        const { stdout: log } = await execPromise('git log --oneline -n 1', { cwd: workspaceDir });
                        if (!log) {
                            return res.json({ 
                                success: true, 
                                output: 'No changes to push'
                            });
                        }
                    }
                    
                    const { stdout, stderr } = await execPromise('git push origin main', { cwd: workspaceDir });
                    return res.json({ 
                        success: true, 
                        output: stdout + (stderr ? '\n' + stderr : '')
                    });
                }
                
                // Execute other git commands
                const { stdout, stderr } = await execPromise(command, { cwd: workspaceDir });
                return res.json({ 
                    success: true, 
                    output: stdout + (stderr ? '\n' + stderr : '')
                });
            } catch (error) {
                console.error('Git command error:', error);
                return res.json({ 
                    success: true,
                    output: error.stdout || error.message
                });
            }
        }

        // Handle npm commands
        if (command.startsWith('npm ')) {
            console.log(`Starting ${command} in: ${workspaceDir}`);
            try {
                // For npm run dev, we need to handle the output differently
                if (command.includes('run dev')) {
                    // Start the process in detached mode to keep it running
                    const process = exec(command, { cwd: workspaceDir });
                    
                    // Store the process for later management
                    runningProcesses.set(workspaceDir, process);
                    
                    // Handle process output
                    let output = '';
                    let port = null;
                    
                    process.stdout.on('data', (data) => {
                        output += data;
                        console.log('Dev server output:', data);
                        
                        // Look for the URL in the output with different patterns
                        const urlMatch = data.match(/Local:\s*http:\/\/localhost:(\d+)/) || 
                                       data.match(/➜\s*Local:\s*http:\/\/localhost:(\d+)/);
                        if (urlMatch) {
                            port = urlMatch[1];
                            console.log('Found port:', port);
                        }
                    });
                    
                    process.stderr.on('data', (data) => {
                        output += data;
                        console.error('Dev server error:', data);
                    });
                    
                    // Wait a bit to capture initial output
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    return res.json({ 
                        success: true, 
                        output: output,
                        port: port,
                        message: port ? `Server running at http://localhost:${port}` : 'Starting development server...'
                    });
                }
                
                // For other npm commands
                const { stdout, stderr } = await execPromise(command, { cwd: workspaceDir });
                return res.json({ 
                    success: true, 
                    output: stdout + (stderr ? '\n' + stderr : '')
                });
            } catch (error) {
                console.error('NPM command error:', error);
                return res.json({ 
                    success: false, 
                    output: `NPM error: ${error.message}`
                });
            }
        }

        // Handle other commands
        try {
            const { stdout, stderr } = await execPromise(command, { cwd: workspaceDir });
            return res.json({ 
                success: true, 
                output: stdout + (stderr ? '\n' + stderr : '')
            });
        } catch (error) {
            console.error('Command error:', error);
            return res.json({ 
                success: false, 
                output: `Command error: ${error.message}`
            });
        }
    } catch (error) {
        console.error('Error in execute:', error);
        return res.status(500).json({ success: false, error: error.message });
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

// Save file to workspace
router.post('/save-file', async (req, res) => {
    try {
        const { owner, repo, path: filePath, content } = req.body;
        
        // Log the request data for debugging
        console.log('Save file request:', { owner, repo, filePath, contentLength: content?.length });

        if (!owner || !repo || !filePath || content === undefined) {
            console.error('Missing parameters:', { owner, repo, filePath, hasContent: content !== undefined });
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters'
            });
        }

        const cleanRepo = repo.replace(/[^a-zA-Z0-9-_]/g, '_');
        const workspaceDir = getWorkspaceDir(owner, cleanRepo);
        const fullPath = path.join(workspaceDir, filePath);

        // Log paths for debugging
        console.log('Paths:', { workspaceDir, fullPath });

        // Ensure directory exists
        const dirPath = path.dirname(fullPath);
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }

        // Write file
        await fs.promises.writeFile(fullPath, content, 'utf8');

        // Stage changes
        const git = simpleGit(workspaceDir);
        try {
            await git.add(filePath);
            console.log('Changes staged successfully');
        } catch (gitError) {
            console.error('Error staging changes:', gitError);
            // Continue even if git add fails
        }

        console.log('File saved successfully:', fullPath);

        return res.json({ 
            success: true,
            message: 'File saved successfully',
            path: filePath
        });
    } catch (error) {
        console.error('Error saving file:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

// Get file content
router.get('/read-file', async (req, res) => {
    try {
        const { owner, repo, path: filePath } = req.query;
        
        // Log the request data for debugging
        console.log('Read file request:', { owner, repo, filePath });

        if (!owner || !repo || !filePath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters'
            });
        }

        const cleanRepo = repo.replace(/[^a-zA-Z0-9-_]/g, '_');
        const workspaceDir = getWorkspaceDir(owner, cleanRepo);
        const fullPath = path.join(workspaceDir, filePath);

        // Log paths for debugging
        console.log('Paths:', { workspaceDir, fullPath });

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'File not found'
            });
        }

        const content = await fs.promises.readFile(fullPath, 'utf8');
        return res.json({ 
            success: true,
            content
        });
    } catch (error) {
        console.error('Error reading file:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Get repository files
router.get('/files', async (req, res) => {
    try {
        const { owner, repo } = req.query;
        
        // Log the request data for debugging
        console.log('Get files request:', { owner, repo });

        if (!owner || !repo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters'
            });
        }

        const cleanRepo = repo.replace(/[^a-zA-Z0-9-_]/g, '_');
        const workspaceDir = getWorkspaceDir(owner, cleanRepo);

        // Log workspace directory for debugging
        console.log('Workspace directory:', workspaceDir);

        if (!fs.existsSync(workspaceDir)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Repository not found'
            });
        }

        const readDir = async (dir) => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            const files = [];

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(workspaceDir, fullPath);

                if (entry.isDirectory()) {
                    files.push({
                        name: entry.name,
                        type: 'dir',
                        path: relativePath,
                        contents: await readDir(fullPath)
                    });
                } else {
                    files.push({
                        name: entry.name,
                        type: 'file',
                        path: relativePath
                    });
                }
            }

            return files;
        };

        const files = await readDir(workspaceDir);
        return res.json({ 
            success: true,
            files
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

module.exports = router; 