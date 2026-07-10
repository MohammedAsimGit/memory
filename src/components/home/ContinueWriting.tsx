'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface ContinueWritingProps {
  journalDraft?: { title: string; preview: string } | null;
}

export default function ContinueWriting({ journalDraft }: ContinueWritingProps) {
  const router = useRouter();

  if (!journalDraft) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <GlassCard padding="md" className="text-center py-6">
          <p className="text-2xl mb-1">📔</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Write today&apos;s journal</p>
          <button
            onClick={() => router.push('/journal')}
            className="mt-3 text-xs font-semibold text-[#2196F3] dark:text-sky-400 hover:underline"
          >
            Start Writing →
          </button>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <GlassCard padding="md" onClick={() => router.push('/journal')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
            📔
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Continue Writing</p>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{journalDraft.title}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{journalDraft.preview}</p>
          </div>
          <span className="text-slate-300 dark:text-slate-600 text-lg">›</span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
