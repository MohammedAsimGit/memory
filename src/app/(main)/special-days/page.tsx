'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { SpecialDay } from '@/types';
import { daysUntil, isToday, isPast, formatDate } from '@/lib/utils';

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  'first-meet': { label: 'First Meet', icon: '🤝', color: '#6366F1' },
  'first-date': { label: 'First Date', icon: '💕', color: '#EC4899' },
  anniversary: { label: 'Anniversary', icon: '💍', color: '#F59E0B' },
  birthday: { label: 'Birthday', icon: '🎂', color: '#8B5CF6' },
  trip: { label: 'Trip', icon: '✈️', color: '#10B981' },
  custom: { label: 'Custom', icon: '✨', color: '#2196F3' },
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
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

interface SpecialDayForm {
  title: string;
  date: string;
  type: string;
  description: string;
}

const emptyForm: SpecialDayForm = { title: '', date: '', type: 'custom', description: '' };

export default function SpecialDaysPage() {
  const { data: specialDays, loading, refetch } = useApi<SpecialDay[]>('/special-days');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SpecialDayForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (day: SpecialDay) => {
    setEditingId(day._id);
    setForm({
      title: day.title,
      date: day.date,
      type: day.type,
      description: day.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await apiPut(`/special-days/${editingId}`, form);
      } else {
        await apiPost('/special-days', form);
      }
      await refetch();
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiDelete(`/special-days/${id}`);
      await refetch();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Special Days
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Countdowns & milestones
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          + Add
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2196F3]/20 border-t-[#2196F3]" />
        </div>
      ) : specialDays?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <p className="text-5xl">📅</p>
          <p className="mt-4 text-lg font-semibold text-slate-600">No special days yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Tap + Add to create your first one
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {specialDays?.map((day) => {
              const cfg = typeConfig[day.type] ?? typeConfig.custom;
              const today = isToday(day.date);
              const past = isPast(day.date);
              const remaining = daysUntil(day.date);

              return (
                <motion.div
                  key={day._id}
                  variants={cardVariants}
                  exit="exit"
                  layout
                >
                  <GlassCard padding="md" className="relative overflow-hidden">
                    {today && (
                      <div className="absolute -right-8 -top-8 rotate-45 bg-gradient-to-r from-rose-400 to-pink-500 px-12 py-2 text-xs font-bold text-white shadow-lg">
                        TODAY
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                        style={{ background: `${cfg.color}15` }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-base">
                          {day.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cfg.label} · {formatDate(day.date)}
                        </p>
                      </div>
                    </div>

                    {day.description && (
                      <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {day.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      {past && !today ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                          Passed
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-slate-800">
                            {remaining}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {remaining === 1 ? 'day' : 'days'} {today ? '🎉' : 'left'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(day)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-[#2196F3] transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(day._id)}
                          disabled={deleting === day._id}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting === day._id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Special Day' : 'New Special Day'}>
        <div className="space-y-4">
          <Input
            label="Title"
            required
            placeholder="Our first trip..."
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />

          <Input
            label="Date"
            required
            type="date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, type: key })}
                  className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    form.type === key
                      ? 'bg-[#2196F3] text-white shadow-md shadow-blue-300/30'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-base mb-0.5">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Description"
            placeholder="A little note..."
            multiline
            rows={3}
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => setShowModal(false)}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            loading={submitting}
            disabled={!form.title || !form.date}
          >
            {editingId ? 'Update' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
