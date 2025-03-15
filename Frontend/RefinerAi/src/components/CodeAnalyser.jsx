import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeCode } from '../utils/codeAnalyzer'
import rehypeHighlight from 'rehype-highlight';

function CodeAnalyser({ code, language = 'javascript', onExplain }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedText, setSelectedText] = useState('');
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    const handleAnalyze = async () => {
        if (!code) {
            setError('No code to analyze');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await analyzeCode(code);
            setAnalysis(result.analysis);
        } catch (err) {
            setError(err.message || 'Failed to analyze code');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text) {
            setSelectedText(text);

            // Get bounding box of the selection
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Set button position
            setButtonPosition({
                top: rect.top + window.scrollY - 30,
                left: rect.left + window.scrollX,
            });
        } else {
            setSelectedText('');
        }
    };

    const handleExplain = () => {
        if (onExplain && selectedText) {
            onExplain(selectedText);
        }
        setSelectedText('');
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-white" onMouseUp={handleMouseUp}>
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
                <h2 className="text-xl text-[#61dafb]">Code Analysis</h2>
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className={`px-4 py-2 rounded ${
                        loading
                            ? 'bg-[#333] opacity-50 cursor-not-allowed'
                            : 'bg-[#0078d4] hover:bg-[#0086ef] cursor-pointer'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center">
                            <span className="animate-spin mr-2">⟳</span>
                            Analyzing...
                        </span>
                    ) : (
                        'Analyze Code'
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 m-4 rounded">
                        {error}
                    </div>
                )}

                {analysis ? (
                    <ReactMarkdown
                        // className="prose prose-invert max-w-none"
                        rehypePlugins={[rehypeHighlight]}
                    >
                        {analysis}
                    </ReactMarkdown>
                ) : !loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Click "Analyze Code" to see a detailed analysis
                    </div>
                ) : null}
            </div>

            {/* Floating Explain Button */}
            {selectedText && (
                <button
                    ref={buttonRef}
                    style={{
                        position: 'absolute',
                        top: `${buttonPosition.top}px`,
                        left: `${buttonPosition.left}px`,
                        zIndex: 1000,
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600"
                    onClick={handleExplain}
                >
                    Explain
                </button>
            )}
        </div>
    );
}

export default CodeAnalyser;
