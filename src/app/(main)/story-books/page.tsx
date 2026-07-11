'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/useToast';
import type { StoryBook, Settings } from '@/types';
import { formatDate } from '@/lib/utils';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function StoryBooksPage() {
  const { data: storyBooks, loading, refetch } = useApi<StoryBook[]>('/storybooks');
  const { data: settings } = useApi<Settings>('/settings');
  const { activeProfile } = useAuthStore();
  const { addToast, ToastContainer } = useToast();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('Download started!', 'success');
  };

  const handleShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
        addToast('Shared successfully!', 'success');
      } catch {
        // If share fails, copy link
        await navigator.clipboard.writeText(url);
        addToast('Link copied to clipboard!', 'success');
      }
    } else {
      await navigator.clipboard.writeText(url);
      addToast('Link copied to clipboard!', 'success');
    }
  };

  const confirmDelete = (id: string) => {
    setBookToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/storybooks/${bookToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('Story book deleted!', 'success');
        await refetch();
      } else {
        addToast('Failed to delete story book', 'error');
      }
    } catch {
      addToast('Failed to delete story book', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!storyBooks || storyBooks.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <EmptyState
          icon="📚"
          title="No Story Books Yet"
          description="Create your first love story book in Settings > Export > PDF Story Book!"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-4"
    >
      <ToastContainer />
      
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          📚 Story Books
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your collection of beautiful love story books
        </p>
      </div>

      <div className="grid gap-5">
        {storyBooks.map((book) => (
          <motion.div key={book._id} variants={item}>
            <GlassCard>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-2xl">
                      📖
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {book.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {book.year} Edition
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Generated: {formatDate(book.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>📄</span>
                      <span>{book.pageCount} Pages</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>💾</span>
                      <span>{formatFileSize(book.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>✍️</span>
                      <span>By: {settings?.[book.generatedBy === 'me' ? 'partnerName1' : 'partnerName2'] || book.generatedBy}</span>
                    </div>
                    {book.version > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span>📝</span>
                        <span>v{book.version}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleView(book.fileUrl)}
                    variant="primary"
                    size="sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownload(book.fileUrl, book.title)}
                    variant="secondary"
                    size="sm"
                  >
                    Download
                  </Button>
                  <Button
                    onClick={() => handleShare(book.fileUrl, book.title)}
                    variant="secondary"
                    size="sm"
                  >
                    Share
                  </Button>
                  <Button
                    onClick={() => confirmDelete(book._id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-3xl mx-auto">
            🗑️
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
              Delete Story Book?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              This action cannot be undone. The book will be permanently removed.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              className="flex-1"
              loading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
