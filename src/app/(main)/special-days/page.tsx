'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useApi, apiPost } from '@/hooks/useApi';
import { SpecialDay } from '@/types';
import { daysUntil, isToday, isPast } from '@/lib/utils';

const typeConfig: Record<string, { label: string; icon: string }> = {
  'first-meet': { label: 'First Meet', icon: '🤝' },
  'first-date': { label: 'First Date', icon: '💕' },
  anniversary: { label: 'Anniversary', icon: '💍' },
  birthday: { label: 'Birthday', icon: '🎂' },
  trip: { label: 'Trip', icon: '✈️' },
  custom: { label: 'Custom', icon: '✨' },
};

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

export default function SpecialDaysPage() {
  const { data: specialDays, loading, refetch } = useApi<SpecialDay[]>('/special-days');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    type: 'custom' as string,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    setSubmitting(true);
    try {
      await apiPost('/special-days', form);
      await refetch();
      setShowModal(false);
      setForm({ title: '', date: '', type: 'custom', description: '' });
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/special-days/${id}`, { method: 'DELETE' });
      await refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-white">Special Days</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
        >
          + Add
        </Button>
      </motion.div>

      {loading ? (
        <div className="mt-20 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {specialDays?.map((day) => {
              const cfg = typeConfig[day.type] ?? typeConfig.custom;
              const isToday_ = isToday(day.date);
              const isPast_ = isPast(day.date);
              const remaining = daysUntil(day.date);

              return (
                <motion.div
                  key={day._id}
                  variants={cardVariants}
                  exit="exit"
                  layout
                >
                  <GlassCard className="relative overflow-hidden rounded-2xl p-5">
                    {isToday_ && (
                      <div className="absolute -right-5 -top-5 rotate-45 bg-gradient-to-r from-rose-400 to-pink-500 px-10 py-1 text-xs font-bold text-white shadow-lg">
                        TODAY
                      </div>
                    )}

                    <div className="mb-4 flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                        {cfg.icon}
                      </span>
                      <button
                        onClick={() => handleDelete(day._id)}
                        disabled={deleting === day._id}
                        className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/20 hover:text-red-400"
                      >
                        {deleting === day._id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border border-red-400 border-t-transparent" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <h3 className="mb-1 text-lg font-semibold text-white">
                      {day.title}
                    </h3>

                    <p className="mb-3 text-sm text-white/60">
                      {cfg.label} · {new Date(day.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {isPast_ && !isToday_ ? (
                      <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
                        Passed
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">
                          {remaining}
                        </span>
                        <span className="text-sm text-white/50">
                          {remaining === 1 ? 'day' : 'days'} {isToday_ ? '🎉' : 'remaining'}
                        </span>
                      </div>
                    )}

                    {day.description && (
                      <p className="mt-3 text-sm text-white/40 line-clamp-2">
                        {day.description}
                      </p>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {specialDays?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <p className="text-5xl">📅</p>
              <p className="mt-4 text-lg text-white/50">No special days yet</p>
              <p className="mt-1 text-sm text-white/30">
                Tap + Add to create your first one
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="mx-auto max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl ring-1 ring-white/10"
            >
              <h2 className="mb-6 text-xl font-bold text-white">
                New Special Day
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Title
                  </label>
                  <Input
                    value={form.title}
                    onChange={(v) =>
                      setForm({ ...form, title: v })
                    }
                    placeholder="Our first trip..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(v) =>
                      setForm({ ...form, date: v })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, type: key })}
                        className={`rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                          form.type === key
                            ? 'bg-white/20 text-white ring-1 ring-white/30'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        <span className="block text-base">{cfg.icon}</span>
                        <span className="mt-0.5 block">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="A little note..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !form.title || !form.date}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </motion.div>
          </Modal>
    </div>
  );
}
