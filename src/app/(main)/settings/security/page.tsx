'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import type { TrustedDevice, DeviceRequest, SecurityLog } from '@/types';

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
    case 'device_request': return '📨';
    case 'device_approved': return '✅';
    case 'device_rejected': return '❌';
    case 'device_renamed': return '✏️';
    case 'approval_code_generated': return '🔢';
    case 'recovery_used': return '🔑';
    case 'password_changed': return '🔐';
    default: return '📋';
  }
};

const getEventColor = (event: string) => {
  switch (event) {
    case 'device_registered':
    case 'device_approved':
    case 'recovery_used': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    case 'device_removed':
    case 'device_rejected': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'device_request':
    case 'approval_code_generated': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
    case 'device_renamed': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
  }
};

export default function SecurityPage() {
  const router = useRouter();
  const { addToast, ToastContainer } = useToast();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const deviceToken = useAuthStore((s) => s.deviceToken);
  const deviceId = useAuthStore((s) => s.deviceId);

  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DeviceRequest[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'devices' | 'requests' | 'activity'>('devices');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDeviceId, setRenameDeviceId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeDeviceId, setRemoveDeviceId] = useState('');
  const [removeDeviceName, setRemoveDeviceName] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeviceRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  const userId = activeProfile || 'me';

  const fetchDevices = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/auth/devices?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDevices(data.devices || []);
    } catch {
      addToast('Failed to load devices', 'error');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/auth/device/pending?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingRequests(data.requests || []);
    } catch {
      addToast('Failed to load requests', 'error');
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/auth/security-log?userId=${userId}`, {
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
    await Promise.all([fetchDevices(), fetchPendingRequests(), fetchSecurityLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const prevRequestCountRef = useRef(pendingRequests.length);

  useEffect(() => {
    if (pendingRequests.length > prevRequestCountRef.current) {
      addToast('New device access request received!', 'info');
    }
    prevRequestCountRef.current = pendingRequests.length;
  }, [pendingRequests.length]);

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
          userId,
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
        body: JSON.stringify({ deviceId: removeDeviceId, userId }),
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

  const handleApproveRequest = async (request: DeviceRequest) => {
    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: request._id }),
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedRequest(request);
        setShowApprovalModal(true);
        fetchPendingRequests();
        fetchDevices();
        fetchSecurityLogs();
      } else {
        addToast(data.error || 'Failed to approve request', 'error');
      }
    } catch {
      addToast('Failed to approve request', 'error');
    }
    setProcessing(false);
  };

  const handleRejectRequest = async (request: DeviceRequest) => {
    setProcessing(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/device/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: request._id }),
      });

      if (res.ok) {
        addToast('Request rejected', 'success');
        fetchPendingRequests();
        fetchSecurityLogs();
      } else {
        addToast('Failed to reject request', 'error');
      }
    } catch {
      addToast('Failed to reject request', 'error');
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
            Security
          </h1>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-400 mt-1 ml-13">
          Manage trusted devices and security activity
        </p>
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <div className="flex gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-1">
          {(['devices', 'requests', 'activity'] as const).map((tab) => (
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
              {tab === 'requests' && `📨 Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`}
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

      {activeTab === 'requests' && (
        <motion.div variants={item} className="space-y-4">
          {pendingRequests.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <span className="text-4xl mb-3 block">📨</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No pending requests</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Device access requests will appear here
                </p>
              </div>
            </GlassCard>
          ) : (
            pendingRequests.map((request) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-amber-400/20 flex-shrink-0">
                      📨
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {request.deviceName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{request.platform}</span>
                        <span>·</span>
                        <span>{request.browser}</span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Requested {formatDate(request.requestedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveRequest(request)}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      loading={processing}
                    >
                      ✅ Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request)}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      loading={processing}
                    >
                      ❌ Reject
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

      <Modal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} title="Device Approved">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-400/20 mb-4">
              ✅
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-bold">{selectedRequest?.deviceName}</span> has been approved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              The device will automatically be granted access.
            </p>
          </div>
          <Button onClick={() => setShowApprovalModal(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
