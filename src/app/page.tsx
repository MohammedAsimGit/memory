'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/ui/Button';
import CloudBackground from '@/components/layout/CloudBackground';
import { useApi } from '@/hooks/useApi';
import type { Settings } from '@/types';

type Screen = 'splash' | 'lock' | 'profile';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function UnlockPage() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');

  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const rememberProfile = useAuthStore((s) => s.rememberProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const name1 = settings?.partnerName1 || 'Asim';
  const name2 = settings?.partnerName2 || 'My Love';

  useEffect(() => {
    const splashTimer = setTimeout(() => setScreen('lock'), 1800);
    return () => clearTimeout(splashTimer);
  }, []);

  const handleUnlock = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setAuthToken(data.token);
        goToProfileOrHome(data.token);
      } else if (res.status === 401) {
        setError('Incorrect Password');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to connect. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const goToProfileOrHome = (token: string) => {
    if (rememberProfile && activeProfile) {
      setAuth(token);
      useAuthStore.getState().setActiveProfile(activeProfile);
      router.push('/home');
    } else {
      setScreen('profile');
    }
  };

  const handleProfileSelected = (profile: 'me' | 'her') => {
    setAuth(authToken);
    useAuthStore.getState().setActiveProfile(profile);
    router.push('/home');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && screen === 'lock') handleUnlock();
  };

  if (screen === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-28 h-28 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-[2rem] mx-auto flex items-center justify-center text-6xl shadow-2xl shadow-blue-400/30 mb-6"
          >
            ❤️
          </motion.div>
          <h1 className="text-4xl font-black text-gradient mb-3">Our Story</h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
            Every memory has a storyteller...
          </p>
        </motion.div>
      </div>
    );
  }

  if (screen === 'lock') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CloudBackground />
        <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
            className="text-center mb-10"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-[2rem] mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-blue-400/30 mb-6"
            >
              🔒
            </motion.div>
            <h1 className="text-4xl font-black text-gradient mb-2 tracking-tight">
              Our Story
            </h1>
            <p className="text-slate-500 dark:text-slate-300 font-medium">Only You & Me</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full space-y-4"
          >
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-1 shadow-lg shadow-sky-200/30 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter secret password..."
                autoFocus
                className="w-full bg-transparent px-5 py-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-base font-medium"
              />
            </div>

            <motion.div
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {error && (
                <p className="text-red-500 text-sm text-center mb-2 font-medium">{error}</p>
              )}
            </motion.div>

            <Button
              onClick={handleUnlock}
              size="lg"
              className="w-full text-lg rounded-2xl"
              loading={loading}
            >
              Unlock ❤️
            </Button>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
              A private space for two hearts
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (screen === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Select your profile to continue
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm grid grid-cols-1 gap-4 mb-8"
        >
          <motion.button
            variants={fadeIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleProfileSelected('me')}
            className="relative p-6 rounded-3xl text-left border-2 border-transparent bg-white/60 dark:bg-slate-800/60 shadow-lg hover:border-sky-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-400/30">
                {name1[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{name1}</p>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-semibold border border-sky-200/50 dark:border-sky-700/30">
                    🩵 You
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400">My memories & moments</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            variants={fadeIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleProfileSelected('her')}
            className="relative p-6 rounded-3xl text-left border-2 border-transparent bg-white/60 dark:bg-slate-800/60 shadow-lg hover:border-purple-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#A855F7] flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-purple-400/30">
                {name2[0]?.toUpperCase() || 'H'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{name2}</p>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/50 dark:border-purple-700/30">
                    💜 Her
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400">Her memories & moments</p>
              </div>
            </div>
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-slate-400 dark:text-slate-400 text-center"
        >
          You can switch profiles anytime from the Profile page
        </motion.p>
      </div>
    );
  }

  return null;
}
