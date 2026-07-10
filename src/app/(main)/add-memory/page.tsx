'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MemoryForm from '@/components/memory/MemoryForm';
import { MemoryFormData } from '@/components/memory/MemoryForm';
import { apiPost } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import type { Memory } from '@/types';

export default function AddMemoryPage() {
  const router = useRouter();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSubmit = async (formData: MemoryFormData) => {
    setLoading(true);
    try {
      await apiPost<Memory>('/memories', { ...formData, author: activeProfile || 'me' });
      showToast('Memory saved successfully!', 'success');
      setTimeout(() => router.push('/timeline'), 700);
    } catch {
      showToast('Failed to save memory. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => () => router.push(path);

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
        onClick={() => router.back()}
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
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <MemoryForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
      />

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
