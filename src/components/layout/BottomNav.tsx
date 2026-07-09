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
    id: 'calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="3" stroke={active ? '#1976D2' : '#94A3B8'} strokeWidth="2" />
        <path d="M3 10h18M8 2v4M16 2v4" stroke={active ? '#1976D2' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    route: '/calendar',
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
    id: 'more',
    label: 'More',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="6" r="2" fill={active ? '#1976D2' : '#94A3B8'} />
        <circle cx="12" cy="12" r="2" fill={active ? '#1976D2' : '#94A3B8'} />
        <circle cx="12" cy="18" r="2" fill={active ? '#1976D2' : '#94A3B8'} />
      </svg>
    ),
    route: '/more',
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const currentTab = pathname?.split('/')[1] || 'home';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/70 backdrop-blur-2xl border-t border-white/50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(tab.route);
                }}
                className="relative flex flex-col items-center gap-1 w-16 py-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-sky-100 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {tab.icon(isActive)}
                </motion.div>
                <motion.span
                  animate={{
                    color: isActive ? '#1976D2' : '#94A3B8',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  className="text-[10px]"
                >
                  {tab.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-safe-bottom bg-white/70 backdrop-blur-2xl" />
    </div>
  );
}
