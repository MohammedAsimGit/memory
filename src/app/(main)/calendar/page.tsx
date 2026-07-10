'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/calendar/CalendarView';
import GlassCard from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi } from '@/hooks/useApi';
import type { Memory } from '@/types';
import { formatDate } from '@/lib/utils';
import dayjs from 'dayjs';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    happy: '😊',
    loved: '🥰',
    excited: '🎉',
    grateful: '🙏',
    peaceful: '😌',
    romantic: '💕',
    adventurous: '🌟',
    nostalgic: '🥹',
    silly: '😋',
    cozy: '🫶',
  };
  return moods[mood] || '💙';
}

export default function CalendarPage() {
  const router = useRouter();
  const { data: memories, loading } = useApi<Memory[]>('/memories');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const memoriesByDate = useMemo(() => {
    if (!memories) return {};
    const grouped: Record<string, number> = {};
    memories.forEach((m) => {
      const d = dayjs(m.date).format('YYYY-MM-DD');
      grouped[d] = (grouped[d] || 0) + 1;
    });
    return grouped;
  }, [memories]);

  const selectedMemories = useMemo(() => {
    if (!memories) return [];
    return memories.filter(
      (m) => dayjs(m.date).format('YYYY-MM-DD') === selectedDate
    );
  }, [memories, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
        Calendar
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CalendarView
          memoriesByDate={memoriesByDate}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-6"
      >
        <SectionTitle>
          {selectedDate === dayjs().format('YYYY-MM-DD')
            ? 'Today'
            : formatDate(selectedDate)}
        </SectionTitle>

        {selectedMemories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              icon="📅"
              title="No Memories"
              description="No memories recorded for this date. Tap + to add one."
            />
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence mode="wait">
              {selectedMemories.map((memory) => (
                <motion.div
                  key={memory._id}
                  variants={item}
                  layout
                >
                  <GlassCard
                    onClick={() => router.push(`/memory/${memory._id}`)}
                    padding="md"
                    className="flex gap-4 items-start"
                  >
                    {memory.images && memory.images.length > 0 ? (
                      <img
                        src={memory.images[0]}
                        alt={memory.title}
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {memory.mood ? getMoodEmoji(memory.mood) : '💙'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                        {memory.title}
                      </h3>
                      {memory.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 line-clamp-2">
                          {memory.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {memory.mood && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium">
                            {getMoodEmoji(memory.mood)} {memory.mood}
                          </span>
                        )}
                        {memory.location && (
                          <span className="text-xs text-slate-400 dark:text-slate-400 truncate">
                            📍 {memory.location}
                          </span>
                        )}
                        {memory.time && (
                          <span className="text-xs text-slate-400 dark:text-slate-400">
                            {memory.time}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-300 flex-shrink-0 mt-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>


    </motion.div>
  );
}
