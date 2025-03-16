import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { generateCodePractice } from '../utils/codePractice';

function PracticeCode({ codeAnalysis }) {
    const [problem, setProblem] = useState(null);
    const [userSolution, setUserSolution] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProblemStatement = async () => {
            if (!codeAnalysis) {
                setError('No code analysis available. Please analyze some code first.');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const problemData = await generateCodePractice(codeAnalysis);
                setProblem(problemData);
                console.log('Generated problem:', problemData);
            } catch (err) {
                setError(err.message || 'Failed to generate practice problem');
                console.error('Error generating practice problem:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProblemStatement();
    }, [codeAnalysis]);

    const handleSubmit = () => {
        // TODO: Implement solution validation
        console.log('User solution:', userSolution);
    };

    if (error) {
        return (
            <div className="p-6 text-red-500">
                {error}
                <div className="mt-4 text-sm text-gray-400">
                    <p>To generate a practice problem:</p>
                    <ol className="list-decimal list-inside mt-2">
                        <li>Select a file in the editor</li>
                        <li>Click "Analyze Code"</li>
                        <li>Wait for the analysis to complete</li>
                        <li>The practice problem will be generated automatically</li>
                    </ol>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin mr-2">⟳</div>
                Generating practice problem...
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="p-6 text-gray-400">
                No practice problem available yet. Please analyze some code first.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-xl text-[#61dafb] mb-4">Problem Statement</h3>
                    <p className="text-gray-300">{problem.problemStatement}</p>
                </div>

                {problem.requirements && (
                    <div>
                        <h3 className="text-lg text-[#61dafb] mb-2">Requirements</h3>
                        <ul className="list-disc list-inside text-gray-300">
                            {problem.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {problem.hints && (
                    <div>
                        <h3 className="text-lg text-[#61dafb] mb-2">Hints</h3>
                        <ul className="list-disc list-inside text-gray-300">
                            {problem.hints.map((hint, index) => (
                                <li key={index}>{hint}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {problem.testCases && (
                    <div>
                        <h3 className="text-lg text-[#61dafb] mb-2">Test Cases</h3>
                        <div className="space-y-2">
                            {problem.testCases.map((test, index) => (
                                <div key={index} className="bg-[#ffffff08] p-3 rounded">
                                    <div className="text-gray-300">
                                        <span className="text-[#61dafb]">Input:</span> {test.input}
                                    </div>
                                    <div className="text-gray-300">
                                        <span className="text-[#61dafb]">Output:</span> {test.output}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 border-t border-[#333]">
                <div className="h-full">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        value={userSolution}
                        onChange={setUserSolution}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            automaticLayout: true,
                        }}
                    />
                </div>
            </div>

            <div className="p-4 border-t border-[#333] flex justify-end">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-[#0078d4] hover:bg-[#0086ef] rounded"
                >
                    Submit Solution
                </button>
            </div>
        </div>
    );
}

export default PracticeCode; 