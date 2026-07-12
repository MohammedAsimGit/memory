'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import type { TrustedDevice, SecurityLog } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const getEventIcon = (event: string) => {
  switch (event) {
    case 'device_registered': return '📱';
    case 'device_removed': return '🗑️';
    case 'device_renamed': return '✏️';
    case 'invitation_generated': return '🔗';
    case 'recovery_used': return '🔑';
    case 'password_changed': return '🔐';
    default: return '📋';
  }
};

const getEventColor = (event: string) => {
  switch (event) {
    case 'device_registered':
    case 'recovery_used': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    case 'device_removed': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'invitation_generated': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
    case 'device_renamed': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
  }
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function SecurityPage() {
  const router = useRouter();
  const { addToast, ToastContainer } = useToast();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const deviceId = useAuthStore((s) => s.deviceId);

  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'devices' | 'activity'>('devices');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDeviceId, setRenameDeviceId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeDeviceId, setRemoveDeviceId] = useState('');
  const [removeDeviceName, setRemoveDeviceName] = useState('');
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationId, setInvitationId] = useState('');
  const [invitationExpiresAt, setInvitationExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchDevices = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDevices(data.devices || []);
    } catch {
      addToast('Failed to load devices', 'error');
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/security-log', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSecurityLogs(data.logs || []);
    } catch {
      addToast('Failed to load security logs', 'error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDevices(), fetchSecurityLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateQR = useCallback(async (code: string, expiresAt: Date) => {
    try {
      const payload = JSON.stringify({ code, expires: expiresAt.toISOString() });
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 256,
        margin: 2,
        color: { dark: '#1976D2', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch {
      console.error('Failed to generate QR code');
    }
  }, []);

  useEffect(() => {
    if (!invitationExpiresAt || !showInvitationModal) return;

    const updateCountdown = () => {
      const remaining = invitationExpiresAt.getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('00:00');
        return;
      }
      setCountdown(formatCountdown(remaining));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [invitationExpiresAt, showInvitationModal]);

  const handleGenerateInvitation = async () => {
    setGenerating(true);
    try {
      const token = useAuthStore.getState().token;
      const currentDevice = devices.find(d => d._id === deviceId);
      const deviceName = currentDevice?.deviceName || 'This Device';
      const owner = activeProfile === 'me' ? 'me' : 'her';
      const res = await fetch('/api/auth/invitation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceName, owner }),
      });

      const data = await res.json();

      if (res.ok) {
        setInvitationCode(data.code);
        setInvitationId(data.invitationId);
        const expires = new Date(data.expiresAt);
        setInvitationExpiresAt(expires);
        setShowInvitationModal(true);
        generateQR(data.code, expires);
        fetchSecurityLogs();
      } else {
        addToast(data.error || 'Failed to generate code', 'error');
      }
    } catch {
      addToast('Failed to generate invitation code', 'error');
    }
    setGenerating(false);
  };

  const handleRenameDevice = async () => {
    if (!renameValue.trim()) return;
    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/device/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: renameDeviceId,
          deviceName: renameValue.trim(),
        }),
      });

      if (res.ok) {
        addToast('Device renamed', 'success');
        setShowRenameModal(false);
        fetchDevices();
      } else {
        addToast('Failed to rename device', 'error');
      }
    } catch {
      addToast('Failed to rename device', 'error');
    }
    setProcessing(false);
  };

  const handleRemoveDevice = async () => {
    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/devices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: removeDeviceId }),
      });

      if (res.ok) {
        addToast('Device removed', 'success');
        setShowRemoveConfirm(false);
        fetchDevices();
        fetchSecurityLogs();
      } else {
        addToast('Failed to remove device', 'error');
      }
    } catch {
      addToast('Failed to remove device', 'error');
    }
    setProcessing(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24"
    >
      <ToastContainer />

      <motion.div variants={item} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            ←
          </button>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Trusted Devices
          </h1>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-400 mt-1 ml-13">
          Manage trusted devices and security activity
        </p>
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <div className="flex gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-1">
          {(['devices', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] text-white shadow-lg shadow-blue-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab === 'devices' && '📱 Devices'}
              {tab === 'activity' && '📋 Activity'}
            </button>
          ))}
        </div>
      </motion.div>

      {activeTab === 'devices' && (
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {devices.length}/4 Devices
            </p>
          </div>

          <Button
            onClick={handleGenerateInvitation}
            loading={generating}
            className="w-full rounded-2xl"
            size="lg"
          >
            ➕ Add New Device
          </Button>

          {devices.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <span className="text-4xl mb-3 block">📱</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No trusted devices</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Register your first device during login
                </p>
              </div>
            </GlassCard>
          ) : (
            devices.map((device) => (
              <motion.div
                key={device._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className={`${device._id === deviceId ? 'ring-2 ring-emerald-400/50' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-xl shadow-lg shadow-blue-400/20 flex-shrink-0">
                      {device.platform === 'Android' ? '🤖' :
                       device.platform === 'iOS' ? '📱' :
                       device.platform === 'Windows' ? '💻' :
                       device.platform === 'MacOS' ? '🖥️' : '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {device.deviceName}
                        </p>
                        {device._id === deviceId && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/50 dark:border-emerald-700/30 flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Owner: {device.owner}</span>
                      </div>
                      {device.addedBy && device.addedBy !== 'First Device' && device.addedBy !== 'Recovery' && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>Added by: {device.addedBy}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{device.platform}</span>
                        <span>·</span>
                        <span>{device.browser}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>Trusted</span>
                        <span>·</span>
                        <span>Last active: {formatDate(device.lastActive)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <Button
                      onClick={() => {
                        setRenameDeviceId(device._id);
                        setRenameValue(device.deviceName);
                        setShowRenameModal(true);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      ✏️ Rename
                    </Button>
                    <Button
                      onClick={() => {
                        setRemoveDeviceId(device._id);
                        setRemoveDeviceName(device.deviceName);
                        setShowRemoveConfirm(true);
                      }}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                    >
                      🗑️ Remove
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'activity' && (
        <motion.div variants={item} className="space-y-3">
          {securityLogs.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <span className="text-4xl mb-3 block">📋</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No activity yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Security events will appear here
                </p>
              </div>
            </GlassCard>
          ) : (
            securityLogs.map((log) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <GlassCard padding="sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${getEventColor(log.event)}`}>
                      {getEventIcon(log.event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {log.description}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <Modal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Device">
        <div className="space-y-4">
          <Input
            value={renameValue}
            onChange={setRenameValue}
            placeholder="Device name"
            label="Device Name"
          />
          <div className="flex gap-3">
            <Button onClick={() => setShowRenameModal(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRenameDevice} loading={processing} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveDevice}
        title="Remove Trusted Device?"
        message={`"${removeDeviceName}" will immediately lose access to the application.`}
        confirmText="Remove"
        danger
      />

      <Modal
        isOpen={showInvitationModal}
        onClose={() => {
          setShowInvitationModal(false);
          setInvitationCode('');
          setInvitationExpiresAt(null);
          setQrDataUrl('');
        }}
        title="Add New Device"
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-400/20 mb-4">
              🔗
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
              Share this code with the new device
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Generate a temporary invitation code for another device.
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4 text-center">
            <p className="text-2xl font-mono font-bold tracking-[0.15em] text-slate-800 dark:text-slate-100">
              {invitationCode}
            </p>
          </div>

          {invitationExpiresAt && (
            <div className="text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Expires in</p>
              <p className={`text-lg font-mono font-bold ${countdown === '00:00' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {countdown}
              </p>
            </div>
          )}

          {qrDataUrl && (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-3 shadow-lg">
                <img src={qrDataUrl} alt="Invitation QR Code" className="w-40 h-40" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(invitationCode);
                addToast('Code copied!', 'success');
              }}
              variant="secondary"
              className="w-full"
            >
              📋 Copy Code
            </Button>
            <Button
              onClick={() => {
                setShowInvitationModal(false);
                setInvitationCode('');
                setInvitationExpiresAt(null);
                setQrDataUrl('');
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
