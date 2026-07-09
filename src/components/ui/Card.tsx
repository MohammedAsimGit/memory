'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export default function GlassCard({ children, className, onClick, padding = 'md' }: GlassCardProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg shadow-sky-100/50',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-7',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}

export function GradientCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-3xl p-5 shadow-xl shadow-blue-400/30 text-white',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}
