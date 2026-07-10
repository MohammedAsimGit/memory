'use client';

import { motion } from 'framer-motion';
import TimelineList from '@/components/timeline/TimelineList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi } from '@/hooks/useApi';
import type { Memory } from '@/types';

export default function TimelinePage() {
  const { data: memories, loading } = useApi<Memory[]>('/memories');

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasMemories = memories && memories.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-24"
    >
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-6 tracking-tight"
      >
        Timeline
      </motion.h1>

      {hasMemories ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TimelineList memories={memories} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmptyState
            icon="📸"
            title="No Memories Yet"
            description="Start capturing your special moments together. Every story begins with a first memory."
          />
        </motion.div>
      )}


    </motion.div>
  );
}
