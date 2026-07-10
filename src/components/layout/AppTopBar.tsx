'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import { Settings } from '@/types';

export default function AppTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const name = activeProfile === 'me'
    ? (settings?.partnerName1 || 'Asim')
    : (settings?.partnerName2 || 'My Love');

  const isMe = activeProfile === 'me';

  const isSettings = pathname === '/settings';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-[#D6EFFF]/80 dark:border-sky-500/15 shadow-lg shadow-sky-100/20 dark:shadow-black/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-lg flex-shrink-0 ring-2 ring-white/40 dark:ring-slate-700/50 ${
                  isMe
                    ? 'bg-gradient-to-br from-[#4FC3F7] to-[#2196F3] shadow-blue-400/30'
                    : 'bg-gradient-to-br from-[#C084FC] to-[#A855F7] shadow-purple-400/30'
                }`}
              >
                {name[0]?.toUpperCase() || '?'}
              </motion.div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-[15px] text-slate-800 dark:text-slate-100 leading-tight truncate">
                {name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                {isMe ? 'Currently Active' : 'Currently Active'}
              </p>
            </div>
          </button>

          <motion.button
            whileHover={{ scale: 1.06, rotate: 5 }}
            whileTap={{ scale: 0.9, rotate: -5 }}
            onClick={() => router.push('/settings')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all ${
              isSettings
                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700/50 text-[#1976D2] dark:text-sky-300'
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-[#1976D2] dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-700/50'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
