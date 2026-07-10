'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface OnThisDayProps {
  yearsAgo: number;
  title: string;
  description: string;
  location?: string;
  memoryId?: string;
}

export default function OnThisDay({ yearsAgo, title, description, location, memoryId }: OnThisDayProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full"
    >
      <GlassCard padding="md" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 text-6xl opacity-5 select-none">🕰️</div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 dark:from-sky-500/20 dark:to-blue-600/20 flex items-center justify-center text-xl flex-shrink-0">
            🕰️
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-wider">On This Day</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{yearsAgo} Year{yearsAgo > 1 ? 's' : ''} Ago</p>
          </div>
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{description}</p>
        {location && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-3">
            <span>📍</span> {location}
          </p>
        )}
        {memoryId && (
          <button
            onClick={() => router.push(`/memory/${memoryId}`)}
            className="text-xs font-semibold text-[#2196F3] dark:text-sky-400 hover:underline"
          >
            View Memory →
          </button>
        )}
      </GlassCard>
    </motion.div>
  );
}

export function OnThisDayEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full"
    >
      <GlassCard padding="md" className="text-center py-6">
        <p className="text-3xl mb-2">🕰️</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No memories from this day yet.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Let&apos;s create today&apos;s memory ❤️
        </p>
      </GlassCard>
    </motion.div>
  );
}
