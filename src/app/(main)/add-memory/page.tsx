'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MemoryForm from '@/components/memory/MemoryForm';
import { MemoryFormData } from '@/components/memory/MemoryForm';
import { apiGet, apiPost, apiPut } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import type { Memory } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AddMemoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const activeProfile = useAuthStore((s) => s.activeProfile);

  const [initialData, setInitialData] = useState<Partial<MemoryFormData> | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!editId) {
      setPageLoading(false);
      return;
    }

    (async () => {
      try {
        const memory = await apiGet<Memory>(`/memories/${editId}`);
        setInitialData({
          title: memory.title,
          description: memory.description,
          date: memory.date,
          time: memory.time || '',
          location: memory.location || '',
          mood: memory.mood || '',
          weather: memory.weather || '',
          author: memory.author || 'me',
          music: memory.music || null,
          tags: memory.tags || [],
          images: memory.images || [],
          videos: memory.videos || [],
          voiceNotes: memory.voiceNotes || [],
        });

        if (memory.author && memory.author !== activeProfile) {
          showToast('You don\'t have permission to edit this memory.', 'error');
          setTimeout(() => router.push(`/memory/${editId}`), 1000);
        }
      } catch {
        showToast('Failed to load memory. Please try again.', 'error');
        setTimeout(() => router.push('/timeline'), 1000);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [editId]);

  const handleSubmit = async (formData: MemoryFormData) => {
    setLoading(true);
    try {
      if (editId) {
        await apiPut<Memory>(`/memories/${editId}`, formData);
        showToast('Memory updated successfully!', 'success');
        setTimeout(() => router.push(`/memory/${editId}`), 700);
      } else {
        await apiPost<Memory>('/memories', { ...formData, author: activeProfile || 'me' });
        showToast('Memory saved successfully!', 'success');
        setTimeout(() => router.push('/timeline'), 700);
      }
    } catch {
      showToast(editId ? 'Failed to update memory. Please try again.' : 'Failed to save memory. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsaved) {
      setConfirmDiscard(true);
    } else {
      router.back();
    }
  };

  const confirmAndNavigate = () => {
    setConfirmDiscard(false);
    if (pendingNavigation) {
      pendingNavigation();
    } else {
      router.back();
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-sm font-medium">{editId ? 'Back to Memory' : 'Back'}</span>
      </motion.button>

      <MemoryForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        onDirtyChange={setHasUnsaved}
      />

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
                Discard changes?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                You have unsaved edits. Are you sure you want to go back?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndNavigate}
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
