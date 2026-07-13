'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import type { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTail: boolean;
  onLongPress: (msg: ChatMessage) => void;
  onDoubleTap: (msg: ChatMessage) => void;
  onImagePress: (images: string[], index: number) => void;
}

const REACTIONS = ['❤️', '😂', '😍', '😢', '👍', '🎉', '🤗'];

export default function MessageBubble({ message, isOwn, showTail, onLongPress, onDoubleTap, onImagePress }: MessageBubbleProps) {
  const { replyingTo, messages } = useChatStore();
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const repliedMsg = message.replyTo ? messages.find((m) => m._id === message.replyTo) : null;

  const handleTouchStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      onLongPress(message);
    }, 500);
  }, [message, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap(message);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [message, onDoubleTap]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (message.isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-1`}
      >
        <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'} bg-slate-100/80 dark:bg-white/[0.04]`}>
          <p className="text-[13px] italic text-slate-400 dark:text-slate-500">
            This message was deleted
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isOwn ? 16 : -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-2' : 'mt-0.5'} px-1`}
    >
      <div
        className={`relative max-w-[78%] group`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleTap}
      >
        {repliedMsg && (
          <div className={`mb-1 px-2.5 py-1.5 rounded-xl text-[11px] border-l-[2.5px] ${
            isOwn
              ? 'bg-white/15 border-white/40 text-white/75'
              : 'bg-slate-50 dark:bg-white/[0.04] border-blue-400 text-slate-500 dark:text-slate-400'
          }`}>
            <p className="font-semibold text-[10px] mb-0.5 opacity-70">
              {repliedMsg.sender === 'me' ? 'You' : 'Partner'}
            </p>
            <p className="truncate leading-snug">{repliedMsg.content}</p>
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-1">
            {message.attachments.map((att, i) => (
              <div key={i}>
                {att.type === 'image' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const images = message.attachments.filter((a) => a.type === 'image').map((a) => a.url);
                      const idx = images.indexOf(att.url);
                      onImagePress(images, idx >= 0 ? idx : 0);
                    }}
                    className="block rounded-2xl overflow-hidden"
                  >
                    <img src={att.url} alt="" className="max-w-full max-h-60 object-cover" loading="lazy" />
                  </button>
                )}
                {att.type === 'voice' && (
                  <div className={`px-3 py-2 rounded-2xl ${isOwn ? 'bg-white/15' : 'bg-slate-50 dark:bg-white/[0.04]'}`}>
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </button>
                      <div className="flex-1 h-[3px] bg-white/15 rounded-full">
                        <div className="w-1/3 h-full bg-white/50 rounded-full" />
                      </div>
                      <span className="text-[10px] text-white/50">{att.duration || 0}s</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={`relative px-3 py-[7px] ${
              isOwn
                ? `bg-gradient-to-br from-[#5B9BF5] to-[#3478F6] text-white shadow-sm shadow-blue-500/15 ${
                    showTail ? 'rounded-[18px] rounded-br-[6px]' : 'rounded-[18px]'
                  }`
                : `bg-slate-50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-white/[0.08] backdrop-blur-sm ${
                    showTail ? 'rounded-[18px] rounded-bl-[6px]' : 'rounded-[18px]'
                  }`
            }`}
          >
            <p className="text-[15px] leading-[1.35] whitespace-pre-wrap break-words">{message.content}</p>

            <div className={`flex items-center gap-1 -mb-px ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] leading-none ${isOwn ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className={`text-[10px] leading-none ${isOwn ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>
                  Edited
                </span>
              )}
              {isOwn && (
                <span className="text-[10px] leading-none ml-0.5">
                  {message.seen ? (
                    <span className="text-white/70">✓✓</span>
                  ) : message.delivered ? (
                    <span className="text-white/45">✓✓</span>
                  ) : (
                    <span className="text-white/40">✓</span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-0.5 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white dark:bg-[#1a1a1a] shadow-sm border border-slate-100 dark:border-white/[0.08] text-[11px]"
              >
                {emoji}
                {count > 1 && <span className="text-[9px] text-slate-500">{count}</span>}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              className={`absolute z-50 flex gap-1 p-1.5 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-xl border border-slate-100 dark:border-white/[0.08] ${
                isOwn ? 'right-0' : 'left-0'
              } bottom-full mb-2`}
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(false);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
