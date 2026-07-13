'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import type { ChatMessage } from '@/types/chat';

interface SearchMessagesProps {
  messages: ChatMessage[];
  onClose: () => void;
  onJumpTo: (messageId: string) => void;
}

export default function SearchMessages({ messages, onClose, onJumpTo }: SearchMessagesProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = messages.filter(
      (m) =>
        !m.isDeleted &&
        m.content.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, messages]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>

        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <span className="text-[12px] text-slate-400 min-w-[40px] text-right">
          {results.length} found
        </span>
      </div>

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto px-4 pb-3 space-y-1 scrollbar-thin">
          {results.map((msg) => (
            <button
              key={msg._id}
              onClick={() => {
                onJumpTo(msg._id);
                onClose();
              }}
              className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-blue-500">
                  {msg.sender === 'me' ? 'You' : 'Partner'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 line-clamp-2">
                {highlightText(msg.content, query)}
              </p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
