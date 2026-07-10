'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory } from '@/types';
import { apiGet } from '@/hooks/useApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface GalleryGridProps {
  memories: Memory[];
}

export default function GalleryGrid({ memories }: GalleryGridProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = memories.flatMap((m) =>
    m.images.map((url) => ({ url, memoryId: m._id, title: m.title, date: m.date }))
  );

  const filtered = searchQuery
    ? allImages.filter((img) => img.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allImages;

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos..."
            className="w-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 shadow-sm"
          />
        </div>
      </div>

      <div className="columns-2 gap-3 space-y-3">
        {filtered.map((img, i) => (
          <motion.div
            key={`${img.memoryId}-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 10) * 0.05 }}
            className="break-inside-avoid"
          >
            <motion.img
              src={img.url}
              alt={img.title}
              loading="lazy"
              onClick={() => setSelectedImage(img.url)}
              whileHover={{ scale: 1.02 }}
              className="w-full rounded-2xl shadow-md cursor-pointer object-cover"
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              src={selectedImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
