import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { getCorrectedCode } from '../utils/codeCorrector';
import Editor from '@monaco-editor/react';
import CodeAnalyser from './CodeAnalyser';
import Header from '../components/header'
const token = import.meta.env.VITE_GITHUB_TOKEN;

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
    const [correctedContent, setCorrectedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [openFolders, setOpenFolders] = useState({});
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('javascript');
    const [isEditing, setIsEditing] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: null, path: '' });
    const [defaultBranch, setDefaultBranch] = useState('');
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [pendingChanges, setPendingChanges] = useState([]);
    const [correctionLoading, setCorrectionLoading] = useState(false);
    const [fileExplorerWidth, setFileExplorerWidth] = useState(300);
    const [codeAnalyzerWidth, setCodeAnalyzerWidth] = useState(400);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartWidth, setDragStartWidth] = useState(0);
    const [dragType, setDragType] = useState(null);

    useEffect(() => {
        if (repoUrl) {
            handleFetchRepo();
            fetchDefaultBranch();
        }
    }, [repoUrl]);

    const extractOwnerAndRepo = (url) => {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        return match ? [match[1], match[2]] : [null, null];
    };
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
    

    const handleFetchRepo = async () => {
        setError(null);
        const [owner, repo] = extractOwnerAndRepo(repoUrl);

        if (!owner || !repo) {
            setError('Invalid repository URL');
            return;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents`;
        const allFiles = await fetchContents(url, setError);
        setFiles(allFiles);
    };

    const fetchDefaultBranch = async () => {
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
            setCorrectedContent('');
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

        setCorrectionLoading(true);
        setError(null);
        
        try {
            const corrected = await getCorrectedCode(fileContent);
            console.log('Corrected code response:', corrected);
            
            if (corrected && typeof corrected === 'object' && corrected.code) {
                setCorrectedContent(corrected.code);
            } else {
                throw new Error('Invalid response format from code correction');
            }
        } catch (error) {
            console.error('Error correcting code:', error);
            setError('Error correcting code: ' + (error.message || 'Unknown error'));
            setCorrectedContent('');
        } finally {
            setCorrectionLoading(false);
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
        const [owner, repo] = extractOwnerAndRepo(repoUrl);
        
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/contents/${selectedFile}?ref=${defaultBranch}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );
            
            const sha = response.data.sha;
            const encodedContent = btoa(fileContent);
            
            await axios.put(
                `https://api.github.com/repos/${owner}/${repo}/contents/${selectedFile}`,
                {
                    message: `Update ${selectedFile}`,
                    content: encodedContent,
                    sha,
                    branch: defaultBranch,
                },
                {
                    headers: { Authorization: `token ${token}` },
                }
            );
            
            setIsEditing(false);
            addToPendingChanges('modify', selectedFile);
        } catch (error) {
            console.error('Error saving file:', error);
            setError('Failed to save file');
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
            const itemPath = `${parentPath}${item.name}`;

            if (item.type === 'dir') {
                return (
                    <div key={item.path} style={{ marginLeft: '20px' }}>
                        <div
                            onContextMenu={(e) => handleContextMenu(e, 'folder', itemPath)}
                            onClick={() => toggleFolder(itemPath)}
                            style={{ cursor: 'pointer', fontWeight: 'bold', padding: '4px 0' }}
                            className="hover:bg-[#ffffff15] rounded px-2"
                        >
                            {openFolders[itemPath] ? '📂 ' : '📁 '} {item.name}
                        </div>
                        {openFolders[itemPath] && item.contents && (
                            <div>{renderFileTree(item.contents, `${itemPath}/`)}</div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div
                        key={item.path}
                        onContextMenu={(e) => handleContextMenu(e, 'file', item.path)}
                        onClick={() => fetchFileContent(item.path)}
                        style={{ marginLeft: '20px', cursor: 'pointer', padding: '4px 0' }}
                        className={`hover:bg-[#ffffff15] rounded px-2 ${
                            selectedFile === item.path ? 'bg-[#ffffff25]' : ''
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

        const [owner, repo] = extractOwnerAndRepo(repoUrl);
        setLoading(true);
        
        try {
            // Get the reference to the default branch
            const refResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );
            
            const baseTreeSha = refResponse.data.object.sha;

            // Get the current commit to get its tree
            const baseCommitResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseTreeSha}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            // Create blobs for each changed file
            const blobPromises = pendingChanges
                .filter(change => change.type !== 'delete')
                .map(async change => {
                    const content = change.type === 'create' ? '' : fileContent;
                    const blobResponse = await axios.post(
                        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
                        {
                            content: content,
                            encoding: 'utf-8',
                        },
                        {
                            headers: { Authorization: `token ${token}` },
                        }
                    );
                    return {
                        path: change.path,
                        sha: blobResponse.data.sha,
                        type: change.type,
                    };
                });

            const blobs = await Promise.all(blobPromises);

            // Create a new tree
            const treeItems = blobs.map(blob => ({
                path: blob.path,
                mode: '100644',
                type: 'blob',
                sha: blob.sha,
            }));

            const newTreeResponse = await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/git/trees`,
                {
                    base_tree: baseCommitResponse.data.tree.sha,
                    tree: treeItems,
                },
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            // Create a new commit
            const newCommitResponse = await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/git/commits`,
                {
                    message: commitMessage,
                    tree: newTreeResponse.data.sha,
                    parents: [baseTreeSha],
                },
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            // Update the reference
            await axios.patch(
                `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
                {
                    sha: newCommitResponse.data.sha,
                },
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            setPendingChanges([]);
            setShowCommitDialog(false);
            setCommitMessage('');
            handleFetchRepo();
            setError(null);
        } catch (error) {
            console.error('Error committing changes:', error);
            if (error.response) {
                if (error.response.status === 404) {
                    setError('Repository or branch not found. Please check your permissions.');
                } else if (error.response.status === 401) {
                    setError('Authentication failed. Please check your GitHub token.');
                } else if (error.response.data && error.response.data.message) {
                    setError(`GitHub API Error: ${error.response.data.message}`);
                } else {
                    setError('Failed to commit changes. Please try again.');
                }
            } else {
                setError('Network error occurred. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResizeStart = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragType(type);
        if (type === 'left') {
            setDragStartWidth(fileExplorerWidth);
        } else {
            setDragStartWidth(codeAnalyzerWidth);
        }
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
    };

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
    }, [isDragging, dragStartX, dragStartWidth, dragType]);

    

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
                                {isEditing && (
                                    <button
                                        onClick={handleSaveFile}
                                        className="px-3 py-1 bg-[#0078d4] hover:bg-[#0086ef] rounded"
                                    >
                                        Save
                                    </button>
                                )}
                                <button
                                    onClick={handleCorrectCode}
                                    disabled={correctionLoading}
                                    className={`px-3 py-1 ${
                                        correctionLoading 
                                            ? 'bg-[#333] opacity-50 cursor-not-allowed' 
                                            : 'bg-[#333] hover:bg-[#444] cursor-pointer'
                                    } rounded flex items-center space-x-2`}
                                >
                                    {correctionLoading ? (
                                        <>
                                            <span className="inline-block animate-spin mr-2">⟳</span>
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Analyze Code'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p>Loading...</p>
                        </div>
                    ) : selectedFile ? (
                        <div className="flex-1 flex">
                            <div style={{ flex: 1, height: '100%', background: '#000000' }}>
                                <Editor
                                    height="100%"
                                    defaultLanguage={detectLanguage(selectedFile)}
                                    value={fileContent}
                                    onChange={(value) => {
                                        setFileContent(value);
                                        setIsEditing(true);
                                    }}
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
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            Select a file to edit
                        </div>
                    )}
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

                {/* Code Analyzer Panel */}
                <div style={{ 
                    width: `${codeAnalyzerWidth}px`, 
                    borderLeft: '1px solid #333', 
                    height: '100%', 
                    overflow: 'auto',
                    position: 'relative',
                    flexShrink: 0,
                    userSelect: isDragging ? 'none' : 'auto',
                    background: '#000000'
                }}>
                    <CodeAnalyser code={fileContent} language={selectedFile ? detectLanguage(selectedFile) : 'plaintext'} />
                </div>

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

                {/* Commit Dialog */}
                {showCommitDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-[#000000] p-6 rounded-lg shadow-xl w-[500px] border border-[#333]">
                            <h3 className="text-white mb-4">Commit Changes</h3>
                            <div className="mb-4">
                                <h4 className="text-[#61dafb] mb-2">Changes to commit:</h4>
                                {pendingChanges.map((change, index) => (
                                    <div key={index} className="text-sm mb-1 text-white">
                                        {change.type === 'create' ? '+ ' :
                                         change.type === 'modify' ? '~ ' :
                                         '- '}
                                        {change.path}
                                    </div>
                                ))}
                            </div>
                            <textarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Enter commit message"
                                className="w-full px-3 py-2 bg-[#333] text-white rounded mb-4 outline-none focus:ring-2 focus:ring-[#0078d4] min-h-[100px]"
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setShowCommitDialog(false);
                                        setCommitMessage('');
                                    }}
                                    className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCommitChanges}
                                    className="px-3 py-1 bg-[#0078d4] hover:bg-[#0086ef] rounded text-white"
                                >
                                    Commit
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
            </div>
        </div>
    );
};

export default RepoViewer;