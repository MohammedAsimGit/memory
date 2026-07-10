'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { MusicTrack } from '@/types';

export default function MusicWidget({ tracks }: { tracks: MusicTrack[] }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">🎵 Our Playlist</h3>
        <span className="text-xs text-slate-400 dark:text-slate-400">{tracks.length} songs</span>
      </div>
      {tracks.length > 0 ? (
        <div className="space-y-2">
          {tracks.slice(0, 3).map((track) => (
            <div key={track._id} className="flex items-center gap-3 p-2 bg-sky-50/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{track.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-400 italic">Add songs to your playlist</p>
      )}
    </GlassCard>
  );
}
