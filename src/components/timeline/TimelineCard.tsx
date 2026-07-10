'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import PostHeader from '@/components/post/PostHeader';
import { Memory } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function TimelineCard({ memory, index }: { memory: Memory; index: number }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative pl-8 pb-6"
    >
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#4FC3F7] to-[#1976D2]/20" />
      <div className="absolute left-[-6px] top-2 w-[13px] h-[13px] bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-full border-2 border-white dark:border-slate-800 shadow-md" />

      <GlassCard
        onClick={() => router.push(`/memory/${memory._id}`)}
        padding="md"
        className={cn(
          (memory.author === undefined || memory.author === 'me') && 'border-l-[3px] border-l-sky-400',
          memory.author === 'her' && 'border-l-[3px] border-l-purple-400'
        )}
      >
        <PostHeader
          author={memory.author || 'me'}
          date={memory.date}
          time={memory.time}
          mood={memory.mood}
          className="mb-4"
        />

        {memory.images[0] && (
          <img
            src={memory.images[0]}
            alt={memory.title}
            className="w-full h-48 object-cover rounded-2xl mb-4"
            loading="lazy"
          />
        )}

        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5">
          {memory.title}
        </h3>

        {memory.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {memory.description}
          </p>
        )}

        {memory.location && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {memory.location}
          </p>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <button className="flex items-center gap-1.5 text-slate-400 text-xs hover:text-pink-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
            <span>24</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 text-xs hover:text-sky-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" fill="currentColor"/></svg>
            <span>3</span>
          </button>
          {memory.music && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              🎵 {memory.music.title}
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
