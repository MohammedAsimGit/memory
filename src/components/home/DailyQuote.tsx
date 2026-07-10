'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/Card';

const quotes = [
  { text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn' },
  { text: 'In all the world, there is no heart for me like yours.', author: 'Maya Angelou' },
  { text: 'I saw that you were perfect, and so I loved you.', author: 'Rumi' },
  { text: 'You are my sun, my moon, and all my stars.', author: 'E.E. Cummings' },
  { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë' },
  { text: 'Grow old along with me! The best is yet to be.', author: 'Robert Browning' },
  { text: 'I would rather spend one lifetime with you than face all the ages of this world alone.', author: 'J.R.R. Tolkien' },
];

export default function DailyQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="w-full">
      <GlassCard padding="md" className="text-center py-5">
        <p className="text-xs font-semibold text-rose-400 dark:text-rose-300 uppercase tracking-wider mb-3">
          ❤️ Quote of the Day
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed px-2">
              &ldquo;{quotes[index].text}&rdquo;
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              — {quotes[index].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
