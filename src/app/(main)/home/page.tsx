'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GreetingCard from '@/components/home/GreetingCard';
import CountdownCard from '@/components/home/CountdownCard';
import RecentMemories from '@/components/home/RecentMemories';
import JournalWidget from '@/components/home/JournalWidget';
import MusicWidget from '@/components/home/MusicWidget';
import FloatingButton from '@/components/ui/FloatingButton';
import { SectionTitle } from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
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
  const router = useRouter();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings, loading: settingsLoading } = useApi<Settings>('/settings');
  const { data: memories, loading: memoriesLoading } = useApi<Memory[]>('/memories');
  const { data: specialDays, loading: specialDaysLoading } = useApi<SpecialDay[]>('/special-days');
  const { data: journals, loading: journalsLoading } = useApi<JournalEntry[]>('/journals');
  const { data: tracks, loading: tracksLoading } = useApi<MusicTrack[]>('/music');

  const [quote, setQuote] = useState({ text: '', author: '' });
  const [timeGreeting, setTimeGreeting] = useState('');

  useEffect(() => {
    setQuote(getRandomQuote());
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good Morning');
    else if (hour < 18) setTimeGreeting('Good Afternoon');
    else setTimeGreeting('Good Evening');
  }, []);

  const loading =
    settingsLoading && memoriesLoading && specialDaysLoading && journalsLoading && tracksLoading;
  const daysTogether = settings?.relationshipStartDate
    ? daysBetween(settings.relationshipStartDate)
    : 0;

  const displayName = activeProfile === 'me'
    ? (settings?.partnerName1 || 'Asim')
    : (settings?.partnerName2 || 'My Love');

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
        <div className="mb-2">
            <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-300">
            {timeGreeting}
          </h2>
          <h1 className="text-[28px] font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {displayName} <span className="text-gradient">❤️</span>
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 mt-0.5">Welcome back</p>
        </div>
      </motion.div>

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

      <FloatingButton
        onClick={() => router.push('/add-memory')}
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        }
        className="fixed bottom-24 right-5 z-50"
      />
    </motion.div>
  );
}
