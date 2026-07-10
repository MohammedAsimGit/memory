'use client';

import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import CloudBackground from './CloudBackground';
import AppTopBar from './AppTopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF6FF] dark:from-slate-900 via-[#EAF6FF]/70 dark:via-slate-900/70 to-white dark:to-slate-950 relative">
      <CloudBackground />
      <AppTopBar />
      <AnimatePresence mode="wait">
        <motion.main
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="pb-24 pt-16 px-4 max-w-2xl mx-auto relative z-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
