import React, { useState } from 'react';
import { analyzeCode } from '../utils/codeAnalyzer';
import Editor from '@monaco-editor/react';

function CodeAnalyser({ code, language = 'javascript' }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
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

            <div className="flex-1 overflow-auto">
                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 m-4 rounded">
                        {error}
                    </div>
                )}

                {analysis ? (
                    <div className="p-6 space-y-6">
                        <h1 className="text-2xl font-bold text-[#61dafb] mb-4">
                            {analysis.title}
                        </h1>

                        <section className="bg-[#ffffff08] p-4 rounded">
                            <h2 className="text-xl text-[#61dafb] mb-2">Overview</h2>
                            <p className="text-gray-300 leading-relaxed">{analysis.overview}</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl text-[#61dafb]">Code Quality</h2>
                            
                            {analysis.codeQuality.strengths.length > 0 && (
                                <div className="ml-4">
                                    <h3 className="text-green-400 mb-2">Strengths</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {analysis.codeQuality.strengths.map((strength, index) => (
                                            <li key={index} className="text-gray-300">{strength}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.codeQuality.weaknesses.length > 0 && (
                                <div className="ml-4">
                                    <h3 className="text-yellow-400 mb-2">Areas for Improvement</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {analysis.codeQuality.weaknesses.map((weakness, index) => (
                                            <li key={index} className="text-gray-300">{weakness}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {analysis.suggestions.length > 0 && (
                            <section>
                                <h2 className="text-xl text-[#61dafb] mb-2">Suggestions</h2>
                                <ul className="list-disc list-inside space-y-1">
                                    {analysis.suggestions.map((suggestion, index) => (
                                        <li key={index} className="text-gray-300">{suggestion}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section className="space-y-4">
                            <h2 className="text-xl text-[#61dafb]">Best Practices</h2>
                            
                            {analysis.bestPractices.followed.length > 0 && (
                                <div className="ml-4">
                                    <h3 className="text-green-400 mb-2">Followed</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {analysis.bestPractices.followed.map((practice, index) => (
                                            <li key={index} className="text-gray-300">{practice}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.bestPractices.missing.length > 0 && (
                                <div className="ml-4">
                                    <h3 className="text-yellow-400 mb-2">Missing</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {analysis.bestPractices.missing.map((practice, index) => (
                                            <li key={index} className="text-gray-300">{practice}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {analysis.securityConcerns.length > 0 && (
                            <section>
                                <h2 className="text-xl text-red-400 mb-2">Security Concerns</h2>
                                <ul className="list-disc list-inside space-y-1">
                                    {analysis.securityConcerns.map((concern, index) => (
                                        <li key={index} className="text-gray-300">{concern}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {(analysis.performance.issues.length > 0 || analysis.performance.recommendations.length > 0) && (
                            <section className="space-y-4">
                                <h2 className="text-xl text-[#61dafb]">Performance</h2>
                                
                                {analysis.performance.issues.length > 0 && (
                                    <div className="ml-4">
                                        <h3 className="text-yellow-400 mb-2">Issues</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {analysis.performance.issues.map((issue, index) => (
                                                <li key={index} className="text-gray-300">{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {analysis.performance.recommendations.length > 0 && (
                                    <div className="ml-4">
                                        <h3 className="text-green-400 mb-2">Recommendations</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {analysis.performance.recommendations.map((rec, index) => (
                                                <li key={index} className="text-gray-300">{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        )}

                        <section className="bg-[#ffffff08] p-4 rounded mt-6">
                            <h2 className="text-xl text-[#61dafb] mb-2">Conclusion</h2>
                            <p className="text-gray-300 leading-relaxed">{analysis.conclusion}</p>
                        </section>
                    </div>
                ) : !loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Click "Analyze Code" to see a detailed analysis
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default CodeAnalyser;