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
      setTimeout(() => textareaRef.current?.focus(), 50);
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

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.focus();
    }
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
    textarea.style.height = '40px';
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
            <div className="px-4 py-2 bg-slate-50/80 dark:bg-white/[0.03] border-t border-slate-200/40 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-[3px] h-8 rounded-full bg-gradient-to-b from-[#5B9BF5] to-[#3478F6]" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#3478F6] dark:text-[#5B9BF5]">
                  {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender === 'me' ? 'yourself' : 'partner'}`}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                  {editingMessage?.content || replyingTo?.content}
                </p>
              </div>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setEditingMessage(null);
                  setInput('');
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center active:bg-slate-200 dark:active:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="px-3 pt-2 pb-1 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-slate-200/40 dark:border-white/[0.06]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
      >
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
          />

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors disabled:opacity-50 mb-[1px]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </motion.button>

          <div className="flex-1 bg-slate-100 dark:bg-white/[0.06] rounded-[20px] border border-slate-200/50 dark:border-white/[0.08] overflow-hidden min-h-[40px] flex items-center">
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
              className="w-full px-3.5 py-[9px] text-[15px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent resize-none outline-none max-h-24 scrollbar-none leading-[1.3]"
              style={{ height: '40px' }}
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
                className="flex-shrink-0 w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#5B9BF5] to-[#3478F6] flex items-center justify-center shadow-md shadow-blue-500/25 mb-[1px]"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                className="flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors mb-[1px]"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
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
