'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ImageSlider from '@/components/memory/ImageSlider';
import CommentSection from '@/components/memory/CommentSection';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useApi, apiGet, apiPost, apiDelete } from '@/hooks/useApi';
import type { Memory, Comment } from '@/types';
import { formatDate, formatTime, getMoodEmoji, getWeatherEmoji } from '@/lib/utils';

const detailItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export default function MemoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: memory, loading, error } = useApi<Memory>(`/memories/${id}`);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const data = await apiGet<Comment[]>(`/memories/${id}/comments`);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAddComment = async (content: string) => {
    try {
      const newComment = await apiPost<Comment>(`/memories/${id}/comments`, {
        content,
        author: 'Me',
      });
      setComments((prev) => [newComment, ...prev]);
      showToast('Comment added!', 'success');
    } catch {
      showToast('Failed to add comment.', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/memories/${id}`);
      setDeleteOpen(false);
      router.push('/timeline');
    } catch {
      showToast('Failed to delete memory.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !memory) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-6"
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
          {':('}
        </div>
        <h2 className="text-xl font-bold text-slate-700">Memory Not Found</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          {error || 'This memory may have been removed or the link is broken.'}
        </p>
        <Button onClick={() => router.push('/timeline')} variant="secondary">
          Back to Timeline
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-32"
    >
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 mb-4 transition-colors"
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

      {memory.images && memory.images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-5"
        >
          <ImageSlider images={memory.images} />
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={detailItem}>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {memory.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(memory.date)}
            </span>
            {memory.time && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(memory.time)}
              </span>
            )}
          </div>
        </motion.div>

        {(memory.location || memory.mood || memory.weather) && (
          <motion.div variants={detailItem}>
            <GlassCard padding="sm">
              <div className="flex flex-wrap items-center gap-3">
                {memory.location && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {memory.location}
                  </div>
                )}
                {memory.mood && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 rounded-full text-xs font-medium text-sky-700">
                    {getMoodEmoji(memory.mood)} {memory.mood}
                  </span>
                )}
                {memory.weather && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full text-xs font-medium text-amber-700">
                    {getWeatherEmoji(memory.weather)} {memory.weather}
                  </span>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div variants={detailItem}>
          <GlassCard>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {memory.description}
            </p>
          </GlassCard>
        </motion.div>

        {memory.music && (
          <motion.div variants={detailItem}>
            <GlassCard padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {'\uD83C\uDFB5'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {memory.music.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {memory.music.artist}
                    <span className="mx-1.5 opacity-40">|</span>
                    <span className="capitalize">{memory.music.platform}</span>
                  </p>
                </div>
                {memory.music.url && (
                  <a
                    href={memory.music.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#2196F3] hover:underline flex-shrink-0"
                  >
                    Listen
                  </a>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {memory.tags && memory.tags.length > 0 && (
          <motion.div variants={detailItem}>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-sky-100/70 text-sky-700 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={detailItem}>
          <GlassCard>
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <CommentSection
                memoryId={id}
                comments={comments}
                onAdd={handleAddComment}
              />
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={detailItem} className="flex gap-3 pt-2">
          <Button
            onClick={() => router.push(`/add-memory?edit=${id}`)}
            variant="secondary"
            className="flex-1"
          >
            Edit Memory
          </Button>
          <Button
            onClick={() => setDeleteOpen(true)}
            variant="danger"
            className="flex-1"
          >
            Delete
          </Button>
        </motion.div>
      </motion.div>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Memory"
        message="Are you sure you want to delete this memory? This action cannot be undone."
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        danger
      />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -24, x: '-50%' }}
          className={`fixed top-6 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md text-sm font-semibold pointer-events-none ${
            toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
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
    </motion.div>
  );
}
