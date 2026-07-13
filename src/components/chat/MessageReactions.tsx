'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';

const REACTIONS = ['❤️', '😂', '😍', '😢', '👍', '🎉', '🤗'];

interface MessageReactionsProps {
  messageId: string;
  onReact: (messageId: string, emoji: string) => void;
}

export default function MessageReactions({ messageId, onReact }: MessageReactionsProps) {
  const { showMenu, selectedMessage } = useChatStore();
  const activeProfile = useAuthStore((s) => s.activeProfile);

  if (!showMenu || selectedMessage?._id !== messageId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="flex gap-1 p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700"
      >
        {REACTIONS.map((emoji) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReact(messageId, emoji)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-xl transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
