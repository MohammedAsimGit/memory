'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi } from '@/hooks/useApi';
import type { Memory } from '@/types';
import { formatDate } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const moodEmojis: Record<string, string> = {
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

export default function SearchPage() {
  const router = useRouter();
  const { data: memories, loading } = useApi<Memory[]>('/memories');

  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<'all' | 'me' | 'her'>('all');

  const years = useCallback(() => {
    if (!memories) return [];
    const y = new Set(
      memories.map((m) => new Date(m.date).getFullYear().toString())
    );
    return Array.from(y).sort((a, b) => Number(b) - Number(a));
  }, [memories]);

  const moods = useCallback(() => {
    if (!memories) return [];
    const m = new Set(
      memories.filter((mem) => mem.mood).map((mem) => mem.mood!)
    );
    return Array.from(m);
  }, [memories]);

  const filtered = useCallback(() => {
    if (!memories) return [];
    let results = [...memories];

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.location && m.location.toLowerCase().includes(q)) ||
          (m.mood && m.mood.toLowerCase().includes(q)) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (yearFilter) {
      results = results.filter(
        (m) => new Date(m.date).getFullYear().toString() === yearFilter
      );
    }

    if (moodFilter) {
      results = results.filter((m) => m.mood === moodFilter);
    }

    if (authorFilter !== 'all') {
      results = results.filter((m) => (m.author || 'me') === authorFilter);
    }

    return results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [memories, query, yearFilter, moodFilter]);

  const results = filtered();
  const yearList = years();
  const moodList = moods();

  const toggleYear = (y: string) => {
    setYearFilter(yearFilter === y ? null : y);
  };

  const toggleMood = (m: string) => {
    setMoodFilter(moodFilter === m ? null : m);
  };

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
      className="pb-24"
    >
      <motion.div variants={item} className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Search</h1>
        <p className="text-sm text-slate-400 mt-1">
          Find your memories by anything
        </p>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Input
          value={query}
          onChange={setQuery}
          placeholder="Search by title, description, location, mood, or tags..."
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
      </motion.div>

      {yearList.length > 0 && (
        <motion.div variants={item} className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {yearList.map((y) => (
            <motion.button
              key={y}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                yearFilter === y
                  ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-md shadow-blue-400/25'
                  : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border border-white/40 hover:bg-white/80'
              }`}
            >
              {y}
            </motion.button>
          ))}
        </motion.div>
      )}

      <motion.div variants={item} className="flex gap-2 mb-3">
        {(['all', 'me', 'her'] as const).map((a) => (
          <motion.button
            key={a}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAuthorFilter(a)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              authorFilter === a
                ? a === 'me'
                  ? 'bg-gradient-to-r from-[#4FC3F7] to-[#2196F3] text-white shadow-md shadow-blue-400/25'
                  : a === 'her'
                  ? 'bg-gradient-to-r from-[#C084FC] to-[#A855F7] text-white shadow-md shadow-purple-400/25'
                  : 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-md shadow-blue-400/25'
                : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border border-white/40 hover:bg-white/80'
            }`}
          >
            {a === 'me' ? '🩵 Mine' : a === 'her' ? '💜 Hers' : 'All'}
          </motion.button>
        ))}
      </motion.div>

      {moodList.length > 0 && (
        <motion.div variants={item} className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {moodList.map((m) => (
            <motion.button
              key={m}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMood(m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                moodFilter === m
                  ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-md shadow-blue-400/25'
                  : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border border-white/40 hover:bg-white/80'
              }`}
            >
              <span>{moodEmojis[m] || '💙'}</span>
              <span className="capitalize">{m}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {query || yearFilter || moodFilter ? (
        <motion.div variants={item}>
          <p className="text-sm text-slate-400 mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
        </motion.div>
      ) : null}

      {results.length > 0 ? (
        <motion.div className="space-y-3">
          {results.map((memory) => (
            <motion.div
              key={memory._id}
              variants={item}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <GlassCard
                onClick={() => router.push(`/memory/${memory._id}`)}
                className="cursor-pointer"
              >
                <div className="flex gap-4">
                  {memory.images?.[0] ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={memory.images[0]}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 flex items-center justify-center flex-shrink-0">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{memory.title}</h3>
                      {memory.isFavorite && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-rose-400 flex-shrink-0">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{formatDate(memory.date)}</p>
                    {memory.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {memory.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memory.mood && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border border-sky-100 dark:border-sky-700/50">
                          {moodEmojis[memory.mood] || '💙'} {memory.mood}
                        </span>
                      )}
                      {memory.location && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
                          📍 {memory.location}
                        </span>
                      )}
                      {memory.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center text-slate-300 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      ) : (query || yearFilter || moodFilter) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyState
            icon="🔍"
            title="No Matches"
            description="Try adjusting your search terms or filters."
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyState
            icon="🔍"
            title="Search Memories"
            description="Type something above or use the filters to find your favorite memories."
          />
        </motion.div>
      )}
    </motion.div>
  );
}
