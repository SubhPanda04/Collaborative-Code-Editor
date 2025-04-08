import React, { useState } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "Hi! I'm your AI assistant. How can I help you with your code today?"
    }
  ]);

  const generateResponse = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      // Check if API key is being read
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      console.log("API Key available:", apiKey ? "Yes" : "No");
      
      
      if (!apiKey) {
        throw new Error("API key is not available. Please check your .env file.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log("AI Response:", response);
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return `Failed to fetch response. Error: ${error.message}. Please check your API key and try again.`;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    // Add user message
    const userMessage = { type: 'user', content: prompt };
    setMessages([...messages, userMessage]);
    
    // Store prompt value before clearing
    const currentPrompt = prompt;
    setPrompt(''); // Clear input field immediately
    
    // Get AI response
    const aiResponse = await generateResponse();
    
    // Add AI response to messages
    setMessages(prevMessages => [
      ...prevMessages,
      { type: 'assistant', content: aiResponse }
    ]);
  };

  // Function to render code blocks with syntax highlighting
  const renderCodeBlock = (content) => {
    // Split content by code block markers
    const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const match = part.match(/```([\w-]+)?\n([\s\S]*?)\n```/);
        
        if (match) {
          const [_, language, code] = match;
          return (
            <div key={index} className="my-2 rounded overflow-hidden">
              <SyntaxHighlighter 
                language={language || 'javascript'} 
                style={atomOneDark}
                customStyle={{ margin: 0 }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        }
      }
      
      // Regular text content
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[350px] bg-[#031d38] border-l border-[#1E4976] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E4976]">
        <div className="flex items-center gap-2">
          <FaRobot className="text-purple-400" />
          <span className="text-white font-medium">AI Assistant</span>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Render messages */}
        {messages.map((message, index) => (
          <div key={index} className="flex gap-2 mb-4">
            <div className="flex-shrink-0">
              {message.type === 'assistant' ? (
                <FaRobot className="text-purple-400 mt-1" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  U
                </div>
              )}
            </div>
            <div className={`rounded-lg p-3 text-white text-sm ${
              message.type === 'assistant' ? 'bg-[#132F4C]' : 'bg-[#1E4976]'
            }`}>
              {message.type === 'assistant' && message.content.includes('```') 
                ? renderCodeBlock(message.content)
                : message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1E4976]">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything about your code..."
            className="w-full bg-[#132F4C] text-white rounded-lg pl-4 pr-24 py-3 resize-none h-[100px]
              focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={loading}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={() => setPrompt('')}
              className="p-2 hover:bg-[#1E4976] rounded-md transition-colors"
              disabled={loading}
            >
              <FaTimes className="text-gray-400 hover:text-white" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className={`${
                !prompt.trim() || loading ? 'bg-purple-800 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              } text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <FaPaperPlane className="text-xs" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 