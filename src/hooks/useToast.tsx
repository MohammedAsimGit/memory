'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={cn(
              'px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium backdrop-blur-md max-w-xs',
              toast.type === 'success' && 'bg-emerald-500/90',
              toast.type === 'error' && 'bg-red-500/90',
              toast.type === 'info' && 'bg-sky-500/90'
            )}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { addToast, ToastContainer };
}
