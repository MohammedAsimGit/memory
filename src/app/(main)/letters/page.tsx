'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi, apiPost, apiDelete } from '@/hooks/useApi';
import { Letter } from '@/types';
import { daysUntil, isPast, formatDate } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotateY: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    rotateY: 10,
    transition: { duration: 0.25 },
  },
};

function EnvelopeIcon({ locked }: { locked: boolean }) {
  return (
    <motion.div
      animate={locked ? { rotate: [0, -3, 3, 0] } : {}}
      transition={locked ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`w-full h-40 rounded-2xl flex items-center justify-center text-6xl ${
        locked
          ? 'bg-gradient-to-br from-amber-100 to-amber-200'
          : 'bg-gradient-to-br from-[#4FC3F7]/15 to-[#1976D2]/15'
      }`}
    >
      {locked ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl">✉️</span>
          <span className="text-3xl">🔒</span>
        </div>
      ) : (
        <span className="text-5xl">💌</span>
      )}
    </motion.div>
  );
}

function CountdownBadge({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
        🎉 Unlocked!
      </span>
    );
  }

  return (
    <motion.div
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-xs font-semibold text-amber-700"
    >
      <span className="text-sm">⏳</span>
      {days} {days === 1 ? 'day' : 'days'} until unlock
    </motion.div>
  );
}

export default function LettersPage() {
  const { data: letters, loading, refetch } = useApi<Letter[]>('/letters');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: '',
    content: '',
    unlockDate: '',
  });

  const resetForm = () => {
    setShowModal(false);
    setForm({ title: '', content: '', unlockDate: '' });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.unlockDate) return;
    setSubmitting(true);
    try {
      await apiPost('/letters', form);
      await refetch();
      resetForm();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this letter?')) return;
    setDeleting(id);
    try {
      await apiDelete(`/letters/${id}`);
      await refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const toggleOpen = (id: string) => {
    setOpenedId(openedId === id ? null : id);
  };

  const handleReveal = (id: string, locked: boolean) => {
    if (locked) return;
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setOpenedId(id);
  };

  const now = new Date().toISOString().slice(0, 10);

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
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Letters to Future
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Write letters to each other, sealed until the right moment
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm">
            + New Letter
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !letters || letters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmptyState
            icon="💌"
            title="No Letters Yet"
            description="Write a heartfelt letter and set a future date for it to be opened. A beautiful surprise waiting in time."
            action={
              <Button onClick={() => setShowModal(true)} size="md">
                Write Your First Letter
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {letters.map((letter) => {
            const locked = letter.isLocked || isPast(letter.unlockDate) === false;
            const days = daysUntil(letter.unlockDate);
            const isOpen = openedId === letter._id;
            const isRevealed = revealedIds.has(letter._id);

            return (
              <motion.div
                key={letter._id}
                variants={cardVariants}
                exit="exit"
                layout
              >
                <GlassCard
                  padding="sm"
                  onClick={() => {
                    if (!locked && !isRevealed) {
                      handleReveal(letter._id, locked);
                    } else if (!locked) {
                      toggleOpen(letter._id);
                    }
                  }}
                >
                  <EnvelopeIcon locked={locked} />

                  <div className="mt-3 px-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">
                      {letter.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {locked ? 'Sealed until' : 'Unlocked on'}{' '}
                      {formatDate(letter.unlockDate)}
                    </p>

                    <div className="mt-2">
                      {locked ? (
                        <CountdownBadge days={Math.max(0, days)} />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                          📖 Read now
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isOpen && !locked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="mt-3 p-4 rounded-xl bg-[#FFF8E7] border border-amber-200/60"
                          >
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {letter.content}
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isOpen && locked && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-xs text-amber-600 text-center italic"
                      >
                        This letter is still sealed. It will unlock on{' '}
                        {formatDate(letter.unlockDate)}.
                      </motion.p>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/50 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(letter._id);
                        }}
                        disabled={deleting === letter._id}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        {deleting === letter._id ? (
                          <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={resetForm} title="Write a Letter">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="My love for you..."
            required
          />

          <Input
            label="Your Letter"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="Write from your heart. This letter will be sealed until the unlock date..."
            multiline
            rows={7}
            required
          />

          <Input
            label="Unlock Date"
            type="date"
            value={form.unlockDate}
            onChange={(v) => setForm({ ...form, unlockDate: v })}
            required
          />

          {form.unlockDate && form.unlockDate <= now && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
              This date is today or in the past — the letter will be unlocked immediately.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={resetForm} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.title || !form.content || !form.unlockDate}
              loading={submitting}
              className="flex-1"
            >
              Seal Letter
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
