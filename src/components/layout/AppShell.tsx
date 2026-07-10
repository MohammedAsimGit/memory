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
          className="pb-28 pt-[5rem] xs:pt-[5.5rem] sm:pt-24 px-5 sm:px-6 max-w-2xl mx-auto relative z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
