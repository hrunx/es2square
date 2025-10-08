import React, { useState, useRef, useEffect } from 'react';
import { Bot, SendHorizonal, X, AlertCircle } from 'lucide-react';
import { talkToAuden } from '../lib/auden';
import type { Message } from '../types/auden';

export default function AudenChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Auden, your AI energy audit assistant. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Only send user and assistant messages to the API
      const chatHistory = messages.filter(m => m.role !== 'system');
      const response = await talkToAuden([...chatHistory, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again in a moment.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[360px] h-[450px] rounded-lg shadow-xl bg-white border border-gray-300 flex flex-col">
          <div className="bg-green-700 text-white px-4 py-2 flex justify-between items-center rounded-t-lg">
            <h3 className="text-sm font-semibold">Auden AI Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4" 
            ref={chatContainerRef}
          >
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg px-4 py-2 mx-4">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SendHorizonal size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-green-700 hover:bg-green-800 text-white p-3 rounded-full shadow-lg group relative"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with Auden AI
          </span>
        </button>
      )}
    </div>
  );
}