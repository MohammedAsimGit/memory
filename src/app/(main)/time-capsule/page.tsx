'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi, apiPost, apiDelete } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { TimeCapsule } from '@/types';
import { daysUntil, isPast, formatDate } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.25 },
  },
};

function CapsuleIcon({ locked }: { locked: boolean }) {
  return (
    <motion.div
      animate={locked ? { y: [0, -4, 0] } : {}}
      transition={locked ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`w-full h-36 rounded-2xl flex items-center justify-center text-6xl ${
        locked
          ? 'bg-gradient-to-br from-indigo-100 to-purple-200'
          : 'bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20'
      }`}
    >
      {locked ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-5xl">📦</span>
          <span className="text-2xl">⏳</span>
        </div>
      ) : (
        <span className="text-5xl">🎁</span>
      )}
    </motion.div>
  );
}

function LiveCountdown({ targetDate }: { targetDate: string }) {
  const days = daysUntil(targetDate);

  if (days <= 0) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center"
      >
        <span className="text-3xl">🎉</span>
        <p className="text-sm font-bold text-emerald-700 mt-1">Unlocked!</p>
      </motion.div>
    );
  }

  const totalSeconds = days * 86400;
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-amber-700 tabular-nums">{d}</span>
        <span className="text-[9px] text-amber-500 font-semibold uppercase">days</span>
      </div>
      <span className="text-amber-400 font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-amber-700 tabular-nums">{h}</span>
        <span className="text-[9px] text-amber-500 font-semibold uppercase">hrs</span>
      </div>
      <span className="text-amber-400 font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-amber-700 tabular-nums">{m}</span>
        <span className="text-[9px] text-amber-500 font-semibold uppercase">min</span>
      </div>
      <span className="text-amber-400 font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-amber-700 tabular-nums">{s}</span>
        <span className="text-[9px] text-amber-500 font-semibold uppercase">sec</span>
      </div>
    </div>
  );
}

export default function TimeCapsulePage() {
  const { data: capsules, loading, refetch } = useApi<TimeCapsule[]>('/time-capsule');
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    unlockDate: '',
    images: [] as string[],
  });

  const resetForm = () => {
    setShowModal(false);
    setForm({ title: '', content: '', unlockDate: '', images: [] });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.unlockDate) return;
    setSubmitting(true);
    try {
      await apiPost('/time-capsule', { ...form, author: activeProfile || 'me' });
      await refetch();
      resetForm();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time capsule?')) return;
    setDeleting(id);
    try {
      await apiDelete(`/time-capsule/${id}`);
      await refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleImagePlaceholder = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      setForm({ ...form, images: [...form.images, url] });
    }
  };

  const removeImage = (idx: number) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== idx),
    });
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
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Time Capsule
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Memories locked in time, waiting to be rediscovered
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm">
            + New Capsule
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !capsules || capsules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmptyState
            icon="📦"
            title="No Time Capsules Yet"
            description="Bury memories, photos, and messages for a future date. When the time comes, open them together."
            action={
              <Button onClick={() => setShowModal(true)} size="md">
                Create Your First Capsule
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
          {capsules.map((capsule) => {
            const locked = capsule.isLocked || isPast(capsule.unlockDate) === false;
            const isExpanded = expandedId === capsule._id;

            return (
              <motion.div
                key={capsule._id}
                variants={cardVariants}
                exit="exit"
                layout
              >
                <GlassCard
                  padding="sm"
                  onClick={() => {
                    if (!locked) toggleExpand(capsule._id);
                  }}
                >
                  <div className="relative">
                    <CapsuleIcon locked={locked} />

                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                          <LiveCountdown targetDate={capsule.unlockDate} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 px-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                        {capsule.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {locked ? 'Sealed until' : 'Unlocked on'}{' '}
                      {formatDate(capsule.unlockDate)}
                    </p>

                    {!locked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(capsule._id);
                        }}
                        className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
                      >
                        {isExpanded ? 'Hide content' : 'Open capsule'}
                      </button>
                    )}

                    {isExpanded && !locked && (
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
                          className="mt-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-200/40"
                        >
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {capsule.content}
                          </p>

                          {capsule.images && capsule.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {capsule.images.map((img, i) => (
                                <motion.button
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.05 * i }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(img);
                                  }}
                                  className="rounded-xl overflow-hidden aspect-square"
                                >
                                  <img
                                    src={img}
                                    alt={`Capsule image ${i + 1}`}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/50 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(capsule._id);
                        }}
                        disabled={deleting === capsule._id}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        {deleting === capsule._id ? (
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

      <Modal isOpen={showModal} onClose={resetForm} title="Create Time Capsule">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Our summer memories..."
            required
          />

          <Input
            label="Message"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="What do you want to remember? What message do you want to leave for your future selves?"
            multiline
            rows={5}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1 mb-1.5">
              Images
            </label>
            <div className="space-y-2">
              {form.images.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 pr-1"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-300 truncate flex-1">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleImagePlaceholder}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 dark:text-slate-300 hover:border-[#4FC3F7] hover:text-[#1976D2] hover:bg-sky-50/50 transition-all duration-200 font-medium"
              >
                + Add Image URL
              </button>
            </div>
          </div>

          <Input
            label="Unlock Date"
            type="date"
            value={form.unlockDate}
            onChange={(v) => setForm({ ...form, unlockDate: v })}
            required
          />

          {form.unlockDate && form.unlockDate <= now && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
              This date is today or in the past — the capsule will be unlocked immediately.
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
              Bury Capsule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)}>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Capsule image"
              className="w-full max-h-[70vh] object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </Modal>
    </motion.div>
  );
}
