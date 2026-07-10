'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthorBadgeProps {
  name: string;
}

export default function AuthorBadge({ name }: AuthorBadgeProps) {
  const isMe = name.toLowerCase() === 'me';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border',
        isMe
          ? 'bg-sky-100/80 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200/50 dark:border-sky-700/30'
          : 'bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/30'
      )}
    >
      <span className="text-[11px]">{isMe ? '🩵' : '💜'}</span>
      {isMe ? 'You' : 'Her'}
    </motion.span>
  );
}
