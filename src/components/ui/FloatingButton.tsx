'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FloatingButton({
  onClick,
  icon,
  className,
  color = 'primary',
}: {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  color?: 'primary' | 'secondary';
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={onClick}
      className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
        color === 'primary' && 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-blue-400/40',
        color === 'secondary' && 'bg-white text-[#1976D2] shadow-sky-200/40',
        className
      )}
    >
      {icon}
    </motion.button>
  );
}
