'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/ui/Button';
import CloudBackground from '@/components/layout/CloudBackground';
import ProfileSelector from '@/components/layout/ProfileSelector';

type Screen = 'splash' | 'lock' | 'profile' | 'done';

export default function UnlockPage() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const rememberProfile = useAuthStore((s) => s.rememberProfile);

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
        setAuth(data.token);

        if (rememberProfile && activeProfile) {
          router.push('/home');
        } else {
          setScreen('profile');
        }
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

  const handleProfileSelected = () => {
    router.push('/home');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
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
          <h1 className="text-4xl font-black text-gradient mb-3">
            Our Story
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Every memory has a storyteller...
          </p>
        </motion.div>
      </div>
    );
  }

  if (screen === 'profile') {
    return <ProfileSelector onSelect={handleProfileSelected} />;
  }

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
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Only You & Me
          </p>
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
