'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/ui/Button';
import CloudBackground from '@/components/layout/CloudBackground';

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

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
        router.push('/home');
      } else {
        setError('Incorrect Password');
      }
    } catch {
      setError('Incorrect Password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF]">
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
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-[2rem] mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-blue-400/30 mb-6"
          >
            💙
          </motion.div>

          <h1 className="text-4xl font-black text-gradient mb-2 tracking-tight">
            Our Story
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Only You & Me
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full space-y-4"
        >
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-1 shadow-lg shadow-sky-200/30 border border-white/50">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Enter password..."
              autoFocus
              className="w-full bg-transparent px-5 py-4 text-slate-800 placeholder-slate-400 focus:outline-none text-base font-medium"
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
            Unlock
          </Button>

          <p className="text-center text-xs text-slate-400 mt-8">
            A private space for two hearts ❤️
          </p>
        </motion.div>
      </div>
    </div>
  );
}
