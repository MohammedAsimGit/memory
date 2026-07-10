'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GlassCard from '@/components/ui/Card';
import { MusicAttachment } from '@/types';
import { uploadFile } from '@/hooks/useApi';

export interface MemoryFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  mood: string;
  weather: string;
  author: string;
  music: MusicAttachment | null;
  tags: string[];
  images: string[];
  videos: string[];
  voiceNotes: string[];
}

interface MemoryFormProps {
  initialData?: Partial<MemoryFormData>;
  onSubmit: (data: MemoryFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const moods = ['happy', 'loved', 'excited', 'grateful', 'peaceful', 'romantic', 'adventurous', 'nostalgic', 'silly', 'cozy'];
const weathers = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'rainbow'];

export default function MemoryForm({ initialData, onSubmit, onCancel, loading }: MemoryFormProps) {
  const [form, setForm] = useState<MemoryFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    time: initialData?.time || '',
    location: initialData?.location || '',
    mood: initialData?.mood || '',
    weather: initialData?.weather || '',
    author: initialData?.author || 'me',
    music: initialData?.music || null,
    tags: initialData?.tags || [],
    images: initialData?.images || [],
    videos: initialData?.videos || [],
    voiceNotes: initialData?.voiceNotes || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [musicInput, setMusicInput] = useState<{ title: string; artist: string; url: string; platform: 'spotify' | 'youtube' | 'apple' }>({ title: '', artist: '', url: '', platform: 'spotify' });
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof MemoryFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      update('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    update('tags', form.tags.filter((t) => t !== tag));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'videos' | 'voiceNotes') => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      setUploading(type);
      try {
        const url = await uploadFile(file);
        update(type, [...form[type], url]);
      } catch {
        setErrors((prev) => ({ ...prev, upload: 'Upload failed' }));
      }
      setUploading(null);
    }
  };

  const addMusic = () => {
    if (musicInput.title && musicInput.url) {
      update('music', { ...musicInput, embedUrl: musicInput.url });
      setMusicInput({ title: '', artist: '', url: '', platform: 'spotify' });
      setShowMusicInput(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">
        {initialData ? 'Edit Memory' : 'Add Memory'}
      </h2>

      <Input
        label="Title"
        required
        placeholder="Give your memory a title..."
        value={form.title}
        onChange={(v) => update('title', v)}
        error={errors.title}
      />

      <Input
        label="Description"
        required
        multiline
        rows={4}
        placeholder="Tell your story..."
        value={form.description}
        onChange={(v) => update('description', v)}
        error={errors.description}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          required
          type="date"
          value={form.date}
          onChange={(v) => update('date', v)}
          error={errors.date}
        />
        <Input
          label="Time"
          type="time"
          value={form.time}
          onChange={(v) => update('time', v)}
        />
      </div>

      <Input
        label="Location"
        placeholder="Where was this?"
        value={form.location}
        onChange={(v) => update('location', v)}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>}
      />

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Mood</label>
        <div className="flex flex-wrap gap-2">
          {moods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => update('mood', form.mood === mood ? '' : mood)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                form.mood === mood
                  ? 'bg-[#2196F3] text-white shadow-md'
                  : 'bg-white/60 text-slate-600 hover:bg-white'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Weather</label>
        <div className="flex flex-wrap gap-2">
          {weathers.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => update('weather', form.weather === w ? '' : w)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                form.weather === w
                  ? 'bg-[#2196F3] text-white shadow-md'
                  : 'bg-white/60 text-slate-600 hover:bg-white'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Photos</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.images.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} className="w-20 h-20 rounded-xl object-cover" />
              <button
                onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e, 'images')}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          className="w-full border-2 border-dashed border-sky-200 rounded-2xl p-4 text-sm text-sky-500 hover:bg-sky-50 transition-colors"
        >
          {uploading === 'images' ? 'Uploading...' : '+ Add Photos'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Videos</label>
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => handleUpload(e, 'videos')}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          className="w-full border-2 border-dashed border-sky-200 rounded-2xl p-4 text-sm text-sky-500 hover:bg-sky-50 transition-colors"
        >
          {uploading === 'videos' ? 'Uploading...' : '+ Add Videos'}
        </button>
        {form.videos.length > 0 && (
          <p className="text-xs text-slate-500 mt-1 ml-1">{form.videos.length} video(s) added</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Voice Notes</label>
        <input
          ref={voiceRef}
          type="file"
          accept="audio/*"
          onChange={(e) => handleUpload(e, 'voiceNotes')}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => voiceRef.current?.click()}
          className="w-full border-2 border-dashed border-sky-200 rounded-2xl p-4 text-sm text-sky-500 hover:bg-sky-50 transition-colors"
        >
          {uploading === 'voiceNotes' ? 'Uploading...' : '+ Add Voice Note'}
        </button>
        {form.voiceNotes.length > 0 && (
          <p className="text-xs text-slate-500 mt-1 ml-1">{form.voiceNotes.length} note(s) added</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-700 ml-1">Music</label>
          <button
            type="button"
            onClick={() => setShowMusicInput(!showMusicInput)}
            className="text-xs text-[#2196F3] font-medium"
          >
            {form.music ? 'Change' : '+ Add Song'}
          </button>
        </div>
        {form.music && (
          <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-2xl mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{form.music.title}</p>
              <p className="text-xs text-slate-500 truncate">{form.music.artist}</p>
            </div>
            <button onClick={() => update('music', null)} className="text-red-400 text-sm">Remove</button>
          </div>
        )}
        {showMusicInput && (
          <GlassCard padding="sm" className="space-y-2">
            <Input
              placeholder="Song title"
              value={musicInput.title}
              onChange={(v) => setMusicInput((p) => ({ ...p, title: v }))}
            />
            <Input
              placeholder="Artist"
              value={musicInput.artist}
              onChange={(v) => setMusicInput((p) => ({ ...p, artist: v }))}
            />
            <Input
              placeholder="Spotify/YouTube URL"
              value={musicInput.url}
              onChange={(v) => setMusicInput((p) => ({ ...p, url: v }))}
            />
            <div className="flex gap-2">
              {(['spotify', 'youtube', 'apple'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMusicInput((prev) => ({ ...prev, platform: p }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    musicInput.platform === p ? 'bg-[#2196F3] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button onClick={addMusic} size="sm" className="w-full">
              Add Song
            </Button>
          </GlassCard>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium"
            >
              #{tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag..."
            value={tagInput}
            onChange={setTagInput}
            className="flex-1"
          />
          <Button onClick={addTag} variant="secondary" size="sm">Add</Button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button onClick={onCancel} variant="ghost" className="flex-1">
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} className="flex-1" loading={loading}>
          {initialData ? 'Update Memory' : 'Save Memory'}
        </Button>
      </div>
    </div>
  );
}
