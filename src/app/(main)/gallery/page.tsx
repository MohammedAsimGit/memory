'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import FloatingButton from '@/components/ui/FloatingButton';
import { useApi } from '@/hooks/useApi';
import type { Memory } from '@/types';

function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    happy: '😊', loved: '🥰', excited: '🎉', grateful: '🙏',
    peaceful: '😌', romantic: '💕', adventurous: '🌟',
    nostalgic: '🥹', silly: '😋', cozy: '🫶',
  };
  return moods[mood] || '💙';
}

export default function GalleryPage() {
  const router = useRouter();
  const { data: memories, loading } = useApi<Memory[]>('/memories');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mood'>('newest');

  const sortedMemories = useCallback((mems: Memory[] | null) => {
    if (!mems) return [];
    const copy = [...mems];
    switch (sortBy) {
      case 'oldest':
        return copy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'mood':
        return copy.filter((m) => m.images && m.images.length > 0);
      default:
        return copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [sortBy]);

  const totalPhotos = useCallback((mems: Memory[] | null) => {
    if (!mems) return 0;
    return mems.reduce((acc, m) => acc + (m.images?.length || 0), 0);
  }, []);

  const moods = useCallback((mems: Memory[] | null) => {
    if (!mems) return [];
    const unique = new Set(mems.filter((m) => m.mood).map((m) => m.mood!));
    return Array.from(unique).slice(0, 4);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasMemories = memories && memories.length > 0;
  const hasPhotos = totalPhotos(memories) > 0;
  const displayMemories = sortedMemories(memories);
  const moodList = moods(memories);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-24"
    >
      <div className="flex items-center justify-between mb-2">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight"
        >
          Gallery
        </motion.h1>

        {hasPhotos && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => {
              const imgs = displayMemories.flatMap((m) =>
                m.images.map((url) => ({ url, title: m.title }))
              );
              if (imgs.length > 0) {
                const urls = imgs.map((i) => i.url).join('|');
                router.push(`/slideshow?images=${encodeURIComponent(urls)}`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white/90 hover:shadow-md active:scale-95 transition-all duration-200"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Slideshow
          </motion.button>
        )}
      </div>

      {hasMemories && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm text-slate-400 dark:text-slate-400 mb-5"
        >
          {totalPhotos(memories)} photo{totalPhotos(memories) !== 1 ? 's' : ''} across {memories!.length} memor{memories!.length !== 1 ? 'ies' : 'y'}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide"
      >
        {(['newest', 'oldest', 'mood'] as const).map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
            onClick={() => setSortBy(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              sortBy === s
                ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-md shadow-blue-400/25'
                : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border border-white/40 hover:bg-white/80'
            }`}
          >
            {s === 'newest' ? 'Newest' : s === 'oldest' ? 'Oldest' : 'Photos Only'}
          </motion.button>
        ))}

        {moodList.map((m, i) => (
          <motion.button
            key={m}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 + (3 + i) * 0.05 }}
            onClick={() => setSortBy('mood')}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-sm text-slate-500 dark:text-slate-300 border border-white/40 hover:bg-white/80 whitespace-nowrap transition-all duration-200 flex items-center gap-1.5"
          >
            <span>{getMoodEmoji(m)}</span>
            <span className="capitalize">{m}</span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {hasMemories ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <GalleryGrid memories={displayMemories} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <EmptyState
              icon="🖼️"
              title="No Photos Yet"
              description="Your gallery will fill up with beautiful moments. Add a memory with photos to get started."
            />
          </motion.div>
        )}
      </AnimatePresence>

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
