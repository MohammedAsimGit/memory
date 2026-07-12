'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/ui/Button';
import CloudBackground from '@/components/layout/CloudBackground';
import { getDeviceToken, formatDeviceInfo } from '@/lib/deviceUtils';
import { useApi } from '@/hooks/useApi';
import type { Settings } from '@/types';

type Screen =
  | 'splash'
  | 'lock'
  | 'device-check'
  | 'register-device'
  | 'untrusted-device'
  | 'invitation-code'
  | 'recovery-code'
  | 'profile';

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
  const [deviceToken, setDeviceToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [deviceIsTrusted, setDeviceIsTrusted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState<{ status: number; body: unknown } | null>(null);

  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setDeviceTokenStore = useAuthStore((s) => s.setDeviceToken);
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const rememberProfile = useAuthStore((s) => s.rememberProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const name1 = settings?.partnerName1 || 'Asim';
  const name2 = settings?.partnerName2 || 'My Love';

  useEffect(() => {
    const splashTimer = setTimeout(() => setScreen('lock'), 1800);
    return () => clearTimeout(splashTimer);
  }, []);

  // ──────────────────────────────────────────────
  // STAGE 1: Password Authentication
  // ──────────────────────────────────────────────
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
        const token = getDeviceToken();
        setDeviceToken(token);
        setScreen('device-check');
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

  // ──────────────────────────────────────────────
  // STAGE 2: Trusted Device Verification
  // ──────────────────────────────────────────────
  const checkDeviceTrust = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/device/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ deviceToken }),
      });

      const data = await res.json();

      if (data.isTrusted) {
        setDeviceIsTrusted(true);
        setDeviceId(data.device._id);
        setDeviceTokenStore(deviceToken, data.device._id, data.device.deviceName);
        goToProfileOrHome();
      } else {
        const deviceCountRes = await fetch('/api/auth/devices', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const deviceData = await deviceCountRes.json();

        if (deviceData.devices && deviceData.devices.length > 0) {
          setScreen('untrusted-device');
        } else {
          setScreen('register-device');
        }
      }
    } catch {
      setError('Failed to verify device');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (screen === 'device-check' && authToken && deviceToken) {
      checkDeviceTrust();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, authToken, deviceToken]);

  // ──────────────────────────────────────────────
  // STAGE 3: Profile Selection → Home
  // ──────────────────────────────────────────────
  const goToProfileOrHome = () => {
    if (rememberProfile && activeProfile) {
      setAuth(authToken);
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

  // ──────────────────────────────────────────────
  // Device Registration (first device)
  // ──────────────────────────────────────────────
  const [registerOwner, setRegisterOwner] = useState<'me' | 'her' | null>(null);
  const [registerDeviceName, setRegisterDeviceName] = useState('');

  const handleRegisterDevice = async () => {
    if (!registerOwner) return;
    setLoading(true);
    setError('');

    try {
      const info = formatDeviceInfo();
      const name = registerDeviceName.trim() || generateDeviceName();
      const res = await fetch('/api/auth/device/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceName: name,
          platform: info.platform,
          browser: info.browser,
          owner: registerOwner === 'me' ? name1 : name2,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const serverToken = data.deviceToken as string;
        localStorage.setItem('our-story-device-token', serverToken);
        setDeviceToken(serverToken);
        setDeviceTokenStore(serverToken, data.deviceId, name);
        setDeviceId(data.deviceId);
        setDeviceIsTrusted(true);
        setAuth(authToken);
        useAuthStore.getState().setActiveProfile(registerOwner);
        router.push('/home');
      } else {
        setError(data.error || 'Failed to register device');
      }
    } catch {
      setError('Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Invitation Code Verification
  // ──────────────────────────────────────────────
  const handleVerifyInvitation = async () => {
    if (!invitationCode.trim()) return;
    setLoading(true);
    setError('');
    setVerifyResponse(null);

    try {
      const info = formatDeviceInfo();
      const res = await fetch('/api/auth/invitation/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          code: invitationCode.trim(),
          deviceName: generateDeviceName(),
          platform: info.platform,
          browser: info.browser,
        }),
      });

      const data = await res.json();
      setVerifyResponse({ status: res.status, body: data });

      if (res.ok) {
        const serverToken = data.deviceToken as string;
        localStorage.setItem('our-story-device-token', serverToken);
        setDeviceToken(serverToken);
        setDeviceTokenStore(serverToken, data.deviceId, generateDeviceName());
        setDeviceId(data.deviceId);
        setDeviceIsTrusted(true);
        setAuth(authToken);
        goToProfileOrHome();
      } else {
        const reason = data.reason || 'unknown';
        let msg = data.error || 'Invalid invitation code';
        if (reason === 'expired') msg = 'This invitation code has expired. Ask your partner to generate a new code.';
        else if (reason === 'used') msg = 'This code was already used. Ask your partner to generate a new code.';
        else if (reason === 'not_found') msg = 'No invitation found. Generate a new code from a trusted device.';
        else if (reason === 'invalid_code') msg = 'Wrong code. Double-check and try again.';
        else if (reason === 'max_devices') msg = 'Maximum 4 devices reached. Remove an existing device first.';
        setError(msg);
      }
    } catch {
      setError('Failed to verify invitation code');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Recovery Code
  // ──────────────────────────────────────────────
  const handleRecoveryCode = async () => {
    if (!recoveryCodeInput.trim()) return;
    setLoading(true);
    setError('');

    try {
      const info = formatDeviceInfo();
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          code: recoveryCodeInput.trim().toUpperCase(),
          deviceName: generateDeviceName(),
          platform: info.platform,
          browser: info.browser,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const serverToken = data.deviceToken as string;
        localStorage.setItem('our-story-device-token', serverToken);
        setDeviceToken(serverToken);
        setDeviceTokenStore(serverToken, data.deviceId, generateDeviceName());
        setDeviceId(data.deviceId);
        setDeviceIsTrusted(true);
        setAuth(authToken);
        goToProfileOrHome();
      } else {
        setError(data.error || 'Invalid recovery code');
      }
    } catch {
      setError('Failed to verify recovery code');
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceName = () => {
    const { platform } = formatDeviceInfo();
    const ua = navigator.userAgent;

    if (platform === 'Android') {
      const match = ua.match(/;\s*([^;)]+)\s*Build/);
      return match ? match[1].trim() : 'Android Device';
    }
    if (platform === 'iOS') {
      if (ua.includes('iPad')) return 'iPad';
      if (ua.includes('iPhone')) return 'iPhone';
      return 'iOS Device';
    }
    if (platform === 'Windows') return 'Windows PC';
    if (platform === 'MacOS') return 'Mac';
    return 'Device';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (screen === 'lock') handleUnlock();
      else if (screen === 'invitation-code') handleVerifyInvitation();
      else if (screen === 'recovery-code') handleRecoveryCode();
      else if (screen === 'register-device') handleRegisterDevice();
    }
  };

  // ──────────────────────────────────────────────
  // DEBUG PANEL (dev only)
  // ──────────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development';

  const debugInfo = {
    vaultId: 'main',
    authToken: authToken ? `${authToken.substring(0, 20)}...` : 'None',
    deviceToken: deviceToken ? `${deviceToken.substring(0, 16)}...` : 'None',
    deviceId: deviceId || 'None',
    deviceIsTrusted,
    screen,
    activeProfile: activeProfile || 'None',
    rememberProfile,
    platform: typeof navigator !== 'undefined' ? formatDeviceInfo().platform : 'N/A',
    browser: typeof navigator !== 'undefined' ? formatDeviceInfo().browser : 'N/A',
  };

  // ──────────────────────────────────────────────
  // SCREENS
  // ──────────────────────────────────────────────

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

  // ── STAGE 1: Password ──
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

  // ── STAGE 2: Device Check (loading) ──
  if (screen === 'device-check') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-sky-200 dark:border-sky-700 border-t-sky-500 rounded-full mx-auto mb-6"
          />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Verifying device security...
          </p>
        </motion.div>
      </div>
    );
  }

  // ── STAGE 2: Register First Device ──
  if (screen === 'register-device') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CloudBackground />
        <div className="relative z-10 w-full max-w-sm px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-blue-400/30 mb-5"
            >
              🛡️
            </motion.div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              Register First Trusted Device
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Save this device for future access
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-6 shadow-lg shadow-sky-200/30 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50 mb-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 ml-1">
                  Device Information
                </label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Platform</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatDeviceInfo().platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Browser</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatDeviceInfo().browser}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-700/50" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                  Device Name
                </label>
                <input
                  type="text"
                  value={registerDeviceName}
                  onChange={(e) => setRegisterDeviceName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={generateDeviceName()}
                  autoFocus
                  className="w-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]/50 transition-all"
                />
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-700/50" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                  Who is using this device?
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setRegisterOwner('me')}
                    className={`p-3 rounded-2xl border-2 transition-all font-semibold text-sm ${
                      registerOwner === 'me'
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {name1}
                  </button>
                  <button
                    onClick={() => setRegisterOwner('her')}
                    className={`p-3 rounded-2xl border-2 transition-all font-semibold text-sm ${
                      registerOwner === 'her'
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {name2}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center mb-4 font-medium"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleRegisterDevice}
              size="lg"
              className="w-full text-lg rounded-2xl"
              loading={loading}
              disabled={!registerOwner}
            >
              Register Device 🛡️
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── STAGE 2: Invitation Code (untrusted device) ──
  if (screen === 'untrusted-device') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CloudBackground />
        <div className="relative z-10 w-full max-w-sm px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-orange-400/30 mb-5"
            >
              🔒
            </motion.div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              Device Not Trusted
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">
              This device has not been approved.
              <br />
              To protect your private memories,
              <br />
              enter an Invitation Code generated
              <br />
              from one of your trusted devices.
            </p>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center mb-4 font-medium"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-6 shadow-lg shadow-sky-200/30 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50 mb-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                  Invitation Code
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (val.length > 16) val = val.slice(0, 16);
                    if (val.length > 12) val = val.slice(0, 4) + '-' + val.slice(4, 8) + '-' + val.slice(8, 12) + '-' + val.slice(12);
                    else if (val.length > 8) val = val.slice(0, 4) + '-' + val.slice(4, 8) + '-' + val.slice(8);
                    else if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                    setInvitationCode(val);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="XXXX-XXXX-XXXX"
                  autoFocus
                  className="w-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl px-4 py-4 text-center text-xl font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]/50 transition-all uppercase"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              onClick={handleVerifyInvitation}
              size="lg"
              className="w-full text-lg rounded-2xl"
              loading={loading}
              disabled={invitationCode.replace(/-/g, '').length < 12}
            >
              Verify
            </Button>

            <Button
              onClick={() => setScreen('recovery-code')}
              variant="ghost"
              className="w-full rounded-2xl"
            >
              Use Recovery Code
            </Button>

            <Button
              onClick={() => {
                setScreen('lock');
                setPassword('');
                setError('');
                setAuthToken('');
                setInvitationCode('');
              }}
              variant="ghost"
              className="w-full rounded-2xl"
            >
              Back
            </Button>
          </motion.div>

          {isDev && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
              {showDebug && (
                <div className="bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl p-4 mt-2 text-xs font-mono text-green-400 space-y-1 border border-slate-700/50">
                  {Object.entries(debugInfo).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-slate-500">{key}:</span> {String(val)}
                    </div>
                  ))}
                  {verifyResponse && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <div><span className="text-slate-500">HTTP Status:</span> {verifyResponse.status}</div>
                      <div className="mt-1">
                        <span className="text-slate-500">Backend Response:</span>
                      </div>
                      <pre className="text-[10px] text-green-300 whitespace-pre-wrap break-all bg-black/30 rounded-lg p-2 mt-1">
                        {JSON.stringify(verifyResponse.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── STAGE 2: Recovery Code ──
  if (screen === 'recovery-code') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#EAF6FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CloudBackground />
        <div className="relative z-10 w-full max-w-sm px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-amber-400/30 mb-5"
            >
              🔑
            </motion.div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              Enter Recovery Code
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Format: XXXX-XXXX-XXXX
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-6 shadow-lg shadow-sky-200/30 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50 mb-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                  Recovery Code
                </label>
                <input
                  type="text"
                  value={recoveryCodeInput}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (val.length > 12) val = val.slice(0, 12);
                    if (val.length > 8) val = val.slice(0, 4) + '-' + val.slice(4, 8) + '-' + val.slice(8);
                    else if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                    setRecoveryCodeInput(val);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="XXXX-XXXX-XXXX"
                  autoFocus
                  className="w-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl px-4 py-4 text-center text-xl font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]/50 transition-all uppercase"
                />
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center mb-4 font-medium"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              onClick={handleRecoveryCode}
              size="lg"
              className="w-full text-lg rounded-2xl"
              loading={loading}
              disabled={recoveryCodeInput.length !== 14}
            >
              Recover Access 🔑
            </Button>

            <Button
              onClick={() => {
                setScreen('untrusted-device');
                setRecoveryCodeInput('');
                setError('');
              }}
              variant="ghost"
              className="w-full rounded-2xl"
            >
              Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── STAGE 3: Profile Selection ──
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
