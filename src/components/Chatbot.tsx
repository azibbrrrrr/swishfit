'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const formatResponse = (text: string) => {
  return text.split('\n').map((line, index) => {
    if (line.trim() === '') return null; // Ignore empty lines

    return <p key={index}>{parseBoldText(line)}</p>;
  });
};

const parseBoldText = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const cleanResponse = (text: string) => {
  return text.split('</think>').pop()?.trim() || '';
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const restartSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Show user message immediately
    const newMessages: { text: string; sender: 'user' | 'bot' }[] = [
      ...messages,
      { text: input, sender: 'user' }, // Ensure sender type is correct
      { text: '. . . .', sender: 'bot' }, // Show loading animation
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', { message: input });
      const botReply = cleanResponse(response.data.reply); // Clean the response

      setMessages([
        ...messages,
        { text: input, sender: 'user' },
        { text: botReply, sender: 'bot' },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages([
        ...messages,
        { text: input, sender: 'user' },
        { text: 'Error getting response.', sender: 'bot' },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-purple-800 text-white p-3 rounded-full shadow-lg hover:bg-purple-900"
        whileHover={{ scale: 1.1 }}
      >
        💬
      </motion.button>

      {/* Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-16 right-6 bg-white w-80 rounded-lg shadow-lg border border-gray-300"
        >
          <div className="bg-purple-800 text-white p-3 flex justify-between items-center">
            <span className="font-semibold">
              Chat with AI Rendunks Assistant
            </span>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-300"
            >
              ❌
            </button>
          </div>

          <div className="p-3 h-80 overflow-y-auto flex flex-col space-y-2">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-2 rounded-md max-w-xs text-xs ${msg.sender === 'user' ? 'bg-gray-200 self-end' : 'bg-blue-100 self-start'}`}
              >
                {formatResponse(msg.text)}
              </motion.div>
            ))}
          </div>

          {messages.some((msg) => msg.sender === 'bot') && (
            <div className="p-3 flex items-center justify-center">
              <button
                onClick={restartSession}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700"
              >
                Clear Chat
              </button>
            </div>
          )}

          <div className="p-3 border-t flex items-center">
            <input
              type="text"
              className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className={`p-2 rounded-r-md transition-all ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-800 text-white hover:bg-purple-900'}`}
              disabled={loading}
            >
              ➤
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
