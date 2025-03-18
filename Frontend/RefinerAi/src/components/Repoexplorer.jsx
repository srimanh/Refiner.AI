import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { getCorrectedCode } from '../utils/codeCorrector';
import Editor from '@monaco-editor/react';
import CodeAnalyser from './CodeAnalyser';
import Header from '../components/header';
import Terminal from 'react-terminal-ui';
import PracticeCode from './PracticeCode';
const token = import.meta.env.VITE_GITHUB_TOKEN;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_LINK || 'http://localhost:3000';

const fetchContents = async (url, setError) => {
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `token ${token}` },
        });

        const contents = response.data;
        const allFiles = [];

        for (const item of contents) {
            if (item.type === 'file') {
                allFiles.push(item);
            } else if (item.type === 'dir') {
                const subDirContents = await fetchContents(item.url, setError);
                allFiles.push({ ...item, contents: subDirContents });
            }
        }

        return allFiles;
    } catch (error) {
        setError('Error fetching repository contents');
        console.error('Error fetching contents:', error);
        return [];
    }
};

const RepoViewer = () => {
    const location = useLocation();
    const repoUrl = location.state?.repoUrl || '';
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [openFolders, setOpenFolders] = useState({});
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: null, path: '' });
    const [defaultBranch, setDefaultBranch] = useState('');
    const [commitMessage, setCommitMessage] = useState('');
    const [pendingChanges, setPendingChanges] = useState([]);
    const [fileExplorerWidth, setFileExplorerWidth] = useState(300);
    const [codeAnalyzerWidth, setCodeAnalyzerWidth] = useState(400);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartWidth, setDragStartWidth] = useState(0);
    const [dragType, setDragType] = useState(null);
    const [showPreviewTerminal, setShowPreviewTerminal] = useState(false);
    const [terminalLines, setTerminalLines] = useState([]);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [showFullTerminal, setShowFullTerminal] = useState(false);
    const [terminalInput, setTerminalInput] = useState('');
    const [terminalHeight, setTerminalHeight] = useState(300);
    const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartHeight, setDragStartHeight] = useState(0);
    const [codeAnalysis, setCodeAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('analyzer');
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [currentDir, setCurrentDir] = useState('');
    const [terminalHistory, setTerminalHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const extractOwnerAndRepo = useCallback((url) => {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        return match ? [match[1], match[2]] : [null, null];
    }, []);

    const handleFetchRepo = useCallback(async () => {
        setError(null);
        const [owner, repo] = extractOwnerAndRepo(repoUrl);

        if (!owner || !repo) {
            setError('Invalid repository URL');
            return;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents`;
        const allFiles = await fetchContents(url, setError);
        setFiles(allFiles);
    }, [repoUrl, extractOwnerAndRepo]);

    const fetchDefaultBranch = useCallback(async () => {
        const [owner, repo] = extractOwnerAndRepo(repoUrl);
        if (!owner || !repo) return;

        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );
            setDefaultBranch(response.data.default_branch);
        } catch (error) {
            console.error('Error fetching default branch:', error);
        }
    }, [repoUrl, extractOwnerAndRepo]);

    useEffect(() => {
        if (repoUrl) {
            handleFetchRepo();
            fetchDefaultBranch();
        }
    }, [repoUrl, handleFetchRepo, fetchDefaultBranch]);

    const handleEditorDidMount = (editor, monaco) => {
        monaco.editor.defineTheme('black-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#000000',    // Pure black background
                'editor.foreground': '#FFFFFF',    // White text for contrast
                'editorLineNumber.foreground': '#AAAAAA',  // Grey line numbers for readability
            }
        });
    
        monaco.editor.setTheme('black-theme');
    };

    const toggleFolder = (path) => {
        setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    const fetchFileContent = async (path) => {
        setLoading(true);
        const [owner, repo] = extractOwnerAndRepo(repoUrl);

        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            const decodedContent = atob(response.data.content);
            setFileContent(decodedContent);
            setSelectedFile(path);
        } catch (err) {
            console.error('Error fetching file content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCorrectCode = async () => {
        if (!fileContent) {
            setError('No code to correct');
            return;
        }

        try {
            const corrected = await getCorrectedCode(fileContent);
            console.log('Corrected code response:', corrected);
            
            if (corrected && typeof corrected === 'object') {
                if (corrected.code) {
                    setFileContent(corrected.code);
                }
                if (corrected.analysis) {
                    setCodeAnalysis(corrected.analysis);
                }
            } else {
                throw new Error('Invalid response format from code correction');
            }
        } catch (error) {
            console.error('Error correcting code:', error);
            setError('Error correcting code: ' + (error.message || 'Unknown error'));
            setFileContent('');
            setCodeAnalysis(null);
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName) {
            setError('Please enter a file name');
            return;
        }

        // Validate file name
        if (!/^[a-zA-Z0-9._-]+$/.test(newFileName)) {
            setError('File name can only contain letters, numbers, dots, underscores, and hyphens');
            return;
        }
        
        const path = currentPath ? `${currentPath}/${newFileName}` : newFileName;
        
        // Check if file already exists in local state
        const fileExists = files.some(file => file.path === path);
        if (fileExists) {
                setError('File already exists');
                return;
            }
            
        // Create new file object
        const newFile = {
            name: newFileName,
            path: path,
            type: 'file',
            content: '',
            sha: Date.now().toString(), // Generate a temporary SHA
        };
        
        // Add new file to files state
        setFiles(prevFiles => [...prevFiles, newFile]);
            setShowNewFileDialog(false);
            setNewFileName('');
        setError(null);
        
        // Set as selected file and open in editor
        setSelectedFile(path);
        setFileContent('');
        setIsEditing(true);
        
        // Add to pending changes
            addToPendingChanges('create', path);
    };

    const handleSaveFile = async () => {
        if (!selectedFile || !fileContent) return;

        try {
            const [owner, repo] = extractOwnerAndRepo(repoUrl);
            if (!owner || !repo) return;

            const response = await axios.put(
                `https://api.github.com/repos/${owner}/${repo}/contents/${selectedFile}`,
                {
                    message: `Update ${selectedFile}`,
                    content: btoa(fileContent),
                    sha: await getFileSha(selectedFile)
                },
                {
                    headers: {
                        Authorization: `token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                setIsEditing(false);
                setPendingChanges(prev => [...prev, { type: 'modify', path: selectedFile }]);
            }
        } catch (error) {
            console.error('Error saving file:', error);
            setError('Error saving file');
        }
    };

    const getFileSha = async (path) => {
        const [owner, repo] = extractOwnerAndRepo(repoUrl);
        if (!owner || !repo) return null;

        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                {
                    headers: { Authorization: `token ${token}` }
                }
            );
            return response.data.sha;
        } catch (error) {
            console.error('Error getting file SHA:', error);
            return null;
        }
    };

    const handleDeleteFile = async (path) => {
        const [owner, repo] = extractOwnerAndRepo(repoUrl);
        
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );
            
            const sha = response.data.sha;
            
            await axios.delete(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                {
                    headers: { Authorization: `token ${token}` },
                    data: {
                        message: `Delete ${path}`,
                        sha,
                        branch: defaultBranch,
                    },
                }
            );
            
            handleFetchRepo();
            if (selectedFile === path) {
                setSelectedFile(null);
                setFileContent('');
            }
            addToPendingChanges('delete', path);
        } catch (error) {
            console.error('Error deleting file:', error);
            setError('Failed to delete file');
        }
    };

    const handleContextMenu = (e, type, path = '') => {
        e.preventDefault();
        setContextMenu({
            show: true,
            x: e.pageX,
            y: e.pageY,
            type,
            path,
        });
    };

    const detectLanguage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const langMap = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            html: 'html',
            css: 'css',
            json: 'json',
            md: 'markdown',
        };
        return langMap[ext] || 'plaintext';
    };

    const renderFileTree = (items, parentPath = '') => {
        return items.map((item) => {
            const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;

            if (item.type === 'dir') {
                // Special handling for node_modules directory
                if (item.name === 'node_modules') {
                return (
                        <div key={itemPath} style={{ marginLeft: '20px' }}>
                        <div
                            onContextMenu={(e) => handleContextMenu(e, 'folder', itemPath)}
                            onClick={() => toggleFolder(itemPath)}
                            style={{ cursor: 'pointer', fontWeight: 'bold', padding: '4px 0' }}
                            className="hover:bg-[#ffffff15] rounded px-2"
                        >
                            {openFolders[itemPath] ? '📂 ' : '📁 '} {item.name}
                        </div>
                        {openFolders[itemPath] && item.contents && (
                                <div>
                                    {item.contents.map((module) => (
                                        <div key={`${itemPath}/${module.name}`} style={{ marginLeft: '20px' }}>
                                            <div
                                                style={{ cursor: 'pointer', padding: '4px 0' }}
                                                className="hover:bg-[#ffffff15] rounded px-2"
                                                onClick={() => toggleFolder(`${itemPath}/${module.name}`)}
                                            >
                                                {openFolders[`${itemPath}/${module.name}`] ? '📂 ' : '📁 '} {module.name}
                                            </div>
                                            {openFolders[`${itemPath}/${module.name}`] && module.contents && (
                                                <div style={{ marginLeft: '20px' }}>
                                                    {module.contents.map((file) => (
                                                        <div
                                                            key={`${itemPath}/${module.name}/${file.name}`}
                                                            className="text-gray-400 text-sm px-2 py-1"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => file.type === 'file' && fetchFileContent(`${module.path}/${file.name}`)}
                                                        >
                                                            {file.type === 'dir' ? `📁 ${file.name}/` : `📄 ${file.name}`}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }

                // Regular directory handling
                return (
                    <div key={itemPath} style={{ marginLeft: '20px' }}>
                        <div
                            onContextMenu={(e) => handleContextMenu(e, 'folder', itemPath)}
                            onClick={() => toggleFolder(itemPath)}
                            style={{ cursor: 'pointer', fontWeight: 'bold', padding: '4px 0' }}
                            className="hover:bg-[#ffffff15] rounded px-2"
                        >
                            {openFolders[itemPath] ? '📂 ' : '📁 '} {item.name}
                        </div>
                        {openFolders[itemPath] && item.contents && (
                            <div>{renderFileTree(item.contents, itemPath)}</div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div
                        key={itemPath}
                        onContextMenu={(e) => handleContextMenu(e, 'file', itemPath)}
                        onClick={() => fetchFileContent(itemPath)}
                        style={{ marginLeft: '20px', cursor: 'pointer', padding: '4px 0' }}
                        className={`hover:bg-[#ffffff15] rounded px-2 ${
                            selectedFile === itemPath ? 'bg-[#ffffff25]' : ''
                        }`}
                    >
                        📄 {item.name}
                    </div>
                );
            }
        });
    };

    const addToPendingChanges = (type, path) => {
        setPendingChanges(prev => {
            const existing = prev.find(change => change.path === path);
            if (existing) {
                return prev.map(change => 
                    change.path === path ? { ...change, type } : change
                );
            }
            return [...prev, { type, path, timestamp: new Date().toISOString() }];
        });
    };

    const handleCommitChanges = async () => {
        if (!commitMessage) {
            setError('Please provide a commit message');
            return;
        }

        try {
            const [owner, repo] = extractOwnerAndRepo(repoUrl);
            if (!owner || !repo) return;

            // Commit changes logic here
            setPendingChanges([]);
        } catch (error) {
            console.error('Error committing changes:', error);
            setError('Error committing changes');
        }
    };

    const handlePreview = async () => {
        if (!repoUrl) {
            setError('No repository URL provided');
            return;
        }

        try {
            // Preview logic here
        } catch (error) {
            console.error('Error previewing:', error);
            setError('Error previewing');
        }
    };

    const handleResizeStart = (e, type) => {
        e.preventDefault();
        setIsDragging(true);
        setDragType(type);
        setDragStartX(e.clientX);
        setDragStartWidth(type === 'left' ? fileExplorerWidth : codeAnalyzerWidth);
    };

    const handleResizeMove = (e) => {
        if (!isDragging) return;

        const diff = e.clientX - dragStartX;
        if (dragType === 'left') {
            const newWidth = Math.max(200, Math.min(600, dragStartWidth + diff));
            setFileExplorerWidth(newWidth);
        } else {
            const newWidth = Math.max(200, Math.min(600, dragStartWidth - diff));
            setCodeAnalyzerWidth(newWidth);
        }
    };

    const handleResizeEnd = () => {
        setIsDragging(false);
        setDragType(null);
    };

    const handleTerminalResizeStart = (e) => {
        e.preventDefault();
        setIsDraggingTerminal(true);
        setDragStartY(e.clientY);
        setDragStartHeight(terminalHeight);
    };

    const handleTerminalResizeMove = (e) => {
        if (!isDraggingTerminal) return;

        const diff = dragStartY - e.clientY;
        const newHeight = Math.max(200, Math.min(window.innerHeight * 0.7, dragStartHeight + diff));
        setTerminalHeight(newHeight);
    };

    const handleTerminalResizeEnd = () => {
        setIsDraggingTerminal(false);
    };

    const handleEditorChange = async (value) => {
        setFileContent(value);
        
        // Auto-save changes
        try {
            const [owner, repo] = extractOwnerAndRepo(repoUrl);
            if (!owner || !repo) {
                console.error('No repository information available');
                return;
            }

            if (!selectedFile) {
                console.error('No file selected');
                return;
            }

            console.log('Saving file:', {
                owner,
                repo,
                path: selectedFile,
                content: value
            });

            // Save to workspace first
            const response = await axios.post(`${API_BASE_URL}/api/terminal/save-file`, {
                owner,
                repo,
                path: selectedFile,
                content: value
            });

            if (response.data.success) {
                console.log('File saved successfully:', response.data);
                // Add to pending changes
                setPendingChanges(prev => {
                    const existing = prev.find(change => change.path === selectedFile);
                    if (existing) {
                        return prev.map(change => 
                            change.path === selectedFile ? { ...change, type: 'modify' } : change
                        );
                    }
                    return [...prev, { type: 'modify', path: selectedFile }];
                });
            } else {
                console.error('Failed to save file:', response.data.error);
                setError('Failed to save file: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error saving file:', error);
            const errorMessage = error.response?.data?.error || error.message;
            setError('Error saving file: ' + errorMessage);
            
            // Log additional error details
            if (error.response?.data?.details) {
                console.error('Error details:', error.response.data.details);
            }
        }
    };

    const processTerminalCommand = async (command) => {
        const [cmd, ...args] = command.split(' ');
        setTerminalLines(prev => [...prev, `$ ${command}`]);
        setTerminalHistory(prev => [...prev, command]);
        setHistoryIndex(-1);

        try {
            const [owner, repo] = extractOwnerAndRepo(repoUrl);
            if (!owner || !repo) {
                throw new Error('No repository opened. Please open a GitHub repository first.');
            }

            setTerminalLines(prev => [...prev, `Working directory: ${owner}/${repo}${currentDir ? '/' + currentDir : ''}`]);

            // If it's a Git command, ensure changes are saved first
            if (cmd === 'git' && (args[0] === 'add' || args[0] === 'commit' || args[0] === 'push')) {
                // Save any pending changes
                if (selectedFile && fileContent) {
                    await axios.post(`${API_BASE_URL}/api/terminal/save-file`, {
                        owner,
                        repo,
                        path: selectedFile,
                        content: fileContent
                    });
                }
            }

            const response = await axios.post(`${API_BASE_URL}/api/terminal/execute`, {
                command,
                cwd: `${owner}/${repo}`,
                repoUrl: repoUrl,
                currentDir: currentDir
            });

            if (response.data.success) {
                // Handle npm run dev command
                if (cmd === 'npm' && args[0] === 'run' && args[1] === 'dev') {
                    if (response.data.port) {
                        const url = `http://localhost:${response.data.port}`;
                        setTerminalLines(prev => [...prev, 
                            `Server is running at: ${url}`,
                            'Press Ctrl+C to stop the server'
                        ]);
                        // Add clickable link
                        setTerminalLines(prev => [...prev, 
                            <a 
                                key="dev-link" 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-400 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open(url, '_blank');
                                }}
                            >
                                Open in browser
                            </a>
                        ]);
                    } else {
                        setTerminalLines(prev => [...prev, response.data.message || 'Starting development server...']);
                    }
                } else {
                    // Handle other commands
                    const outputLines = response.data.output.split('\n');
                    setTerminalLines(prev => [...prev, ...outputLines.filter(line => line.trim())]);
                }

                // Handle cd command
                if (cmd === 'cd' && response.data.currentDir !== undefined) {
                    setCurrentDir(response.data.currentDir);
                }

                // Handle git commands
                if (cmd === 'git') {
                    const gitCommand = args[0];
                    if (gitCommand === 'add') {
                        setTerminalLines(prev => [...prev, '✓ Changes staged for commit']);
                    } else if (gitCommand === 'commit') {
                        if (response.data.output.includes('nothing to commit')) {
                            setTerminalLines(prev => [...prev, 'No changes to commit']);
                        } else {
                            setTerminalLines(prev => [...prev, '✓ Changes committed successfully']);
                            setPendingChanges([]); // Clear pending changes after successful commit
                        }
                    } else if (gitCommand === 'push') {
                        if (response.data.output.includes('No changes to push')) {
                            setTerminalLines(prev => [...prev, 'No changes to push']);
                        } else {
                            setTerminalLines(prev => [...prev, '✓ Changes pushed to remote repository']);
                        }
                    }
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.output || error.message;
            setTerminalLines(prev => [...prev, `Error: ${errorMessage}`]);
        }
    };

    const handleTerminalKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < terminalHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setTerminalInput(terminalHistory[terminalHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setTerminalInput(terminalHistory[terminalHistory.length - 1 - newIndex]);
            } else {
                setHistoryIndex(-1);
                setTerminalInput('');
            }
        } else if (e.key === 'Enter' && terminalInput.trim()) {
            processTerminalCommand(terminalInput.trim());
            setTerminalInput('');
        }
    };

    const renderTerminal = () => (
        <div className="terminal-container" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: showFullTerminal ? `${terminalHeight}px` : '0',
            backgroundColor: '#1e1e1e',
            borderTop: '1px solid #333',
            transition: 'height 0.3s ease',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '70vh'
        }}>
            <div className="terminal-header" style={{
                padding: '8px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#1e1e1e'
            }}>
                <div className="terminal-tabs" style={{ display: 'flex', gap: '8px' }}>
                    <div className="active-tab" style={{
                        padding: '4px 12px',
                        backgroundColor: '#2d2d2d',
                        borderRadius: '4px 4px 0 0',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'Consolas, monospace',
                        borderBottom: '2px solid #0078d4'
                    }}>
                        Terminal - bash
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => setTerminalHeight(prev => Math.min(prev + 100, window.innerHeight * 0.7))}
                        className="text-white hover:text-gray-300 px-2 py-1 hover:bg-[#ffffff15] rounded"
                        title="Increase terminal height"
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => setTerminalHeight(prev => Math.max(prev - 100, 200))}
                        className="text-white hover:text-gray-300 px-2 py-1 hover:bg-[#ffffff15] rounded"
                        title="Decrease terminal height"
                    >
                        ↓
                    </button>
                    <button
                        onClick={() => setShowFullTerminal(false)}
                        className="text-white hover:text-gray-300 px-2 py-1 hover:bg-[#ffffff15] rounded"
                        title="Close terminal"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="terminal-content" style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                fontFamily: 'Consolas, monospace',
                fontSize: '14px',
                backgroundColor: '#000000',
                color: '#fff',
                lineHeight: '1.5'
            }}>
                <div style={{ color: '#0a0', marginBottom: '12px' }}>
                    Welcome to Terminal. Type &apos;help&apos; for available commands.
                </div>
                {terminalLines.map((line, index) => (
                    <div key={index} style={{
                        color: line.startsWith('$') ? '#0a0' : 
                               line.includes('Error:') ? '#ff5555' :
                               line.includes('➜') ? '#0078d4' :
                               line.includes('Server is running at:') ? '#61dafb' : '#fff',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '4px',
                        fontFamily: 'Consolas, monospace',
                        cursor: line.includes('Server is running at:') ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                        if (line.includes('Server is running at:')) {
                            const url = line.split('Server is running at: ')[1];
                            window.open(url, '_blank');
                        }
                    }}>
                        {line}
                    </div>
                ))}
            </div>
            <div className="terminal-input" style={{
                padding: '12px',
                borderTop: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#000000'
            }}>
                <span style={{ color: '#0a0', marginRight: '8px', fontFamily: 'Consolas, monospace' }}>$</span>
                <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalKeyDown}
                    style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontFamily: 'Consolas, monospace',
                        fontSize: '14px',
                        outline: 'none',
                        caretColor: '#fff'
                    }}
                    placeholder="Type commands here... (cd, git, npm, etc.)"
                    autoFocus
                />
            </div>
        </div>
    );

    const renderCodeAnalyzerPanel = () => (
        <div style={{ 
            width: `${codeAnalyzerWidth}px`, 
            borderLeft: '1px solid #333', 
            height: '100%', 
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            userSelect: isDragging ? 'none' : 'auto',
            background: '#000000',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="flex border-b border-[#333] bg-[#1e1e1e]">
                <button
                    onClick={() => setActiveTab('analyzer')}
                    className={`px-4 py-2 ${activeTab === 'analyzer' ? 'text-[#61dafb] border-b-2 border-[#61dafb]' : 'text-white'}`}
                >
                    Analyzer
                </button>
                <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-4 py-2 ${activeTab === 'practice' ? 'text-[#61dafb] border-b-2 border-[#61dafb]' : 'text-white'}`}
                >
                    Practice
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-4 py-2 ${activeTab === 'quiz' ? 'text-[#61dafb] border-b-2 border-[#61dafb]' : 'text-white'}`}
                >
                    Quiz
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {activeTab === 'analyzer' && (
                    <CodeAnalyser 
                        code={fileContent} 
                        language={selectedFile ? detectLanguage(selectedFile) : 'plaintext'}
                        onAnalysisComplete={setCodeAnalysis}
                    />
                )}
                {activeTab === 'practice' && codeAnalysis && (
                    <PracticeCode analysis={codeAnalysis} />
                )}
                {activeTab === 'quiz' && codeAnalysis && (
                    <Quiz analysis={codeAnalysis} />
                )}
            </div>
        </div>
    );

    // Add useEffect for global event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isDragging, dragStartX, dragStartWidth, dragType, handleResizeMove]);

    // Add useEffect for terminal resize
    useEffect(() => {
        if (isDraggingTerminal) {
            window.addEventListener('mousemove', handleTerminalResizeMove);
            window.addEventListener('mouseup', handleTerminalResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleTerminalResizeMove);
            window.removeEventListener('mouseup', handleTerminalResizeEnd);
        };
    }, [isDraggingTerminal, dragStartY, dragStartHeight, handleTerminalResizeMove]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000000' }}>
            <Header />
            <div style={{ 
                display: 'flex', 
                flex: 1, 
                position: 'relative', 
                userSelect: isDragging ? 'none' : 'auto',
                overflow: 'hidden',
                background: '#000000'
            }}>
                <div style={{ 
                    width: `${fileExplorerWidth}px`, 
                    background: '#000000', 
                    color: 'white', 
                    overflowY: 'auto', 
                    borderRight: '1px solid #333',
                    position: 'relative',
                    flexShrink: 0
                }}>
                    <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000000' }}>
                            <h2 style={{ color: '#61dafb' }}>Explorer</h2>
                            <div className="space-x-2">
                                <button
                                    onClick={() => {
                                        setShowNewFileDialog(true);
                                        setCurrentPath('');
                                    }}
                                    className="px-2 py-1 bg-[#333] hover:bg-[#444] rounded"
                                >
                                    + New File
                                </button>
                                {pendingChanges.length > 0 && (
                                    <button
                                        onClick={() => setShowCommitDialog(true)}
                                        className="px-2 py-1 bg-[#0078d4] hover:bg-[#0086ef] rounded"
                                    >
                                        Commit Changes ({pendingChanges.length})
                                    </button>
                                )}
                            </div>
                        </div>
                        {error && <div style={{ color: 'red', margin: '10px 20px' }}>{error}</div>}
                        <div style={{ marginTop: '10px' }}>{renderFileTree(files)}</div>

                        {pendingChanges.length > 0 && (
                            <div className="mt-4 p-4 border-t border-[#333]">
                                <h3 className="text-[#61dafb] mb-2">Pending Changes</h3>
                                {pendingChanges.map((change, index) => (
                                    <div key={index} className="text-sm mb-1 flex items-center">
                                        <span className={`mr-2 ${
                                            change.type === 'create' ? 'text-green-500' :
                                            change.type === 'modify' ? 'text-yellow-500' :
                                            'text-red-500'
                                        }`}>
                                            {change.type === 'create' ? '+ ' :
                                             change.type === 'modify' ? '~ ' :
                                             '- '}
                                        </span>
                                        {change.path}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                <div
                    style={{
                        width: '1.5px',
                        cursor: 'col-resize',
                        background: isDragging ? '#0078d4' : '#333',
                        position: 'relative',
                        zIndex: 1000,
                        flexShrink: 0,
                        margin: '0 -2px',
                        transition: 'background-color 0.2s',
                        userSelect: 'none'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'left')}
                />

                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    minWidth: 0,
                    userSelect: isDragging ? 'none' : 'auto',
                    background: '#000000'
                }}>
                        {selectedFile && (
                        <div style={{ padding: '10px 20px', background: '#000000', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ color: '#61dafb' }}>{selectedFile}</h3>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => setShowFullTerminal(!showFullTerminal)}
                                        className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-white flex items-center"
                                    >
                                        <span className="mr-2">⌘</span>
                                        Terminal
                                    </button>
                                </div>
                            </div>
                        )}
                        
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <p>Loading...</p>
                            </div>
                        ) : selectedFile ? (
                            <div className="flex-1">
                                    <Editor
                                    height="100%"
                                        defaultLanguage={detectLanguage(selectedFile)}
                                        value={fileContent}
                                        onChange={handleEditorChange}
                                        theme="vs-dark"
                                    onMount={handleEditorDidMount}
                                        options={{
                                            minimap: { enabled: true },
                                            fontSize: 14,
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                Select a file to edit
                            </div>
                                    )}
                                </div>
                                        </div>
                <div
                    style={{
                        width: '1px',
                        cursor: 'col-resize',
                        background: isDragging ? '#0078d4' : '#333',
                        position: 'relative',
                        zIndex: 1000,
                        flexShrink: 0,
                        margin: '0 -2px',
                        transition: 'background-color 0.2s',
                        userSelect: 'none'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'right')}
                />

                {/* Code Analyzer Panel with Tabs */}
                {renderCodeAnalyzerPanel()}

                {/* Preview Terminal */}
                {showPreviewTerminal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-[#000000] p-6 rounded-lg shadow-xl border border-[#333] w-[800px] h-[600px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white">Preview Terminal</h3>
                                <button
                                    onClick={() => {
                                        setShowPreviewTerminal(false);
                                        setTerminalLines([]);
                                        setIsInstalling(false);
                                        setIsRunning(false);
                                    }}
                                    className="text-white hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex-1 bg-black rounded-lg overflow-hidden">
                                <Terminal
                                    name="Preview Terminal"
                                    colorMode="dark"
                                    lineData={terminalLines}
                                />
                            </div>
                            <div className="mt-4 flex justify-between">
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                        isRunning ? 'bg-green-500' : 'bg-gray-500'
                                    }`} />
                                    <span className="text-white">
                                        {isInstalling ? 'Installing...' : 
                                         isRunning ? 'Running' : 'Ready'}
                                    </span>
                                </div>
                                {isRunning && (
                                    <a
                                        href="http://localhost:3000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-[#0078d4] hover:bg-[#0086ef] rounded text-white"
                                    >
                                        Open Preview
                                    </a>
                                    )}
                                </div>
                            </div>
                            </div>
                        )}

                {/* New File Dialog */}
                {showNewFileDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#000000] p-6 rounded-lg shadow-xl border border-[#333]">
                            <h3 className="text-white mb-4">Create New File</h3>
                            <input
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                placeholder="Enter file name"
                                className="w-full px-3 py-2 bg-[#333] text-white rounded mb-4 outline-none focus:ring-2 focus:ring-[#0078d4]"
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setShowNewFileDialog(false);
                                        setNewFileName('');
                                    }}
                                    className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFile}
                                    className="px-3 py-1 bg-[#0078d4] hover:bg-[#0086ef] rounded text-white"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Context Menu */}
                {contextMenu.show && (
                    <>
                        <div
                            className="fixed inset-0"
                            onClick={() => setContextMenu({ ...contextMenu, show: false })}
                        />
                        <div
                        className="fixed bg-[#000000] border border-[#333] rounded shadow-lg py-1"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            {contextMenu.type === 'folder' && (
                                <button
                                    onClick={() => {
                                        setCurrentPath(contextMenu.path);
                                        setShowNewFileDialog(true);
                                        setContextMenu({ ...contextMenu, show: false });
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-[#333]"
                                >
                                    New File
                                </button>
                            )}
                            {contextMenu.type === 'file' && (
                                <button
                                    onClick={() => {
                                        handleDeleteFile(contextMenu.path);
                                        setContextMenu({ ...contextMenu, show: false });
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-[#333]"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </>
                )}

            {/* Terminal */}
            {renderTerminal()}
        </div>
        </div>
    );
}

export default RepoViewer;