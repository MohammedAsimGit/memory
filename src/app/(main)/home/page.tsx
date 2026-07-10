'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GreetingCard from '@/components/home/GreetingCard';
import CountdownCard from '@/components/home/CountdownCard';
import RecentMemories from '@/components/home/RecentMemories';
import JournalWidget from '@/components/home/JournalWidget';
import MusicWidget from '@/components/home/MusicWidget';
import { SectionTitle } from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import type { Memory, SpecialDay, JournalEntry, MusicTrack, Settings } from '@/types';
import { daysBetween, getRandomQuote, daysUntil, isToday } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function HomePage() {
  const { data: settings, loading: settingsLoading } = useApi<Settings>('/settings');
  const { data: memories, loading: memoriesLoading } = useApi<Memory[]>('/memories');
  const { data: specialDays, loading: specialDaysLoading } = useApi<SpecialDay[]>('/special-days');
  const { data: journals, loading: journalsLoading } = useApi<JournalEntry[]>('/journals');
  const { data: tracks, loading: tracksLoading } = useApi<MusicTrack[]>('/music');

  const [quote, setQuote] = useState({ text: '', author: '' });

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const loading =
    settingsLoading && memoriesLoading && specialDaysLoading && journalsLoading && tracksLoading;
  const daysTogether = settings?.relationshipStartDate
    ? daysBetween(settings.relationshipStartDate)
    : 0;

  const sortedSpecialDays = (specialDays || [])
    .slice()
    .sort((a, b) => {
      const aToday = isToday(a.date);
      const bToday = isToday(b.date);
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      return daysUntil(a.date) - daysUntil(b.date);
    });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24 space-y-6"
    >
      <motion.div variants={item}>
        {settings && (
          <GreetingCard
            daysTogether={daysTogether}
            partnerName1={settings.partnerName1}
            partnerName2={settings.partnerName2}
          />
        )}
      </motion.div>

      <motion.div
        variants={item}
        className="py-1 text-center"
      >
        <p className="text-slate-400 dark:text-slate-400 italic text-sm leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-slate-300 text-xs mt-1.5">— {quote.author}</p>
      </motion.div>

      {sortedSpecialDays.length > 0 && (
        <motion.section variants={item}>
          <SectionTitle>Special Days</SectionTitle>
          <div className="space-y-2.5">
            {sortedSpecialDays.map((day) => (
              <CountdownCard
                key={day._id}
                title={day.title}
                date={day.date}
                icon={day.icon}
              />
            ))}
          </div>
        </motion.section>
      )}

      <motion.section variants={item}>
        <RecentMemories memories={memories || []} />
      </motion.section>

      <motion.section variants={item}>
        <JournalWidget entries={journals || []} />
      </motion.section>

      <motion.section variants={item}>
        <MusicWidget tracks={tracks || []} />
      </motion.section>
    </motion.div>
  );
}
