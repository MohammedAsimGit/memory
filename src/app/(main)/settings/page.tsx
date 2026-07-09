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

  const [partnerName1, setPartnerName1] = useState('');
  const [partnerName2, setPartnerName2] = useState('');
  const [relationshipStartDate, setRelationshipStartDate] = useState('');
  const [darkMode, setDarkMode] = useState(false);
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
      setDarkMode(settings.darkMode || false);
      setBlueTheme(settings.blueTheme !== undefined ? settings.blueTheme : true);
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
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiPut('/settings/password', {
        currentPassword,
        newPassword,
      });
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
      <span className="text-sm font-semibold text-slate-700">{label}</span>
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
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Customize your experience</p>
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
                  <p className="font-semibold text-slate-800">Export Data</p>
                  <p className="text-xs text-slate-400 mt-0.5">
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
                <p className="font-semibold text-slate-800 mb-1">Backup &amp; Restore</p>
                <p className="text-xs text-slate-400">
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
                <span className="text-sm text-slate-600">App Version</span>
                <span className="text-sm font-semibold text-slate-800">1.0.0</span>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-slate-600">Made with</span>
                <span className="text-sm font-semibold text-slate-800">Next.js &amp; Framer Motion</span>
              </div>
              <div className="border-t border-slate-100" />
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
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
    </motion.div>
  );
}
