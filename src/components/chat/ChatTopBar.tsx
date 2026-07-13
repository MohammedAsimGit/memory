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
}

export default function ChatTopBar({ onBack, onSearch, isConnected }: ChatTopBarProps) {
  const { isPartnerOnline, partnerLastSeen, partnerTyping } = useChatStore();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings } = useApi<Settings>('/settings');

  const partnerName = activeProfile === 'me'
    ? settings?.partnerName2 || 'My Love'
    : settings?.partnerName1 || 'Partner';

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
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
    return 'Offline';
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 dark:text-slate-200">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-white font-bold text-sm shadow-md">
          {partnerName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 truncate">
            {partnerName}
          </h2>
          <motion.p
            key={getStatusText()}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[12px] ${
              !isConnected
                ? 'text-amber-500'
                : partnerTyping
                ? 'text-blue-500'
                : isPartnerOnline
                ? 'text-emerald-500'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {partnerTyping && (
              <span className="inline-flex gap-0.5 mr-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
            {getStatusText()}
          </motion.p>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
