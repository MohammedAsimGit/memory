'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import PostHeader from '@/components/post/PostHeader';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { JournalEntry } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

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

function getMoodEmoji(mood: string): string {
  return moodOptions.find((m) => m.value === mood)?.emoji || '💙';
}

function getMoodLabel(mood: string): string {
  return moodOptions.find((m) => m.value === mood)?.label || mood;
}

function splitTitleContent(raw: string): { title: string; body: string } {
  const idx = raw.indexOf('\n\n');
  if (idx === -1) return { title: '', body: raw };
  return { title: raw.slice(0, idx), body: raw.slice(idx + 2) };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export default function JournalPage() {
  const { data: entries, loading, refetch } = useApi<JournalEntry[]>('/journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    mood: '',
    content: '',
  });

  const filtered = (entries || []).filter((e) =>
    !searchQuery || e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditingEntry(null);
    setForm({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      mood: '',
      content: '',
    });
    setShowModal(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    const { title, body } = splitTitleContent(entry.content);
    setForm({
      title,
      date: entry.date.slice(0, 10),
      time: entry.time,
      mood: entry.mood || '',
      content: body,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingEntry(null);
    setForm({ title: '', date: '', time: '', mood: '', content: '' });
  };

  const handleSubmit = async () => {
    if (!form.date || !form.content) return;
    setSubmitting(true);
    try {
      const combined = form.title ? `${form.title}\n\n${form.content}` : form.content;
      const payload = {
        date: form.date,
        time: form.time,
        mood: form.mood || undefined,
        content: combined,
      };
      if (editingEntry) {
        await apiPut(`/journal/${editingEntry._id}`, payload);
      } else {
        await apiPost('/journal', payload);
      }
      await refetch();
      resetForm();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;
    setDeleting(id);
    try {
      await apiDelete(`/journal/${id}`);
      await refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-24 px-4 pt-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Daily Journal
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {entries ? `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}` : ''}
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          + New Entry
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-5"
      >
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]/50 transition-all duration-200 shadow-sm text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 && !searchQuery ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmptyState
            icon="📔"
            title="No Journal Entries Yet"
            description="Start capturing your thoughts and feelings. Your first journal entry is waiting."
            action={
              <Button onClick={openAdd} size="md">
                Write Your First Entry
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const { title } = splitTitleContent(entry.content);
              const preview = entry.content
                .replace(title ? `${title}\n\n` : '', '')
                .slice(0, 120);
              const moodEmoji = entry.mood ? getMoodEmoji(entry.mood) : null;

              return (
                <motion.div
                  key={entry._id}
                  variants={cardVariants}
                  exit="exit"
                  layout
                >
                  <GlassCard padding="md" className="relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <PostHeader
                        author={entry.author || 'me'}
                        date={entry.date}
                        time={entry.time}
                        mood={entry.mood}
                      />

                      <div className="flex items-center gap-1 ml-2 mt-1">
                        <button
                          onClick={() => openEdit(entry)}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:text-[#1976D2] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          disabled={deleting === entry._id}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                        >
                          {deleting === entry._id ? (
                            <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {title && (
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
                    )}

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {preview || entry.content.slice(0, 120)}
                    </p>

                    {entry.photo && (
                      <div className="mt-3 rounded-xl overflow-hidden">
                        <img
                          src={entry.photo}
                          alt="Journal photo"
                          className="w-full h-36 object-cover rounded-xl"
                        />
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-500 text-sm">No entries matching &quot;{searchQuery}&quot;</p>
            </motion.div>
          )}
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={resetForm} title={editingEntry ? 'Edit Entry' : 'New Journal Entry'}>
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Today's highlights..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={form.time}
              onChange={(v) => setForm({ ...form, time: v })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">
              Mood
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm({ ...form, mood: form.mood === m.value ? '' : m.value })}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    form.mood === m.value
                      ? 'bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 ring-2 ring-[#2196F3]/40 text-[#1976D2] shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Content"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="Write your thoughts, feelings, and memories..."
            multiline
            rows={6}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={resetForm}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.date || !form.content}
              loading={submitting}
              className="flex-1"
            >
              {editingEntry ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
