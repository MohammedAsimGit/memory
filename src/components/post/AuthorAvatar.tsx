'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthorAvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const gradients: Record<string, string> = {
  me: 'from-[#4FC3F7] to-[#2196F3]',
  her: 'from-[#C084FC] to-[#A855F7]',
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] + (name[1] || '')).toUpperCase();
};

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
};

export default function AuthorAvatar({
  name,
  image,
  size = 'md',
  showStatus,
}: AuthorAvatarProps) {
  const initials = getInitials(name);
  const isMe = name.toLowerCase() === 'me';
  const gradient = isMe ? gradients.me : gradients.her;

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative rounded-full flex-shrink-0',
        sizeMap[size]
      )}
    >
      <div
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center font-bold text-white shadow-lg',
          'border-[2px] border-white dark:border-slate-700',
          isMe
            ? 'shadow-blue-400/30 dark:shadow-blue-500/20'
            : 'shadow-purple-400/30 dark:shadow-purple-500/20',
          image ? 'bg-cover bg-center' : `bg-gradient-to-br ${gradient}`
        )}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        {!image && initials}
      </div>

      {showStatus && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800',
            isMe ? 'bg-emerald-400' : 'bg-pink-400'
          )}
        />
      )}
    </motion.div>
  );
}
