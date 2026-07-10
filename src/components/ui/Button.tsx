'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  loading?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  loading,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2',
        variant === 'primary' && 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-lg shadow-blue-400/30',
        variant === 'secondary' && 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-md text-[#1976D2] dark:text-[#64B5F6] shadow-md border border-white/50 dark:border-slate-700/50',
        variant === 'ghost' && 'bg-transparent text-[#2196F3]',
        variant === 'danger' && 'bg-red-500 text-white shadow-lg shadow-red-400/30',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
