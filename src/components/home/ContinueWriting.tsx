'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import AuthorAvatar from '@/components/post/AuthorAvatar';

interface ContinueWritingProps {
  journalDraft?: {
    title: string;
    preview: string;
    date: string;
    author?: string;
    mood?: string;
  } | null;
}

export default function ContinueWriting({ journalDraft }: ContinueWritingProps) {
  const router = useRouter();

  if (!journalDraft) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full">
        <GlassCard padding="md" className="w-full text-center py-6 overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
            📔
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-1">
            Today&apos;s Journal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed mb-4">
            How are you feeling today? Write down your thoughts, emotions, or memorable moments.
          </p>
          <button
            onClick={() => router.push('/journal')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white text-xs font-semibold shadow-lg shadow-blue-400/25 hover:scale-105 active:scale-95 transition-transform"
          >
            Write Today&apos;s Journal
          </button>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full">
      <GlassCard padding="md" onClick={() => router.push('/journal')} className="w-full overflow-hidden">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            📔
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              Latest Journal
            </p>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {journalDraft.title}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {journalDraft.preview}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <AuthorAvatar name={journalDraft.author || 'me'} size="sm" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{journalDraft.date}</span>
              {journalDraft.mood && <span className="text-xs">{journalDraft.mood}</span>}
            </div>
            <p className="text-[11px] font-semibold text-[#2196F3] dark:text-sky-400 mt-2 hover:underline">
              Continue Reading →
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
