'use client';

import { motion } from 'framer-motion';

interface HeroCardProps {
  partnerName1: string;
  partnerName2: string;
  daysTogether: number;
  startDate?: string;
}

export default function HeroCard({ partnerName1, partnerName2, daysTogether, startDate }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#42A5F5] via-[#2196F3] to-[#1565C0] p-6 shadow-2xl shadow-blue-400/25 dark:shadow-blue-900/30"
    >
      <motion.div
        animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-4 text-5xl opacity-20"
      >💫</motion.div>
      <motion.div
        animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-4 text-4xl opacity-15"
      >❤️</motion.div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 right-[15%] text-3xl opacity-10"
      >✨</motion.div>

      <div className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-sm font-medium mb-2"
        >
          ❤️ Our Journey
        </motion.p>

        <div className="flex items-center justify-center gap-2 mb-1">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            {partnerName1}
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl text-white/60"
          >
            ♡
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            {partnerName2}
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="mt-4"
        >
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
            Together for
          </p>
          <p className="text-5xl font-black text-white tracking-tighter">
            {daysTogether.toLocaleString()}
          </p>
          <p className="text-white/60 text-sm font-medium mt-0.5">Days</p>
        </motion.div>

        {startDate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/50 text-xs mt-4"
          >
            Started on {startDate}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/60 text-xs italic mt-3 max-w-xs mx-auto leading-relaxed"
        >
          &ldquo;Every day with you is another page in our story.&rdquo;
        </motion.p>
      </div>
    </motion.div>
  );
}
