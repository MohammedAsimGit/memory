'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import type { Settings } from '@/types';

interface ChatMessage {
  _id: string;
  content: string;
  author: string;
  timestamp: string;
  mood?: string;
}

const moodEmojis: Record<string, string> = {
  love: '❤️',
  happy: '😊',
  excited: '🎉',
  grateful: '🙏',
  thinking: '🤔',
  missing: '💭',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      _id: Date.now().toString(),
      content: input.trim(),
      author: activeProfile || 'me',
      timestamp: new Date().toISOString(),
      mood: selectedMood || undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setSelectedMood('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partnerName = activeProfile === 'me'
    ? settings?.partnerName2 || 'My Love'
    : settings?.partnerName1 || 'Partner';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-4"
      >
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Our Chat
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A private space for us 💕
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-thin">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="text-6xl mb-4">💌</div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
              Start a Conversation
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs">
              Send a sweet message to {partnerName}. Every word becomes a cherished memory.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex ${msg.author === activeProfile ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.author === activeProfile
                      ? 'bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] text-white rounded-br-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md rounded-bl-md'
                  }`}
                >
                  {msg.mood && (
                    <span className="text-lg mb-1 block">{moodEmojis[msg.mood]}</span>
                  )}
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.author === activeProfile ? 'text-white/70' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                selectedMood === mood
                  ? 'bg-blue-100 dark:bg-blue-900/50 scale-110 ring-2 ring-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={mood}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Say something sweet to ${partnerName}...`}
              rows={1}
              className="w-full px-4 py-3 text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent resize-none outline-none max-h-24 scrollbar-none"
              style={{ minHeight: '44px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center shadow-lg shadow-blue-400/30 disabled:opacity-40 disabled:shadow-none transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
