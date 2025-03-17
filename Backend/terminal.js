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
    try {
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
        console.log('Original repo name:', repo);
        console.log('Cleaned repo name:', cleanRepo);
        
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

        // Extract owner and repo, handling potential format issues
        let [owner, repo] = cwd.split('/');
        if (!repo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid repository format. Expected format: owner/repository' 
            });
        }

        // Clean repo name to match filesystem
        repo = repo.trim();
        const workspaceDir = getWorkspaceDir(owner, repo);
        console.log('Executing command:', command);
        console.log('In workspace:', workspaceDir);
        console.log('For repository:', repo);

        // Initialize workspace
        await initializeWorkspace(workspaceDir, repoUrl);

        // ... existing code ... 
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

module.exports = router; 