'use client';

import { motion } from 'framer-motion';

export default function CloudBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.div
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-10 left-[10%] w-32 h-16 bg-white/60 rounded-full blur-xl"
      />
      <motion.div
        animate={{ x: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute top-28 right-[15%] w-40 h-20 bg-white/50 rounded-full blur-xl"
      />
      <motion.div
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute top-52 left-[20%] w-36 h-14 bg-white/40 rounded-full blur-xl"
      />
      <motion.div
        animate={{ x: [0, -30, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute top-40 right-[5%] w-24 h-12 bg-white/50 rounded-full blur-lg"
      />
      <motion.div
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute top-80 left-[30%] w-28 h-12 bg-white/30 rounded-full blur-xl"
      />
    </div>
  );
}
