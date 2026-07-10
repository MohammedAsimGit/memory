'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useApi, apiPut } from '@/hooks/useApi';
import type { Settings } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import ProfileSelector from '@/components/layout/ProfileSelector';
import Modal from '@/components/ui/Modal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function SettingsPage() {
  const { data: settings, loading, refetch } = useApi<Settings>('/settings');
  const { addToast, ToastContainer } = useToast();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const rememberProfile = useAuthStore((s) => s.rememberProfile);
  const setRememberProfile = useAuthStore((s) => s.setRememberProfile);

  const [showProfileSelector, setShowProfileSelector] = useState(false);

  const [partnerName1, setPartnerName1] = useState('');
  const [partnerName2, setPartnerName2] = useState('');
  const [relationshipStartDate, setRelationshipStartDate] = useState('');
  const [blueTheme, setBlueTheme] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (settings) {
      setPartnerName1(settings.partnerName1 || '');
      setPartnerName2(settings.partnerName2 || '');
      setRelationshipStartDate(
        settings.relationshipStartDate
          ? settings.relationshipStartDate.split('T')[0]
          : ''
      );
      setBlueTheme(settings.blueTheme !== undefined ? settings.blueTheme : true);
      if (settings.darkMode && !darkMode) {
        toggleDarkMode();
      }
    }
  }, [settings]);

  const handleSave = async () => {
    if (!partnerName1.trim() || !partnerName2.trim()) {
      addToast('Please fill in both partner names', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiPut('/settings', {
        partnerName1: partnerName1.trim(),
        partnerName2: partnerName2.trim(),
        relationshipStartDate,
        darkMode,
        blueTheme,
      });
      addToast('Settings saved!', 'success');
      refetch();
    } catch {
      addToast('Failed to save settings', 'error');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 4) {
      addToast('Password must be at least 4 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to change password', 'error');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed successfully!', 'success');
    } catch {
      addToast('Failed to change password', 'error');
    }
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/settings/export', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('our-story-auth') || '{}')?.state?.token || ''}`,
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'our-story-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Data exported!', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
          checked ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2]' : 'bg-slate-300'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md ${
            checked ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </motion.button>
    </div>
  );

  const SectionHeader = ({
    icon,
    title,
  }: {
    icon: string;
    title: string;
  }) => (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </h3>
    </div>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24"
    >
      <ToastContainer />

      <motion.div variants={item} className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 dark:text-slate-400 mt-1">Customize your experience</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={item}>
          <SectionHeader icon="🔐" title="Change Password" />
          <GlassCard>
            <div className="space-y-3">
              <Input
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
                label="Current Password"
                type="password"
                required
              />
              <Input
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                label="New Password"
                type="password"
                required
              />
              <Input
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                label="Confirm Password"
                type="password"
                required
              />
              <Button onClick={handleChangePassword} loading={saving} variant="secondary" size="sm">
                Update Password
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="👥" title="Profile" />
          <GlassCard>
            <div className="space-y-3">
              <Input
                value={partnerName1}
                onChange={setPartnerName1}
                placeholder="Your name"
                label="Partner Name 1"
                required
              />
              <Input
                value={partnerName2}
                onChange={setPartnerName2}
                placeholder="Your partner's name"
                label="Partner Name 2"
                required
              />
              <Input
                value={relationshipStartDate}
                onChange={setRelationshipStartDate}
                label="Relationship Start Date"
                type="date"
              />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="👤" title="Current Profile" />
          <GlassCard>
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl flex-shrink-0 ${
                  activeProfile === 'me'
                    ? 'bg-gradient-to-br from-[#4FC3F7] to-[#2196F3] shadow-blue-400/30'
                    : 'bg-gradient-to-br from-[#C084FC] to-[#A855F7] shadow-purple-400/30'
                }`}
              >
                {(activeProfile === 'me'
                  ? (partnerName1 || 'A')[0]
                  : (partnerName2 || 'H')[0]
                ).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {activeProfile === 'me' ? (partnerName1 || 'Asim') : (partnerName2 || 'My Love')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      activeProfile === 'me'
                        ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200/50 dark:border-sky-700/30'
                        : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/30'
                    }`}
                  >
                    {activeProfile === 'me' ? '🩵 You' : '💜 Her'}
                  </span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-[10px] text-emerald-500 font-medium">Active</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <Button
                onClick={() => setShowProfileSelector(true)}
                variant="secondary"
                className="w-full"
              >
                🔄 Switch Profile
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard>
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Remember Profile
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Auto-restore this profile after unlocking
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setRememberProfile(!rememberProfile)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  rememberProfile ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md ${
                    rememberProfile ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="🎨" title="Appearance" />
          <GlassCard>
            <Toggle checked={darkMode} onChange={setDarkMode} label="Dark Mode" />
            <div className="border-t border-slate-100" />
            <Toggle checked={blueTheme} onChange={setBlueTheme} label="Blue Theme" />
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <Button onClick={handleSave} className="w-full" size="lg" loading={saving}>
            Save Settings
          </Button>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="📦" title="Data" />
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Export Data</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    Download all your memories and data as JSON
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  loading={exporting}
                  variant="secondary"
                  size="sm"
                >
                  Export
                </Button>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Backup &amp; Restore</p>
                <p className="text-xs text-slate-400 dark:text-slate-400">
                  Backup and restore functionality coming soon. Your data is stored safely on your server.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="ℹ️" title="About" />
          <GlassCard>
            <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">App Version</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">1.0.0</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700/50" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Made with</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next.js &amp; Framer Motion</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700/50" />
                <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed pt-1">
                Our Story is a private journal for couples. Capture your memories, special
                days, letters, and more — all in one beautiful place.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionHeader icon="🔒" title="Privacy" />
          <GlassCard>
            <p className="text-xs text-slate-400 leading-relaxed">
              All your data is stored locally on your server. Nothing is shared with third
              parties. Your memories are yours and yours alone. This app uses encryption for
              authentication and secure storage.
            </p>
          </GlassCard>
        </motion.div>
      </div>

      <Modal isOpen={showProfileSelector} onClose={() => setShowProfileSelector(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            Switch Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Choose who&apos;s using Our Story
          </p>

          <button
            onClick={() => {
              useAuthStore.getState().setActiveProfile('me');
              setShowProfileSelector(false);
              addToast(`Switched to ${partnerName1 || 'You'}`, 'success');
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              activeProfile === 'me'
                ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-sky-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#2196F3] flex items-center justify-center text-lg font-black text-white shadow-lg shadow-blue-400/20">
              {(partnerName1 || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800 dark:text-slate-100">{partnerName1 || 'Asim'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-semibold border border-sky-200/50">🩵 You</span>
                {activeProfile === 'me' && <span className="text-[10px] text-emerald-500 font-medium">● Active</span>}
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              useAuthStore.getState().setActiveProfile('her');
              setShowProfileSelector(false);
              addToast(`Switched to ${partnerName2 || 'Her'}`, 'success');
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              activeProfile === 'her'
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#A855F7] flex items-center justify-center text-lg font-black text-white shadow-lg shadow-purple-400/20">
              {(partnerName2 || 'H')[0].toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-800 dark:text-slate-100">{partnerName2 || 'My Love'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/50">💜 Her</span>
                {activeProfile === 'her' && <span className="text-[10px] text-emerald-500 font-medium">● Active</span>}
              </div>
            </div>
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
