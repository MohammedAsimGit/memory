'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import type { Memory, JournalEntry, MusicTrack, Settings, Letter } from '@/types';
import { daysBetween, daysUntil } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import HeroCard from '@/components/home/HeroCard';
import QuickStats from '@/components/home/QuickStats';
import OnThisDayCard, { OnThisDayEmpty } from '@/components/home/OnThisDayCard';
import RecentMemoriesCarousel from '@/components/home/RecentMemoriesCarousel';
import ContinueWriting from '@/components/home/ContinueWriting';
import MusicCard from '@/components/home/MusicCard';
import LocationCard from '@/components/home/LocationCard';
import UpcomingLetter from '@/components/home/UpcomingLetter';
import DailyQuote from '@/components/home/DailyQuote';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function HomePage() {
  const { data: settings, loading: sLoading } = useApi<Settings>('/settings');
  const { data: memories } = useApi<Memory[]>('/memories');
  const { data: journals } = useApi<JournalEntry[]>('/journal');
  const { data: tracks } = useApi<MusicTrack[]>('/music');
  const { data: letters } = useApi<Letter[]>('/letters');

  const loading = sLoading;

  const daysTogether = settings?.relationshipStartDate
    ? daysBetween(settings.relationshipStartDate)
    : 0;

  const startDate = settings?.relationshipStartDate
    ? new Date(settings.relationshipStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : undefined;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMem = (memories || []).filter((m) => m.date === todayStr && !m.date.includes(String(new Date().getFullYear())));
  const oldestTodayMem = (memories || []).find((m) => {
    const d = m.date.slice(5);
    return d === todayStr.slice(5) && m.date.slice(0, 4) !== String(new Date().getFullYear());
  });

  const latestMemory = (memories || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const latestMusic = (tracks || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestJournal = (journals || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const upcomingLetters = (letters || [])
    .filter((l) => l.isLocked)
    .sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());

  const statCards = [
    { label: 'Memories', value: memories?.length || 0, icon: '📸', color: '#6366F1' },
    { label: 'Photos', value: (memories || []).reduce((c, m) => c + (m.images?.length || 0), 0), icon: '🖼️', color: '#EC4899' },
    { label: 'Journals', value: journals?.length || 0, icon: '📔', color: '#10B981' },
    { label: 'Music', value: tracks?.length || 0, icon: '🎵', color: '#F59E0B' },
  ];

  if (loading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 pb-4">
      <motion.div variants={item}>
        <HeroCard
          partnerName1={settings?.partnerName1 || 'Asim'}
          partnerName2={settings?.partnerName2 || 'My Love'}
          daysTogether={daysTogether}
          startDate={startDate}
        />
      </motion.div>

      <motion.div variants={item}>
        <QuickStats stats={statCards} />
      </motion.div>

      <motion.div variants={item}>
        {oldestTodayMem ? (
          <OnThisDayCard
            yearsAgo={new Date().getFullYear() - new Date(oldestTodayMem.date).getFullYear()}
            title={oldestTodayMem.title}
            description={oldestTodayMem.description || ''}
            location={oldestTodayMem.location}
            memoryId={oldestTodayMem._id}
          />
        ) : (
          <OnThisDayEmpty />
        )}
      </motion.div>

      <motion.div variants={item}>
        <RecentMemoriesCarousel memories={memories || []} />
      </motion.div>

      <motion.div variants={item}>
        <ContinueWriting
          journalDraft={latestJournal ? { title: `Journal · ${latestJournal.date}`, preview: latestJournal.content.slice(0, 80) + '...' } : null}
        />
      </motion.div>

      <motion.div variants={item}>
        <MusicCard
          track={latestMusic ? {
            _id: latestMusic._id,
            title: latestMusic.title,
            artist: latestMusic.artist,
            author: 'me',
            url: latestMusic.url,
          } : null}
        />
      </motion.div>

      <motion.div variants={item}>
        <LocationCard
          location={latestMemory?.location}
          date={latestMemory?.date}
          memoryId={latestMemory?._id}
        />
      </motion.div>

      {upcomingLetters.length > 0 && (
        <motion.div variants={item}>
          <UpcomingLetter
            title={upcomingLetters[0]?.title}
            author={upcomingLetters[0]?.author}
            days={daysUntil(upcomingLetters[0]?.unlockDate)}
          />
        </motion.div>
      )}

      <motion.div variants={item}>
        <DailyQuote />
      </motion.div>
    </motion.div>
  );
}
