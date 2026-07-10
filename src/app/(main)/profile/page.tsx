'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { Settings, Stats } from '@/types';
import { daysBetween } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const navItems = [
  { title: 'Special Days', desc: 'Anniversaries, milestones & countdowns', icon: '❤️', color: '#6366F1', href: '/special-days' },
  { title: 'Daily Journal', desc: 'Read and write shared moments', icon: '📔', color: '#10B981', href: '/journal' },
  { title: 'Letters to Future', desc: 'Unlock heartfelt messages on a future date', icon: '💌', color: '#EC4899', href: '/letters' },
  { title: 'Time Capsules', desc: 'Store memories to be opened later', icon: '🔮', color: '#8B5CF6', href: '/time-capsule' },
  { title: 'Music', desc: 'Songs connected to your memories', icon: '🎵', color: '#F59E0B', href: '/music' },
  { title: 'Gallery', desc: 'Browse all photos and videos', icon: '🖼️', color: '#3B82F6', href: '/gallery' },
  { title: 'Memory Map', desc: 'Explore memories by location', icon: '🗺️', color: '#14B8A6', href: '/map' },
  { title: 'Search', desc: 'Find memories instantly', icon: '🔍', color: '#64748B', href: '/search' },
  { title: 'Settings', desc: 'Customize the app and privacy', icon: '⚙️', color: '#78716C', href: '/settings' },
];

const statCards = [
  { key: 'totalMemories', label: 'Memories', icon: '📸', color: '#6366F1' },
  { key: 'totalPhotos', label: 'Photos', icon: '🖼️', color: '#EC4899' },
  { key: 'totalJournalEntries', label: 'Journals', icon: '📝', color: '#10B981' },
  { key: 'totalLetters', label: 'Letters', icon: '💌', color: '#F59E0B' },
  { key: 'totalCapsules', label: 'Capsules', icon: '🔮', color: '#8B5CF6' },
  { key: 'totalSpecialDays', label: 'Special Days', icon: '📅', color: '#3B82F6' },
];

const quotes = [
  'Every love story is beautiful, but ours is my favorite.',
  'Together is a wonderful place to be.',
  'You are my today and all of my tomorrows.',
  'The best thing to hold onto in life is each other.',
  'I love you more than yesterday, less than tomorrow.',
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: settings, loading: sLoading } = useApi<Settings>('/settings');
  const { data: stats, loading: stLoading } = useApi<Stats>('/stats');

  const [daysTogether, setDaysTogether] = useState<number | null>(null);

  useEffect(() => {
    if (settings?.relationshipStartDate) {
      setDaysTogether(daysBetween(settings.relationshipStartDate, new Date().toISOString()));
    }
  }, [settings]);

  const loading = sLoading || stLoading;

  if (loading) return <LoadingSpinner size="lg" />;

  const name1 = settings?.partnerName1 || 'My Love';
  const name2 = settings?.partnerName2 || 'My Love';
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="space-y-6 pb-4">
      {/* ── Profile Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2196F3] via-[#42A5F5] to-[#1976D2] p-6 shadow-2xl shadow-blue-400/30"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/8 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-[28px] bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-lg mb-4 border border-white/30">
            {name1[0]}{name2[0]}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {name1} <span className="opacity-70">&</span> {name2}
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/20">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
            In Love
          </div>
          {daysTogether !== null && (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mt-4 text-4xl font-black text-white tracking-tighter"
            >
              {daysTogether.toLocaleString()}
              <span className="text-lg font-medium opacity-70 ml-2">days together</span>
            </motion.p>
          )}
          <p className="mt-3 text-sm text-white/60 italic max-w-xs leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* ── Statistics ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-2.5"
      >
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 text-center border border-white/50 dark:border-slate-700/50 shadow-md"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base mx-auto mb-1.5 shadow-sm"
              style={{ background: `${s.color}18` }}
            >
              {s.icon}
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {(stats as any)?.[s.key] ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Contributions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Your Contributions
        </h2>
        <div className="grid grid-cols-3 gap-2.5 mb-2.5">
          {[
            { key: 'myMemories', label: `${name1}'s Memories`, icon: '📸', tint: 'blue' as const },
            { key: 'myPhotos', label: `${name1}'s Photos`, icon: '🖼️', tint: 'blue' as const },
            { key: 'myJournals', label: `${name1}'s Journals`, icon: '📝', tint: 'blue' as const },
          ].map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 text-center border shadow-md"
              style={{
                borderColor: 'rgba(33, 150, 243, 0.25)',
                background: 'rgba(33, 150, 243, 0.06)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base mx-auto mb-1.5 shadow-sm"
                style={{ background: 'rgba(33, 150, 243, 0.15)' }}
              >
                {s.icon}
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {(stats as any)?.[s.key] ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { key: 'herMemories', label: `${name2}'s Memories`, icon: '💜', tint: 'purple' as const },
            { key: 'herPhotos', label: `${name2}'s Photos`, icon: '🖼️', tint: 'purple' as const },
            { key: 'herJournals', label: `${name2}'s Journals`, icon: '📝', tint: 'purple' as const },
          ].map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 text-center border shadow-md"
              style={{
                borderColor: 'rgba(139, 92, 246, 0.25)',
                background: 'rgba(139, 92, 246, 0.06)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base mx-auto mb-1.5 shadow-sm"
                style={{ background: 'rgba(139, 92, 246, 0.15)' }}
              >
                {s.icon}
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {(stats as any)?.[s.key] ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Navigation Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Features
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item, i) => (
            <motion.button
              key={item.href}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(item.href)}
              className="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-[20px] p-4 border border-white/50 dark:border-slate-700/50 shadow-lg shadow-sky-100/50 dark:shadow-black/20 text-left overflow-hidden group"
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-bl-[32px] opacity-8 group-hover:opacity-15 transition-opacity"
                style={{ background: item.color }}
              />
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg mb-3 shadow-md"
                style={{ background: `${item.color}15`, boxShadow: `0 4px 12px ${item.color}18` }}
              >
                {item.icon}
              </div>
              <p className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-tight">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-tight line-clamp-2">
                {item.desc}
              </p>
              <div
                className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center group-hover:translate-x-0.5 transition-transform"
                style={{ background: `${item.color}12` }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="text-center py-2">
        <p className="text-xs text-slate-300 dark:text-slate-600 font-medium">
          A private space for two hearts
        </p>
      </div>
    </div>
  );
}
