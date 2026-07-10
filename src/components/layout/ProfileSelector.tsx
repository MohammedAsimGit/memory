'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import { Settings } from '@/types';
import Button from '@/components/ui/Button';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ProfileSelector({ onSelect }: { onSelect: () => void }) {
  const { data: settings } = useApi<Settings>('/settings');
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const rememberProfile = useAuthStore((s) => s.rememberProfile);
  const setActiveProfile = useAuthStore((s) => s.setActiveProfile);
  const setRememberProfile = useAuthStore((s) => s.setRememberProfile);
  const [selected, setSelected] = useState<string | null>(activeProfile);

  const name1 = settings?.partnerName1 || 'Asim';
  const name2 = settings?.partnerName2 || 'My Love';

  const handleSelect = (profile: 'me' | 'her') => {
    setSelected(profile);
    setActiveProfile(profile);
    setTimeout(() => onSelect(), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-5xl mb-4"
        >
          💙
        </motion.div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          Who&apos;s using Our Story?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select your profile to continue
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm grid grid-cols-1 gap-4 mb-8"
      >
        <motion.button
          variants={cardVariant}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelect('me')}
          className={`relative p-6 rounded-3xl text-left border-2 transition-all duration-300 ${
            selected === 'me'
              ? 'border-sky-400 bg-white dark:bg-slate-800 shadow-2xl shadow-sky-200/40 dark:shadow-sky-500/20'
              : 'border-transparent bg-white/60 dark:bg-slate-800/60 shadow-lg'
          }`}
        >
          {selected === 'me' && (
            <motion.div
              layoutId="selection-glow"
              className="absolute inset-0 rounded-3xl bg-sky-400/5"
            />
          )}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-400/30">
              {name1[0]?.toUpperCase() || 'A'}
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{name1}</p>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-semibold border border-sky-200/50 dark:border-sky-700/30">
                  🩵 You
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">My memories & moments</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          variants={cardVariant}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelect('her')}
          className={`relative p-6 rounded-3xl text-left border-2 transition-all duration-300 ${
            selected === 'her'
              ? 'border-purple-400 bg-white dark:bg-slate-800 shadow-2xl shadow-purple-200/40 dark:shadow-purple-500/20'
              : 'border-transparent bg-white/60 dark:bg-slate-800/60 shadow-lg'
          }`}
        >
          {selected === 'her' && (
            <motion.div
              layoutId="selection-glow"
              className="absolute inset-0 rounded-3xl bg-purple-400/5"
            />
          )}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#A855F7] flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-purple-400/30">
              {name2[0]?.toUpperCase() || 'H'}
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{name2}</p>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/50 dark:border-purple-700/30">
                  💜 Her
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Her memories & moments</p>
            </div>
          </div>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={() => setRememberProfile(!rememberProfile)}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            rememberProfile ? 'bg-[#2196F3]' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <motion.div
            animate={{ x: rememberProfile ? 20 : 2 }}
            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
          />
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Remember this profile on this device
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs text-slate-400 dark:text-slate-500 text-center"
      >
        You can switch profiles anytime from the Profile page
      </motion.p>
    </div>
  );
}
