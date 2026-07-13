'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat';

export default function ImageViewer() {
  const { showImageViewer, viewerImages, viewerIndex, closeImageViewer } = useChatStore();
  const [currentIndex, setCurrentIndex] = useState(viewerIndex);
  const [scale, setScale] = useState(1);

  if (!showImageViewer || viewerImages.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : viewerImages.length - 1));
    setScale(1);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < viewerImages.length - 1 ? i + 1 : 0));
    setScale(1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={closeImageViewer}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={closeImageViewer}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>

        {viewerImages.length > 1 && (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          </>
        )}

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: scale }}
          className="max-w-[90vw] max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={viewerImages[currentIndex]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            draggable={false}
          />
        </motion.div>

        {viewerImages.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
            {viewerImages.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
