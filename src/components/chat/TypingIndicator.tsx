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
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="flex justify-start mb-1 px-1"
        >
          <div className="bg-slate-50 dark:bg-white/[0.06] rounded-[18px] rounded-bl-[6px] px-3.5 py-2.5 shadow-sm border border-slate-200/60 dark:border-white/[0.08]">
            <div className="flex gap-[5px]">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-[5px] h-[5px] rounded-full bg-slate-300 dark:bg-slate-500"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.12,
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
