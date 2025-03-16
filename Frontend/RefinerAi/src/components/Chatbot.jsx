import React, { useState, useEffect, useRef } from 'react';
import { generateChatbot } from '../utils/codeChatbox';

function Chatbot({ analysisContent }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Scroll to bottom whenever chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newMessage]);
    setUserMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateChatbot(analysisContent, [...chatHistory, newMessage]);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#333]">
        <h2 className="text-xl font-semibold text-[#61dafb]">Code Assistant</h2>
        <button
          onClick={clearHistory}
          className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-sm"
        >
          Clear History
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[#0078d4] text-white'
                  : 'bg-[#333] text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#333] text-white p-3 rounded-lg">
              <p>Thinking...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500 text-white p-3 rounded-lg">
              <p>Error: {error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 border-t border-[#333] bg-[#1e1e1e]"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Ask about your code..."
            className="flex-1 px-4 py-2 bg-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userMessage.trim()}
            className={`px-6 py-2 rounded-lg ${
              isLoading || !userMessage.trim()
                ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                : 'bg-[#0078d4] text-white hover:bg-[#0086ef]'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chatbot;