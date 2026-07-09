'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const menuItems = [
  { title: 'Special Days', desc: 'Countdowns & milestones', icon: '📅', color: '#6366F1', href: '/special-days' },
  { title: 'Journal', desc: 'Daily thoughts', icon: '📔', color: '#10B981', href: '/journal' },
  { title: 'Letters', desc: 'Messages for the future', icon: '💌', color: '#EC4899', href: '/letters' },
  { title: 'Time Capsule', desc: 'Locked treasures', icon: '🔮', color: '#8B5CF6', href: '/time-capsule' },
  { title: 'Music', desc: 'Our playlist', icon: '🎵', color: '#F59E0B', href: '/music' },
  { title: 'Gallery', desc: 'Photos & videos', icon: '🖼️', color: '#3B82F6', href: '/gallery' },
  { title: 'Map', desc: 'Places we\'ve been', icon: '🗺️', color: '#14B8A6', href: '/map' },
  { title: 'Search', desc: 'Find any memory', icon: '🔍', color: '#64748B', href: '/search' },
  { title: 'Profile', desc: 'Our relationship', icon: '👤', color: '#06B6D4', href: '/profile' },
  { title: 'Settings', desc: 'Preferences & security', icon: '⚙️', color: '#78716C', href: '/settings' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export default function MorePage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-[28px] font-black text-slate-800 dark:text-slate-100 tracking-tight">
          More
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Explore all features
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {menuItems.map((m) => (
          <motion.button
            key={m.href}
            variants={item}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(m.href)}
            className="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-[20px] p-4 border border-white/50 dark:border-slate-700/50 shadow-lg shadow-sky-100/50 dark:shadow-black/20 text-left overflow-hidden flex flex-col gap-3 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: m.color }}
            />
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-md"
              style={{ background: `${m.color}18`, boxShadow: `0 4px 12px ${m.color}20` }}
            >
              {m.icon}
            </div>
            <div>
              <p className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-tight">
                {m.title}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                {m.desc}
              </p>
            </div>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center ml-auto group-hover:translate-x-0.5 transition-transform"
              style={{ background: `${m.color}12` }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={m.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center py-4"
      >
        <p className="text-xs text-slate-300 dark:text-slate-600 font-medium">
          A private space for two hearts
        </p>
      </motion.div>
    </div>
  );
}
