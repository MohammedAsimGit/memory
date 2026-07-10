'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import AuthorAvatar from '@/components/post/AuthorAvatar';

interface UpcomingLetterProps {
  title?: string;
  author?: string;
  days: number;
}

export default function UpcomingLetter({ title, author, days }: UpcomingLetterProps) {
  if (!title || days <= 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="w-full">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">💌 Next Letter</h3>
      <GlassCard padding="md">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
          >
            💌
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">&ldquo;{title}&rdquo;</p>
            <div className="flex items-center gap-2 mt-1">
              <AuthorAvatar name={author || 'her'} size="sm" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                From {author === 'me' ? 'you' : 'her'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-700/30 text-xs font-semibold text-pink-700 dark:text-pink-300 shadow-sm flex-shrink-0">
            <span>⏳</span> {days}d
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
