'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GlassCard from '@/components/ui/Card';
import { apiPost } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import type { Letter } from '@/types';

export default function NewLetterPage() {
  const router = useRouter();
  const activeProfile = useAuthStore((s) => s.activeProfile);

  const [form, setForm] = useState({ title: '', content: '', unlockDate: '', unlockTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const hasContent = form.title || form.content || form.unlockDate;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.unlockDate) return;
    setSubmitting(true);
    try {
      await apiPost<Letter>('/letters', {
        ...form,
        author: activeProfile || 'me',
      });
      showToast('Letter sealed successfully!', 'success');
      setTimeout(() => router.push('/letters'), 700);
    } catch {
      showToast('Failed to seal letter. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasContent) {
      setConfirmDiscard(true);
    } else {
      router.back();
    }
  };

  const now = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-24"
    >
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

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1"
      >
        💌 Write a Letter to the Future
      </motion.h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Seal a message for your future selves to open.
      </p>

      <div className="space-y-5">
        <Input
          label="Letter Title"
          required
          placeholder="Our 5th Anniversary..."
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />

        <Input
          label="Your Letter"
          required
          multiline
          rows={6}
          placeholder="Write from your heart..."
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Unlock Date"
            required
            type="date"
            value={form.unlockDate}
            onChange={(v) => setForm({ ...form, unlockDate: v })}
          />
          <Input
            label="Unlock Time"
            type="time"
            value={form.unlockTime}
            onChange={(v) => setForm({ ...form, unlockTime: v })}
          />
        </div>

        {form.unlockDate && form.unlockDate <= now && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              ⏰ This date is now or past — the letter will be ready to open immediately.
            </p>
          </div>
        )}

        <GlassCard padding="md">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Preview
          </p>
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              &ldquo;{form.title || 'Untitled Letter'}&rdquo;
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Sealed until {form.unlockDate ? new Date(form.unlockDate + 'T' + (form.unlockTime || '12:00')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'a future date'}
              {form.unlockTime && ` at ${new Date(`2000-01-01T${form.unlockTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
            </p>
          </div>
        </GlassCard>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" loading={submitting} disabled={!form.title.trim() || !form.content.trim() || !form.unlockDate}>
            Seal Letter ❤️
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {confirmDiscard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-5"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/20"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                Discard this letter?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Your draft hasn&apos;t been sealed yet.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -24, x: '-50%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl shadow-black/10 backdrop-blur-md text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
