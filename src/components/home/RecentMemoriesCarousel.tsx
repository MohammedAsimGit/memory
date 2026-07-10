'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Memory } from '@/types';
import { formatDate } from '@/lib/utils';
import AuthorAvatar from '@/components/post/AuthorAvatar';

export default function RecentMemoriesCarousel({ memories }: { memories: Memory[] }) {
  const router = useRouter();

  if (!memories.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Memories</h3>
        <button onClick={() => router.push('/timeline')} className="text-[11px] font-semibold text-sky-500 hover:underline">View All</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory hide-scrollbar">
        {memories.slice(0, 8).map((m, i) => (
          <motion.button
            key={m._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/memory/${m._id}`)}
            className="flex-shrink-0 w-44 snap-start text-left"
          >
            <GlassCard padding="sm" className="overflow-hidden">
              {m.images[0] ? (
                <img src={m.images[0]} alt={m.title} className="w-full h-28 object-cover rounded-2xl mb-2.5" loading="lazy" />
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30 rounded-2xl mb-2.5 flex items-center justify-center text-3xl">📸</div>
              )}
              <p className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 line-clamp-1">{m.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <AuthorAvatar name={m.author || 'me'} size="sm" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(m.date)}</span>
              </div>
              {m.location && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <span>📍</span> {m.location}
                </p>
              )}
            </GlassCard>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
