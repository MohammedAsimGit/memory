'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthorAvatar from '@/components/post/AuthorAvatar';
import { useApi, apiPost, apiDelete, apiPut } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { Letter } from '@/types';
import { formatDate } from '@/lib/utils';
import { getUnlockStatus, formatRemaining } from '@/lib/unlockUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
};

const statusConfig = {
  sealed: { label: 'Sealed', icon: '🔒', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  ready: { label: 'Ready', icon: '🔓', bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-300' },
  opened: { label: 'Opened', icon: '📖', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
};

export default function LettersPage() {
  const { data: letters, loading, refetch } = useApi<Letter[]>('/letters');
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [liveDurations, setLiveDurations] = useState<Record<string, number>>({});
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (!letters) return;
      const next: Record<string, number> = {};
      for (const l of letters) {
        if (l.isOpened) continue;
        next[l._id] = new Date(l.unlockDate).getTime() - Date.now();
      }
      setLiveDurations(next);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [letters]);

  const [form, setForm] = useState({ title: '', content: '', unlockDate: '' });

  const resetForm = () => {
    setShowModal(false);
    setForm({ title: '', content: '', unlockDate: '' });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.unlockDate) return;
    setSubmitting(true);
    try {
      await apiPost('/letters', { ...form, author: activeProfile || 'me' });
      await refetch();
      resetForm();
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this letter?')) return;
    setDeleting(id);
    try {
      await apiDelete(`/letters/${id}`);
      await refetch();
      setMenuOpen(null);
    } catch { /* silent */ }
    setDeleting(null);
  };

  const handleOpen = async (id: string) => {
    if (openingId) return;
    setOpeningId(id);
    try {
      await apiPut(`/letters/${id}`, { markOpened: true });
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setMenuOpen(null);
      await refetch();
    } catch { /* silent */ }
    setOpeningId(null);
  };

  const handleTapLocked = (id: string) => {
    setShakeId(id);
    setTimeout(() => setShakeId(null), 800);
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          💌 Letters to Future
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Write messages to each other that will be opened at the perfect time.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !letters || letters.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col items-center py-20 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center text-4xl shadow-lg mb-4"
            >
              💌
            </motion.div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No letters yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              Write something today for your future selves.
            </p>
            <Button onClick={() => setShowModal(true)}>Write Your First Letter</Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {letters.map((letter) => {
            const isRevealed = revealedIds.has(letter._id) || letter.isOpened === true;
            const { status, canOpen, remainingMs } = getUnlockStatus(letter.unlockDate, letter.isOpened || isRevealed);

            return (
              <motion.div
                key={letter._id}
                variants={cardVariants}
                layout
              >
                <motion.div
                  animate={shakeId === letter._id ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard padding="md" className="relative">
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === letter._id ? null : letter._id);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {menuOpen === letter._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                            className="absolute right-0 top-8 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20"
                          >
                            {canOpen && !isRevealed && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpen(letter._id); }}
                                className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/30 flex items-center gap-2 transition-colors"
                              >
                                <span>📖</span> Open
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(letter._id); }}
                              disabled={deleting === letter._id}
                              className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                              <span>🗑️</span> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => {
                        if (!canOpen) {
                          handleTapLocked(letter._id);
                        } else if (!isRevealed) {
                          handleOpen(letter._id);
                        }
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                          ✉️
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[status].bg} ${statusConfig[status].text}`}>
                              {statusConfig[status].icon} {statusConfig[status].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-1 mb-2">
                        &ldquo;{letter.title}&rdquo;
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        <AuthorAvatar name={letter.author || 'me'} size="sm" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {letter.author === 'me' ? 'From you' : 'From her'}
                        </span>
                      </div>

                      {!canOpen ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200/50 dark:border-amber-700/30 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-sm">
                          <span>⏳</span> {formatRemaining(liveDurations[letter._id] ?? remainingMs)}
                        </div>
                      ) : !isRevealed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border border-sky-200/50 dark:border-sky-700/30 text-xs font-semibold text-sky-700 dark:text-sky-300 shadow-sm">
                          <span>🔓</span> Ready to open
                        </div>
                      ) : null}

                      {!canOpen && (
                        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                          Unlocks {formatDate(letter.unlockDate)}
                        </p>
                      )}
                    </button>

                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 p-4 rounded-2xl bg-[#FFF8E7] dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/20">
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {letter.content}
                            </p>
                          </div>
                        </motion.div>
                      )}
                      {shakeId === letter._id && !canOpen && (
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 text-xs text-amber-600 dark:text-amber-400 text-center italic px-2"
                        >
                          This letter is still sealed. It will unlock on {formatDate(letter.unlockDate)}.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={resetForm} title="Write a Letter">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Our first anniversary..." required />
          <Input label="Your Letter" value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Write from your heart..." multiline rows={6} required />
          <Input label="Unlock Date" type="date" value={form.unlockDate} onChange={(v) => setForm({ ...form, unlockDate: v })} required />
          {form.unlockDate && form.unlockDate <= new Date().toISOString().slice(0, 10) && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">This date is now or past — the letter will unlock immediately.</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={resetForm} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.content || !form.unlockDate} loading={submitting} className="flex-1">Seal Letter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
