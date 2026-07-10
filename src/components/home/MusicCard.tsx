'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';

interface MusicTrack { _id: string; title: string; artist: string; author?: string; url?: string }

export default function MusicCard({ track }: { track?: MusicTrack | null }) {
  if (!track) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="w-full">
        <GlassCard padding="md" className="text-center py-6">
          <p className="text-2xl mb-1">🎵</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add songs to your playlist</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="w-full">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">🎵 Our Playlist</h3>
      <GlassCard padding="md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            🎵
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{track.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Added by {track.author === 'me' ? 'you' : 'her'}
            </p>
          </div>
          {track.url && (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:scale-105 transition-transform flex-shrink-0"
            >
              ▶
            </a>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
