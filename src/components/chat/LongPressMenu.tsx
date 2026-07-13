'use client';

import { motion } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import type { ChatMessage } from '@/types/chat';

interface LongPressMenuProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: (deleteFor: 'me' | 'both') => void;
  onFavorite: () => void;
  onPin: () => void;
  onClose: () => void;
}

export default function LongPressMenu({ message, isOwn, onReply, onCopy, onEdit, onDelete, onFavorite, onPin, onClose }: LongPressMenuProps) {
  const { showMenu, selectedMessage } = useChatStore();
  const activeProfile = useAuthStore((s) => s.activeProfile);

  if (!showMenu || selectedMessage?._id !== message._id) return null;

  const canEdit = isOwn && !message.isDeleted;
  const editTimeLimit = 15 * 60 * 1000;
  const isWithinEditTime = canEdit && (Date.now() - new Date(message.createdAt).getTime()) < editTimeLimit;

  const menuItems = [
    { icon: '↩️', label: 'Reply', action: onReply },
    { icon: '📋', label: 'Copy', action: onCopy },
    ...(isWithinEditTime ? [{ icon: '✏️', label: 'Edit', action: onEdit }] : []),
    ...(isOwn ? [{ icon: '🗑️', label: 'Delete for Me', action: () => onDelete('me') }] : []),
    ...(isOwn ? [{ icon: '🗑️', label: 'Delete for Both', action: () => onDelete('both') }] : []),
    { icon: message.favorited ? '💛' : '🤍', label: message.favorited ? 'Unfavorite' : 'Favorite', action: onFavorite },
    { icon: message.pinned ? '📌' : '📍', label: message.pinned ? 'Unpin' : 'Pin', action: onPin },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`fixed z-50 w-52 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/[0.08] overflow-hidden ${
          isOwn ? 'right-4' : 'left-4'
        }`}
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div className="p-1">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl active:bg-slate-50 dark:active:bg-white/5 transition-colors text-left"
            >
              <span className="text-[14px]">{item.icon}</span>
              <span className="text-[13px] text-slate-700 dark:text-slate-200">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
