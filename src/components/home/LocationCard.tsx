'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface LocationCardProps {
  location?: string;
  date?: string;
  memoryId?: string;
}

export default function LocationCard({ location, date, memoryId }: LocationCardProps) {
  const router = useRouter();

  if (!location) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full">
        <GlassCard padding="md" className="text-center py-6">
          <p className="text-2xl mb-1">📍</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No locations saved yet</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">📍 Last Place</h3>
      <GlassCard padding="md" onClick={() => memoryId ? router.push(`/memory/${memoryId}`) : router.push('/map')}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            📍
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{location}</p>
            {date && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visited {date}</p>
            )}
          </div>
          <span className="text-xs font-semibold text-[#2196F3] dark:text-sky-400">
            View →
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
