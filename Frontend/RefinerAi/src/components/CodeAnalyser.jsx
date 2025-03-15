import React, { useState } from 'react';
import { analyzeCode } from '../utils/codeAnalyzer';
import { generateQuiz } from '../utils/quizGenerator';
import Editor from '@monaco-editor/react';

function CodeAnalyser({ code, language = 'javascript' }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizzes, setQuizzes] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showAnswers, setShowAnswers] = useState(false);

    const handleAnalyze = async () => {
        if (!code) {
            setError('No code to analyze');
            return;
        }

        setLoading(true);
        setError(null);
        setQuizzes(null);
        setSelectedAnswers({});
        setShowAnswers(false);

        try {
            const result = await analyzeCode(code);
            setAnalysis(result.analysis);
            
            // Generate quizzes from the analysis content
            if (result.analysis) {
                const quizResult = await generateQuiz(result.analysis);
                setQuizzes(quizResult.quizzes);
            }
        } catch (err) {
            setError(err.message || 'Failed to analyze code');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionIndex, answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    // Helper function to safely render markdown content
    const renderMarkdown = (content) => {
        if (!content) return null;
        return <div className="markdown-content">{content}</div>;
    };

    const toggleView = () => {
        if (!analysis) {
            setError('Please analyze the code first');
            return;
        }
        if (!quizzes || quizzes.length === 0) {
            setError('No quizzes available');
            return;
        }
        setShowQuiz(!showQuiz);
        setSelectedAnswers({});
        setShowAnswers(false);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
                <h2 className="text-xl text-[#61dafb]">Code Analysis</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={toggleView}
                        disabled={!analysis || loading}
                        className={`px-4 py-2 rounded ${
                            !analysis || loading
                                ? 'bg-[#333] opacity-50 cursor-not-allowed'
                                : 'bg-[#61dafb] hover:bg-[#70e4ff] cursor-pointer'
                        }`}
                    >
                        {showQuiz ? 'Show Analysis' : 'Take Quiz'}
                    </button>
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
            </div>

            <div className="flex-1 overflow-auto">
                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 m-4 rounded">
                        {error}
                    </div>
                )}

                {analysis && !showQuiz && (
                    <div className="p-6 space-y-6">
                        {renderMarkdown(analysis)}
                    </div>
                )}

                {showQuiz && quizzes && (
                    <div className="p-6">
                        <div className="space-y-6">
                            {quizzes.map((quiz, index) => (
                                <div key={index} className="bg-[#ffffff08] p-4 rounded">
                                    <h3 className="text-lg text-white mb-3">
                                        {index + 1}. {quiz.question}
                                    </h3>
                                    <div className="space-y-2">
                                        {quiz.options.map((option, optIndex) => (
                                            <label
                                                key={optIndex}
                                                className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                                                    selectedAnswers[index] === option
                                                        ? 'bg-[#ffffff15]'
                                                        : 'hover:bg-[#ffffff0a]'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${index}`}
                                                    value={option}
                                                    checked={selectedAnswers[index] === option}
                                                    onChange={() => handleAnswerSelect(index, option)}
                                                    className="text-[#61dafb]"
                                                />
                                                <span className="text-gray-300">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {showAnswers && (
                                        <div className="mt-3">
                                            <div className={`p-2 rounded ${
                                                selectedAnswers[index] === quiz.correctAnswer
                                                    ? 'bg-green-500/20 border border-green-500/50'
                                                    : 'bg-red-500/20 border border-red-500/50'
                                            }`}>
                                                <p className="font-semibold mb-1">
                                                    {selectedAnswers[index] === quiz.correctAnswer
                                                        ? '✓ Correct!'
                                                        : '✗ Incorrect'}
                                                </p>
                                                <p className="text-sm text-gray-300">
                                                    {quiz.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!showAnswers && Object.keys(selectedAnswers).length > 0 && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowAnswers(true)}
                                        className="px-4 py-2 bg-[#0078d4] hover:bg-[#0086ef] rounded"
                                    >
                                        Check Answers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!analysis && !loading && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Click "Analyze Code" to see a detailed analysis
                    </div>
                )}
            </div>
        </div>
    );
}

export default CodeAnalyser;