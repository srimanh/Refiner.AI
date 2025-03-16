import React, { useState, useEffect } from 'react';
import { analyzeCode } from '../utils/codeAnalyzer';
import { generateQuiz } from '../utils/quizGenerator';
import { generateCodePractice } from '../utils/codePractice';
import { resultCode } from '../utils/codeResult';
import Editor from '@monaco-editor/react';
import Chatbot from './Chatbot';

function CodeAnalyser({ code, language = 'javascript' }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizzes, setQuizzes] = useState(null);
    const [practiceProblem, setPracticeProblem] = useState(null);
    const [userSolution, setUserSolution] = useState('');
    const [showQuiz, setShowQuiz] = useState(false);
    const [showChatbox, setShowChatbox] = useState(false);
    const [showPractice, setShowPractice] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showAnswers, setShowAnswers] = useState(false);
    const [editorHeight, setEditorHeight] = useState('50vh');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartHeight, setDragStartHeight] = useState(0);
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const handleAnalyze = async () => {
        if (!code) {
            setError('No code to analyze');
            return;
        }

        setLoading(true);
        setError(null);
        setQuizzes(null);
        setPracticeProblem(null);
        setUserSolution('');
        setSelectedAnswers({});
        setShowAnswers(false);

        try {
            const result = await analyzeCode(code);
            setAnalysis(result.analysis);
            
            // Generate quizzes and practice problem from the analysis content
            if (result.analysis) {
                const [quizResult, practiceResult] = await Promise.all([
                    generateQuiz(result.analysis),
                    generateCodePractice(result.analysis)
                ]);
                setQuizzes(quizResult.quizzes);
                setPracticeProblem(practiceResult);
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

    const toggleView = (view) => {
        if (!analysis) {
            setError('Please analyze the code first');
            return;
        }

        if (view === 'quiz') {
            if (!quizzes || quizzes.length === 0) {
                setError('No quizzes available');
                return;
            }
            setShowQuiz(true);
            setShowPractice(false);
            setShowChatbox(false);
            setSelectedAnswers({});
            setShowAnswers(false);
        } else if (view === 'practice') {
            if (!practiceProblem) {
                setError('No practice problem available');
                return;
            }
            setShowQuiz(false);
            setShowPractice(true);
            setShowChatbox(false);
        } else if (view === 'chat') {
            setShowQuiz(false);
            setShowPractice(false);
            setShowChatbox(true);
        } else {
            setShowQuiz(false);
            setShowPractice(false);
            setShowChatbox(false);
        }
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartHeight(parseInt(editorHeight));
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        const diff = dragStartY - e.clientY;
        const newHeight = Math.max(30, Math.min(70, dragStartHeight + (diff / window.innerHeight * 100)));
        setEditorHeight(`${newHeight}vh`);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, dragStartY, dragStartHeight]);

    const handleSubmitSolution = async () => {
        if (!userSolution.trim()) {
            setError('Please write your solution before submitting');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setShowResult(false);

        try {
            const result = await resultCode(practiceProblem.problemStatement, userSolution);
            setResult(result.analysis);
            setShowResult(true);
        } catch (err) {
            setError(err.message || 'Failed to submit solution');
            console.error('Submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
            <div className="flex flex-col">
                <div className="flex items-center px-2 bg-[#252526]">
                    <div className="flex space-x-[1px]">
                        <button
                            onClick={() => toggleView('analysis')}
                            disabled={!analysis || loading}
                            className={`px-4 h-9 flex items-center text-sm transition-colors relative ${
                                !analysis || loading
                                    ? 'bg-[#2d2d2d] text-[#6d6d6d] cursor-not-allowed'
                                    : !showQuiz && !showPractice && !showChatbox
                                        ? 'bg-[#1e1e1e] text-white'
                                        : 'bg-[#2d2d2d] text-[#969696] hover:text-white'
                            } ${!showQuiz && !showPractice && !showChatbox ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#0078d4]' : ''}`}
                        >
                            Analysis
                        </button>
                        <button
                            onClick={() => toggleView('quiz')}
                            disabled={!analysis || loading}
                            className={`px-4 h-9 flex items-center text-sm transition-colors relative ${
                                !analysis || loading
                                    ? 'bg-[#2d2d2d] text-[#6d6d6d] cursor-not-allowed'
                                    : showQuiz
                                        ? 'bg-[#1e1e1e] text-white'
                                        : 'bg-[#2d2d2d] text-[#969696] hover:text-white'
                            } ${showQuiz ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#0078d4]' : ''}`}
                        >
                            Quiz
                        </button>
                        <button
                            onClick={() => toggleView('chat')}
                            disabled={!analysis || loading}
                            className={`px-4 h-9 flex items-center text-sm transition-colors relative ${
                                !analysis || loading
                                    ? 'bg-[#2d2d2d] text-[#6d6d6d] cursor-not-allowed'
                                    : showChatbox
                                        ? 'bg-[#1e1e1e] text-white'
                                        : 'bg-[#2d2d2d] text-[#969696] hover:text-white'
                            } ${showChatbox ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#0078d4]' : ''}`}
                        >
                            Bot
                        </button>
                        <button
                            onClick={() => toggleView('practice')}
                            disabled={!analysis || loading}
                            className={`px-4 h-9 flex items-center text-sm transition-colors relative ${
                                !analysis || loading
                                    ? 'bg-[#2d2d2d] text-[#6d6d6d] cursor-not-allowed'
                                    : showPractice
                                        ? 'bg-[#1e1e1e] text-white'
                                        : 'bg-[#2d2d2d] text-[#969696] hover:text-white'
                            } ${showPractice ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#0078d4]' : ''}`}
                        >
                            Practice
                        </button>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className={`px-3 py-1 my-1 rounded-sm text-sm transition-colors ${
                            loading
                                ? 'bg-[#2d2d2d] text-[#6d6d6d] cursor-not-allowed'
                                : 'bg-[#0078d4] text-white hover:bg-[#0086ef]'
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

                {analysis && !showQuiz && !showPractice && !showChatbox && (
                    <div className="p-6 space-y-8">
                        {/* Executive Summary */}
                        <div className="bg-[#ffffff08] p-4 rounded">
                            <h2 className="text-xl text-[#61dafb] mb-4">Executive Summary</h2>
                            <p className="text-gray-300">{analysis.executiveSummary}</p>
                        </div>

                        {/* Concept Mastery Assessment */}
                        <div className="bg-[#ffffff08] p-4 rounded">
                            <h2 className="text-xl text-[#61dafb] mb-4">Concept Mastery Assessment</h2>
                            <div className="space-y-4">
                                {analysis.conceptMasteryAssessment?.map((concept, index) => (
                                    <div key={index} className="border-b border-[#333] pb-4 last:border-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg text-white">{concept.concept}</h3>
                                            <div className="flex items-center">
                                                <span className="text-gray-400 mr-2">Score:</span>
                                                <span className={`px-2 py-1 rounded ${
                                                    concept.score >= 4 ? 'bg-green-500/20 text-green-400' :
                                                    concept.score >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {concept.score}/5
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-300">{concept.evidence}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Findings */}
                        <div className="bg-[#ffffff08] p-4 rounded">
                            <h2 className="text-xl text-[#61dafb] mb-4">Detailed Findings</h2>
                            <div className="space-y-6">
                                {analysis.detailedFindings?.map((finding, index) => (
                                    <div key={index} className="border-b border-[#333] pb-6 last:border-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg text-white">{finding.issue}</h3>
                                            <span className="text-sm bg-[#333] px-2 py-1 rounded">
                                                Line {finding.lineNumber}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 mb-3">{finding.description}</p>
                                        
                                        {finding.codeExample && (
                                            <pre className="bg-[#1e1e1e] p-3 rounded mb-3 overflow-x-auto">
                                                <code className="text-sm text-gray-300">{finding.codeExample}</code>
                                            </pre>
                                        )}
                                        
                                        <div className="space-y-2 mb-3">
                                            <p className="text-[#61dafb]">Initial Hint:</p>
                                            <p className="text-gray-300">{finding.initialHint}</p>
                                        </div>

                                        {finding.progressiveHints?.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                <p className="text-[#61dafb]">Progressive Hints:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {finding.progressiveHints.map((hint, hintIndex) => (
                                                        <li key={hintIndex} className="text-gray-300">{hint}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="space-y-2 mb-3">
                                            <p className="text-[#61dafb]">Key Principles:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {finding.keyPrinciples?.map((principle, principleIndex) => (
                                                    <li key={principleIndex} className="text-gray-300">{principle}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[#61dafb]">Impact:</p>
                                            <p className="text-gray-300">{finding.impact}</p>
                                        </div>

                                        {finding.documentationUrl && (
                                            <a 
                                                href={finding.documentationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-3 text-[#61dafb] hover:underline"
                                            >
                                                📚 Learn More
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Learning Priority Matrix */}
                        <div className="bg-[#ffffff08] p-4 rounded">
                            <h2 className="text-xl text-[#61dafb] mb-4">Learning Priority Matrix</h2>
                            {analysis.learningPriorityMatrix && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-white mb-2">High Impact Issues:</h3>
                                        <ul className="list-disc list-inside text-gray-300">
                                            {analysis.learningPriorityMatrix.highImpact?.map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-white mb-2">Medium Impact Issues:</h3>
                                        <ul className="list-disc list-inside text-gray-300">
                                            {analysis.learningPriorityMatrix.mediumImpact?.map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-white mb-2">Low Impact Issues:</h3>
                                        <ul className="list-disc list-inside text-gray-300">
                                            {analysis.learningPriorityMatrix.lowImpact?.map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-white mb-2">Learning Dependencies:</h3>
                                        <p className="text-gray-300">{analysis.learningPriorityMatrix.dependencies}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showQuiz && quizzes && (
                    <div className="p-6">
                        <div className="space-y-6">
                            {quizzes.map((quiz, index) => (
                                <div key={index} className="bg-[#ffffff08] p-4 rounded">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg text-white flex-1">
                                        {index + 1}. {quiz.question}
                                    </h3>
                                        <div className="flex items-center space-x-3 ml-4">
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                quiz.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                                quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {quiz.difficulty ? (
                                                    quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)
                                                ) : 'Medium'}
                                            </span>
                                            <span className="bg-[#333] px-2 py-1 rounded text-sm text-gray-300">
                                                {quiz.category || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {quiz.options.map((option, optIndex) => (
                                            <label
                                                key={optIndex}
                                                className={`flex items-center space-x-2 p-3 rounded cursor-pointer transition-colors ${
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
                                        <div className="mt-4 space-y-3">
                                            <div className={`p-3 rounded ${
                                                selectedAnswers[index] === quiz.correctAnswer
                                                    ? 'bg-green-500/20 border border-green-500/50'
                                                    : 'bg-red-500/20 border border-red-500/50'
                                            }`}>
                                                <div className="flex items-center mb-2">
                                                    <span className={`text-lg mr-2 ${
                                                        selectedAnswers[index] === quiz.correctAnswer
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                    }`}>
                                                        {selectedAnswers[index] === quiz.correctAnswer ? '✓' : '✗'}
                                                    </span>
                                                    <p className="font-semibold text-gray-200">
                                                    {selectedAnswers[index] === quiz.correctAnswer
                                                            ? 'Correct!'
                                                            : `Incorrect. The correct answer is: ${quiz.correctAnswer}`}
                                                </p>
                                                </div>
                                                <p className="text-gray-300">
                                                    {quiz.explanation}
                                                </p>
                                            </div>

                                            {quiz.relatedConcepts && quiz.relatedConcepts.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-[#61dafb] text-sm mb-1">Related Concepts:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {quiz.relatedConcepts.map((concept, conceptIndex) => (
                                                            <span
                                                                key={conceptIndex}
                                                                className="bg-[#ffffff08] px-2 py-1 rounded text-sm text-gray-300"
                                                            >
                                                                {concept}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-between items-center mt-6">
                                <div className="text-gray-400">
                                    {showAnswers 
                                        ? `Score: ${quizzes.reduce((acc, _, idx) => 
                                            acc + (selectedAnswers[idx] === quizzes[idx].correctAnswer ? 1 : 0), 0
                                        )}/${quizzes.length}`
                                        : `${Object.keys(selectedAnswers).length}/${quizzes.length} questions answered`
                                    }
                                </div>
                            {!showAnswers && Object.keys(selectedAnswers).length > 0 && (
                                    <button
                                        onClick={() => setShowAnswers(true)}
                                        className="px-4 py-2 bg-[#0078d4] hover:bg-[#0086ef] rounded transition-colors"
                                    >
                                        Check Answers
                                    </button>
                                )}
                                </div>
                        </div>
                    </div>
                )}
                {showChatbox && analysis && (
                    <div className="h-full">
                        <Chatbot code={code} analysisContent={analysis} />
                    </div>
                )}

                {showPractice && practiceProblem && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div 
                            className="flex-none p-6 space-y-6 overflow-y-auto" 
                            style={{ maxHeight: `calc(100vh - ${editorHeight} - 100px)` }}
                        >
                            <div>
                                <h3 className="text-xl text-[#61dafb] mb-4">Problem Statement</h3>
                                <p className="text-gray-300">{practiceProblem.problemStatement}</p>
                            </div>

                            {practiceProblem.requirements && (
                                <div>
                                    <h3 className="text-lg text-[#61dafb] mb-2">Requirements</h3>
                                    <ul className="list-disc list-inside text-gray-300">
                                        {practiceProblem.requirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {practiceProblem.hints && (
                                <div>
                                    <h3 className="text-lg text-[#61dafb] mb-2">Hints</h3>
                                    <ul className="list-disc list-inside text-gray-300">
                                        {practiceProblem.hints.map((hint, index) => (
                                            <li key={index}>{hint}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {practiceProblem.testCases && (
                                <div>
                                    <h3 className="text-lg text-[#61dafb] mb-2">Test Cases</h3>
                                    <div className="space-y-2">
                                        {practiceProblem.testCases.map((test, index) => (
                                            <div key={index} className="bg-[#ffffff08] p-3 rounded">
                                                <div className="text-gray-300">
                                                    <span className="text-[#61dafb]">Input:</span>{' '}
                                                    {typeof test.input === 'object' 
                                                        ? JSON.stringify(test.input, null, 2)
                                                        : test.input
                                                    }
                                                </div>
                                                <div className="text-gray-300">
                                                    <span className="text-[#61dafb]">Expected Output:</span>{' '}
                                                    {typeof test.expectedOutput === 'object'
                                                        ? JSON.stringify(test.expectedOutput, null, 2)
                                                        : (test.expectedOutput || test.output)
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div 
                            className="h-1 bg-[#333] cursor-ns-resize hover:bg-[#61dafb] transition-colors"
                            onMouseDown={handleDragStart}
                        />

                        <div 
                            className="flex-1 border-t border-[#333]"
                            style={{ height: editorHeight }}
                        >
                            <div className="h-full">
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    value={userSolution}
                                    onChange={setUserSolution}
                                    theme="vs-dark"
                                    onMount={(editor) => {
                                        editor.focus();
                                        editor.getModel().updateOptions({
                                            tabSize: 4,
                                            insertSpaces: true,
                                            wordWrap: 'on',
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                        });
                                    }}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        wordWrap: 'on',
                                        automaticLayout: true,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        tabSize: 4,
                                        insertSpaces: true,
                                        renderWhitespace: 'selection',
                                        scrollbar: {
                                            vertical: 'visible',
                                            horizontal: 'visible',
                                            useShadows: false,
                                            verticalScrollbarSize: 10,
                                            horizontalScrollbarSize: 10,
                                            arrowSize: 30,
                                        },
                                        suggestOnTriggerCharacters: true,
                                        acceptSuggestionOnEnter: "on",
                                        tabCompletion: "on",
                                        wordBasedSuggestions: "on",
                                        parameterHints: {
                                            enabled: true
                                        },
                                        snippetSuggestions: "top",
                                        formatOnPaste: true,
                                        formatOnType: true,
                                        folding: true,
                                        foldingStrategy: "indentation",
                                        showFoldingControls: "always",
                                        matchBrackets: "always",
                                        autoClosingBrackets: "always",
                                        autoClosingQuotes: "always",
                                        autoIndent: "advanced",
                                        autoSurround: "languageDefined",
                                        bracketPairColorization: {
                                            enabled: true
                                        },
                                        guides: {
                                            indentation: true,
                                            bracketPairs: true,
                                            bracketPairsHorizontal: true,
                                            highlightActiveIndentation: true,
                                            highlightActiveBracketPair: true
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-none p-4 border-t border-[#333] flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-400">
                                    {practiceProblem.difficulty && `Difficulty: ${practiceProblem.difficulty}`}
                                    {practiceProblem.timeLimit && ` • Time Limit: ${practiceProblem.timeLimit} minutes`}
                                </span>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => {
                                        setUserSolution('');
                                        setResult(null);
                                        setShowResult(false);
                                    }}
                                    className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded"
                                >
                                    Clear Code
                                </button>
                                <button
                                    onClick={handleSubmitSolution}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded ${
                                        loading
                                            ? 'bg-[#333] opacity-50 cursor-not-allowed'
                                            : 'bg-[#0078d4] hover:bg-[#0086ef]'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <span className="animate-spin mr-2">⟳</span>
                                            Submitting...
                                        </span>
                                    ) : (
                                        'Submit Solution'
                                    )}
                                </button>
                            </div>
                        </div>

                        {showResult && result && (
                            <div className="flex-none border-t border-[#333] bg-[#ffffff08]">
                                <div className="p-4 flex justify-between items-center border-b border-[#333]">
                                    <h3 className="text-lg text-[#61dafb]">Test Results</h3>
                                    <button
                                        onClick={() => {
                                            setResult(null);
                                            setShowResult(false);
                                        }}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="p-4 max-h-[300px] overflow-y-auto">
                                    <div className="text-gray-300 whitespace-pre-wrap">
                                        {result}
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-xl flex flex-col items-center">
                                    <div className="animate-spin text-4xl text-[#61dafb] mb-4">⟳</div>
                                    <p className="text-gray-300">Evaluating your solution...</p>
                                </div>
                            </div>
                        )}
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