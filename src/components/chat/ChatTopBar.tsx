'use client';

import { motion } from 'framer-motion';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import type { Settings } from '@/types';

interface ChatTopBarProps {
  onBack: () => void;
  onSearch: () => void;
  isConnected: boolean;
  connectionMode?: string;
}

export default function ChatTopBar({ onBack, onSearch, isConnected, connectionMode }: ChatTopBarProps) {
  const { isPartnerOnline, partnerLastSeen, partnerTyping } = useChatStore();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const partnerName = activeProfile === 'me'
    ? settings?.partnerName2 || 'My Love'
    : settings?.partnerName1 || 'Partner';

  const getStatusText = () => {
    if (connectionMode === 'connecting' && !isConnected) return 'Connecting...';
    if (partnerTyping) return 'typing...';
    if (isPartnerOnline) return 'Online';
    if (partnerLastSeen) {
      const date = new Date(partnerLastSeen);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `Last seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
    }
    return isConnected ? 'Online' : 'Offline';
  };

  const statusColor = !isConnected
    ? 'text-amber-500'
    : partnerTyping
    ? 'text-blue-500'
    : isPartnerOnline
    ? 'text-emerald-500'
    : 'text-slate-400 dark:text-slate-500';

  return (
    <div
      className="relative z-50 flex-shrink-0 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-slate-200/40 dark:border-white/[0.06]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 dark:text-slate-200">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-500/20">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            {isPartnerOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {partnerName}
            </h2>
            <motion.p
              key={getStatusText()}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-[12px] leading-tight ${statusColor}`}
            >
              {partnerTyping && (
                <span className="inline-flex gap-[3px] mr-1">
                  <span className="w-[3px] h-[3px] rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-[3px] h-[3px] rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-[3px] h-[3px] rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {getStatusText()}
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSearch}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
