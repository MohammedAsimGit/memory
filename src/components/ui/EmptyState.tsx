'use client';

import { cn } from '@/lib/utils';

export default function EmptyState({
  icon = '💙',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-300 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

export function Badge({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'pink' | 'emerald' | 'amber' }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', colors[color])}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-lg font-bold text-slate-800 dark:text-slate-100 mb-3', className)}>
      {children}
    </h2>
  );
}
