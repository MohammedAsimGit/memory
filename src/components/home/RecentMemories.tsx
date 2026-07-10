'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { Memory } from '@/types';

export default function RecentMemories({ memories }: { memories: Memory[] }) {
  if (!memories.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Memories</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {memories.slice(0, 5).map((memory, i) => (
          <motion.div
            key={memory._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-40 snap-start"
          >
            <GlassCard padding="sm" className="h-full">
              {memory.images[0] ? (
                <img
                  src={memory.images[0]}
                  alt={memory.title}
                  className="w-full h-28 object-cover rounded-2xl mb-2"
                />
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-sky-200 to-blue-300 rounded-2xl mb-2 flex items-center justify-center text-3xl">
                  💙
                </div>
              )}
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{memory.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{formatDate(memory.date)}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
