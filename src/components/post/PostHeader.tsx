'use client';

import { motion } from 'framer-motion';
import AuthorAvatar from './AuthorAvatar';
import AuthorBadge from './AuthorBadge';
import { formatDate, formatTime, getMoodEmoji } from '@/lib/utils';

interface PostHeaderProps {
  author: string;
  date: string;
  time?: string;
  mood?: string;
  avatarImage?: string;
  showBadge?: boolean;
  onMenuClick?: () => void;
  className?: string;
  displayName?: string;
}

export default function PostHeader({
  author,
  date,
  time,
  mood,
  avatarImage,
  showBadge = true,
  onMenuClick,
  className,
  displayName,
}: PostHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 ${className || ''}`}
    >
      <AuthorAvatar
        name={author}
        image={avatarImage}
        size="md"
        showStatus
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            {author === 'me' ? (displayName || 'Asim') : author}
          </span>
          {showBadge && <AuthorBadge name={author} />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {formatDate(date)}
            {time && ` • ${formatTime(time)}`}
          </span>
          {mood && (
            <span className="text-xs" title={mood}>
              {getMoodEmoji(mood)}
            </span>
          )}
        </div>
      </div>

      {onMenuClick && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMenuClick}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}
