'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { JournalEntry } from '@/types';
import { formatDate } from '@/lib/utils';

export default function JournalWidget({ entries }: { entries: JournalEntry[] }) {
  const latest = entries[0];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Latest Journal</h3>
        <span className="text-xs text-slate-400 dark:text-slate-400">{latest ? formatDate(latest.date) : 'No entries'}</span>
      </div>
      {latest ? (
        <p className="text-sm text-slate-600 dark:text-slate-200 line-clamp-3 leading-relaxed">{latest.content}</p>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-400 italic">Start writing your first journal entry...</p>
      )}
    </GlassCard>
  );
}
