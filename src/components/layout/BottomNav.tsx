'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app';

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7a1 1 0 00-1-1h-4a1 1 0 00-1 1v7H4a1 1 0 01-1-1V9.5z" fill={active ? '#1976D2' : '#94A3B8'} />
      </svg>
    ),
    route: '/home',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M2 12h20" stroke={active ? '#1976D2' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill={active ? '#1976D2' : '#94A3B8'} />
      </svg>
    ),
    route: '/timeline',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" fill={active ? '#1976D2' : '#94A3B8'} />
        <rect x="14" y="3" width="7" height="7" rx="2" fill={active ? '#1976D2' : '#94A3B8'} />
        <rect x="3" y="14" width="7" height="7" rx="2" fill={active ? '#1976D2' : '#94A3B8'} />
        <rect x="14" y="14" width="7" height="7" rx="2" fill={active ? '#1976D2' : '#94A3B8'} />
      </svg>
    ),
    route: '/gallery',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={active ? '#1976D2' : '#94A3B8'} strokeWidth="2" />
        <path d="M4 21a8 8 0 0116 0" stroke={active ? '#1976D2' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    route: '/profile',
  },
];

interface BottomNavProps {
  fabOpen: boolean;
  onFabToggle: () => void;
}

export default function BottomNav({ fabOpen, onFabToggle }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const currentTab = pathname?.split('/')[1] || 'home';

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => {
    const isActive = currentTab === tab.id;
    return (
      <button
        onClick={() => {
          setActiveTab(tab.id);
          router.push(tab.route);
        }}
        className="relative flex flex-col items-center gap-1 w-16 py-1"
      >
        {isActive && (
          <motion.div
            layoutId="tab-bg"
            className="absolute inset-0 bg-sky-100 dark:bg-sky-900/40 rounded-2xl -z-10"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {tab.icon(isActive)}
        </motion.div>
        <motion.span
          animate={{ color: isActive ? '#1976D2' : '#94A3B8', fontWeight: isActive ? 600 : 400 }}
          className="text-[10px]"
        >
          {tab.label}
        </motion.span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-white/50 dark:border-slate-700/50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] pb-safe">
        <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
          {leftTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}

          <div className="w-16 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={onFabToggle}
              className="relative -mt-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center shadow-xl shadow-blue-400/40 ring-4 ring-white/80 dark:ring-slate-900"
            >
              <motion.svg
                animate={{ rotate: fabOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </motion.svg>
            </motion.button>
          </div>

          {rightTabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
      <div className="h-safe-bottom bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl" />
    </div>
  );
}
