'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiPost } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';

const moodOptions: { value: string; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'loved', emoji: '🥰', label: 'Loved' },
  { value: 'excited', emoji: '🎉', label: 'Excited' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { value: 'romantic', emoji: '💕', label: 'Romantic' },
  { value: 'nostalgic', emoji: '🥹', label: 'Nostalgic' },
  { value: 'adventurous', emoji: '🌟', label: 'Adventurous' },
  { value: 'cozy', emoji: '🫶', label: 'Cozy' },
  { value: 'silly', emoji: '😋', label: 'Silly' },
];

export default function NewJournalPage() {
  const router = useRouter();
  const activeProfile = useAuthStore((s) => s.activeProfile);

  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    mood: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const hasContent = form.title || form.content;

  const handleSubmit = async () => {
    if (!form.date || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const combined = form.title ? `${form.title}\n\n${form.content}` : form.content;
      await apiPost('/journal', {
        date: form.date,
        time: form.time,
        mood: form.mood || undefined,
        content: combined,
        author: activeProfile || 'me',
      });
      router.push('/journal');
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const handleCancel = () => {
    if (hasContent) setConfirmDiscard(true);
    else router.back();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pb-24">
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={handleCancel}
        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 mb-5 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1">📔 New Journal Entry</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Write today&apos;s thoughts and feelings.</p>

      <div className="space-y-4">
        <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Today's highlights..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} required />
          <Input label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1 mb-2">Mood</label>
          <div className="grid grid-cols-5 gap-2">
            {moodOptions.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm({ ...form, mood: form.mood === m.value ? '' : m.value })}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  form.mood === m.value
                    ? 'bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 ring-2 ring-[#2196F3]/40 text-[#1976D2] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Input label="Content" value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Write your thoughts, feelings, and memories..." multiline rows={6} required />

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1" loading={submitting} disabled={!form.date || !form.content.trim()}>
            Create Entry
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {confirmDiscard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-5"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/20"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Discard this entry?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your draft hasn&apos;t been saved yet.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDiscard(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button onClick={() => router.back()} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Discard</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
