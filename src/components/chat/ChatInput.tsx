'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import { uploadFile } from '@/hooks/useApi';

interface ChatInputProps {
  onSend: (data: { content: string; type?: string; replyTo?: string; attachments?: any[] }) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export default function ChatInput({ onSend, onTyping, onStopTyping }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { replyingTo, setReplyingTo, editingMessage, setEditingMessage } = useChatStore();

  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleInput = (value: string) => {
    setInput(value);
    if (value.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    if (editingMessage) {
      onSend({ content: input.trim(), type: 'text' });
      setEditingMessage(null);
    } else {
      onSend({
        content: input.trim(),
        type: 'text',
        replyTo: replyingTo?._id,
      });
      setReplyingTo(null);
    }

    setInput('');
    onStopTyping();
    textareaRef.current?.style.setProperty('height', '44px');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      if (editingMessage) setEditingMessage(null);
      if (replyingTo) setReplyingTo(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      const type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'voice'
        : 'document';

      onSend({
        content: '',
        type,
        replyTo: replyingTo?._id,
        attachments: [{ url, type, name: file.name, size: file.size }],
      });
      setReplyingTo(null);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = '44px';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {(replyingTo || editingMessage) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
              <div className="w-0.5 h-8 rounded-full bg-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-blue-500">
                  {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender === 'me' ? 'yourself' : 'partner'}`}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                  {editingMessage?.content || replyingTo?.content}
                </p>
              </div>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setEditingMessage(null);
                  setInput('');
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </motion.button>

          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                handleInput(e.target.value);
                handleInputHeight(e);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full px-4 py-2.5 text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent resize-none outline-none max-h-24 scrollbar-none"
              style={{ height: '44px' }}
            />
          </div>

          <AnimatePresence mode="wait">
            {input.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                whileTap={{ scale: 0.85 }}
                onClick={handleSend}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center shadow-md shadow-blue-400/30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </motion.button>
            ) : (
              <motion.button
                key="voice"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                whileTap={{ scale: 0.85 }}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
