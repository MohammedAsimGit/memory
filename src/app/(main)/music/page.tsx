'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi, apiPost, apiDelete, apiPut } from '@/hooks/useApi';
import type { MusicTrack } from '@/types';

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  spotify: { label: 'Spotify', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🟢' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700 border-red-200', icon: '▶️' },
  apple: { label: 'Apple', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '🍎' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function MusicPage() {
  const { data: tracks, loading, refetch } = useApi<MusicTrack[]>('/music');

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState<'spotify' | 'youtube' | 'apple'>('spotify');
  const [saving, setSaving] = useState(false);

  const filtered = (tracks || [])
    .filter((t) => {
      if (favOnly && !t.isFavorite) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.platform.toLowerCase().includes(q)
      );
    });

  const handleAdd = async () => {
    if (!formTitle.trim() || !formArtist.trim() || !formUrl.trim()) return;
    setSaving(true);
    try {
      await apiPost('/music', {
        title: formTitle.trim(),
        artist: formArtist.trim(),
        url: formUrl.trim(),
        platform: formPlatform,
      });
      setFormTitle('');
      setFormArtist('');
      setFormUrl('');
      setFormPlatform('spotify');
      setShowModal(false);
      refetch();
    } catch {}
    setSaving(false);
  };

  const handleToggleFav = async (track: MusicTrack) => {
    try {
      await apiPut(`/music/${track._id}`, { isFavorite: !track.isFavorite });
      refetch();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/music/${id}`);
      refetch();
    } catch {}
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
      <motion.div variants={item} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Our Playlist</h1>
          <p className="text-sm text-slate-400 mt-1">
            {(tracks || []).length} track{(tracks || []).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          Add
        </Button>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 mb-5">
        <div className="flex-1">
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search tracks..."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFavOnly(!favOnly)}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
            favOnly
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white/60 backdrop-blur-sm text-slate-500 dark:text-slate-300 border-white/40 hover:bg-white/80'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={favOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Favs
        </motion.button>
      </motion.div>

      {filtered.length > 0 ? (
        <motion.div className="space-y-2.5">
          {filtered.map((track) => {
            const pl = platformConfig[track.platform] || platformConfig.spotify;
            return (
              <motion.div key={track._id} variants={item}>
                <GlassCard className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => window.open(track.url, '_blank')}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-400/30"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{track.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300 truncate">{track.artist}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pl.color}`}
                    >
                      {pl.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleToggleFav(track)}
                      className="p-2 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={track.isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={track.isFavorite ? 'text-rose-500' : 'text-slate-300'}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleDelete(track._id)}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-300 hover:text-red-400"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {search || favOnly ? (
            <EmptyState
              icon="🔍"
              title="No Matches"
              description="Try adjusting your search or filter."
            />
          ) : (
            <EmptyState
              icon="🎵"
              title="No Music Yet"
              description="Add your favorite songs to build your playlist together."
              action={
                <Button onClick={() => setShowModal(true)}>Add Your First Song</Button>
              }
            />
          )}
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Music">
        <div className="space-y-4">
          <Input
            value={formTitle}
            onChange={setFormTitle}
            placeholder="Song title"
            label="Title"
            required
          />
          <Input
            value={formArtist}
            onChange={setFormArtist}
            placeholder="Artist name"
            label="Artist"
            required
          />
          <Input
            value={formUrl}
            onChange={setFormUrl}
            placeholder="https://..."
            label="URL"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1">Platform</label>
            <div className="flex gap-2">
              {(['spotify', 'youtube', 'apple'] as const).map((p) => {
                const cfg = platformConfig[p];
                return (
                  <motion.button
                    key={p}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormPlatform(p)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                      formPlatform === p
                        ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white border-transparent shadow-md shadow-blue-400/25'
                        : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full" loading={saving}>
            Add to Playlist
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
