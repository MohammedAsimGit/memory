'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  isTyping: boolean;
}

export default function TypingIndicator({ isTyping }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex justify-start mb-2"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
