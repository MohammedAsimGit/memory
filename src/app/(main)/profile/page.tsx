'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard, { GradientCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { Settings, Stats } from '@/types';
import { daysBetween } from '@/lib/utils';

const statConfig = [
  { key: 'totalMemories', label: 'Total Memories', icon: '📸' },
  { key: 'totalJournals', label: 'Journals', icon: '📝' },
  { key: 'totalSpecialDays', label: 'Special Days', icon: '📅' },
  { key: 'totalPhotos', label: 'Photos', icon: '🖼️' },
  { key: 'totalLetters', label: 'Letters', icon: '💌' },
  { key: 'totalCapsules', label: 'Capsules', icon: '🔮' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
};

export default function ProfilePage() {
  const {
    data: settings,
    loading: settingsLoading,
  } = useApi<Settings>('/settings');
  const {
    data: stats,
    loading: statsLoading,
  } = useApi<Stats>('/stats');

  const [daysTogether, setDaysTogether] = useState<number | null>(null);

  useEffect(() => {
    if (settings?.relationshipStartDate) {
      setDaysTogether(daysBetween(settings.relationshipStartDate, new Date().toISOString()));
    }
  }, [settings]);

  const loading = settingsLoading || statsLoading;

  const partner1Initial =
    settings?.partnerName1?.charAt(0).toUpperCase() ?? '';
  const partner2Initial =
    settings?.partnerName2?.charAt(0).toUpperCase() ?? '';

  return (
    <div className="min-h-screen px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center text-3xl font-bold text-white"
      >
        Profile
      </motion.h1>

      {loading ? (
        <div className="mt-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Picture Area */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <GradientCard className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl p-8">
              <div className="flex flex-col items-center">
                <div className="flex -space-x-4 mb-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white shadow-xl ring-2 ring-white/20 backdrop-blur-sm">
                    {partner1Initial || '?'}
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white shadow-xl ring-2 ring-white/20 backdrop-blur-sm">
                    {partner2Initial || '?'}
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-white">
                  {settings?.partnerName1 || 'Partner 1'} &{' '}
                  {settings?.partnerName2 || 'Partner 2'}
                </h2>

                {daysTogether !== null && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="mt-4 text-center"
                  >
                    <span className="text-4xl font-black text-white">
                      {daysTogether.toLocaleString()}
                    </span>
                    <span className="mt-1 block text-sm text-white/50">
                      days together
                    </span>
                  </motion.p>
                )}

                {settings?.relationshipStartDate && (
                  <p className="mt-2 text-xs text-white/30">
                    Since{' '}
                    {new Date(settings.relationshipStartDate).toLocaleDateString(
                      'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
            </GradientCard>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statConfig.map(({ key, label, icon }) => (
                <GlassCard
                  key={key}
                  className="rounded-2xl p-4 text-center"
                >
                  <span className="text-2xl">{icon}</span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 text-2xl font-bold text-white"
                  >
                    {(stats?.[key as keyof Stats] ?? 0).toLocaleString()}
                  </motion.p>
                  <p className="text-xs text-white/40">{label}</p>
                </GlassCard>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Quick Links
            </h3>
            <div className="space-y-2">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 text-left transition hover:bg-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                  ✏️
                </span>
                <div className="flex-1">
                  <p className="font-medium text-white">Edit Profile</p>
                  <p className="text-xs text-white/40">
                    Update names, photo, and details
                  </p>
                </div>
                <span className="text-white/30 text-lg">›</span>
              </button>

              <button className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 text-left transition hover:bg-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                  ⚙️
                </span>
                <div className="flex-1">
                  <p className="font-medium text-white">Settings</p>
                  <p className="text-xs text-white/40">
                    App preferences and customization
                  </p>
                </div>
                <span className="text-white/30 text-lg">›</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
