import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  AI_CHAT_INTRO,
  AI_CHAT_QUICK_PROMPTS,
  aiThinkingDelayMs,
  getAiChatFixedAnswer,
} from '../data/legalAiFixedReplies';

export default function AIChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([{ role: 'ai' as const, content: AI_CHAT_INTRO }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const consumedInitialQuestionRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q')?.trim() || '';
    if (!q) return;
    if (consumedInitialQuestionRef.current === q) return;
    consumedInitialQuestionRef.current = q;
    void sendMessage(q);
  }, [location.search]);

  const sendMessage = async (rawText: string) => {
    const userMessage = rawText.trim();
    if (!userMessage || isLoading) return;
    const answer = getAiChatFixedAnswer(userMessage);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, aiThinkingDelayMs()));
    setMessages((prev) => [...prev, { role: 'ai', content: answer }]);
    setIsLoading(false);
  };

  const handleSend = async () => {
    await sendMessage(input);
  };

  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 w-fit transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span> 返回
      </button>

      <div className="flex-1 bg-white rounded-2xl border border-outline-variant flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white">gavel</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-on-surface">智能法律咨询助手</h2>
            <p className="text-xs text-primary">专业 · 高效 · 实时解答</p>
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-lowest">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-surface-container-low text-on-surface rounded-tl-sm border border-outline-variant'
                }`}
              >
                {msg.role === 'ai' ? (
                  <div className="markdown-body prose max-w-none prose-p:leading-relaxed">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl bg-surface-container-low text-on-surface rounded-tl-sm flex items-center gap-2 border border-outline-variant">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-outline-variant">
          <div className="mb-3 flex flex-wrap gap-2">
            {AI_CHAT_QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs rounded-full border border-outline-variant bg-surface-container-low hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的法律问题，或点击上方提示词直接咨询"
              disabled={isLoading}
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
