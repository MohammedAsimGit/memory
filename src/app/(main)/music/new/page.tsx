'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiPost } from '@/hooks/useApi';

const platformConfig: Record<string, { label: string; icon: string }> = {
  spotify: { label: 'Spotify', icon: '🟢' },
  youtube: { label: 'YouTube', icon: '▶️' },
  apple: { label: 'Apple', icon: '🍎' },
};

export default function NewMusicPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'spotify' | 'youtube' | 'apple'>('spotify');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !artist.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await apiPost('/music', { title, artist, url, platform });
      router.push('/music');
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pb-24">
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 mb-5 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1">🎵 Add a Song</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add a song that means something to your relationship.</p>

      <div className="space-y-4">
        <Input label="Title" value={title} onChange={setTitle} placeholder="Song title" required />
        <Input label="Artist" value={artist} onChange={setArtist} placeholder="Artist name" required />
        <Input label="URL" value={url} onChange={setUrl} placeholder="https://..." required />

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1">Platform</label>
          <div className="flex gap-2">
            {(['spotify', 'youtube', 'apple'] as const).map((p) => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                  platform === p
                    ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white border-transparent shadow-md shadow-blue-400/25'
                    : 'bg-white/60 backdrop-blur-sm text-slate-600 dark:text-slate-200 border-white/40 hover:bg-white/80'
                }`}
              >
                {platformConfig[p].icon} {platformConfig[p].label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1" loading={saving} disabled={!title.trim() || !artist.trim() || !url.trim()}>
            Add to Playlist
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
