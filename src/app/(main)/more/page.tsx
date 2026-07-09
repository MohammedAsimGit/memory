'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';

const sections = [
  {
    title: 'Memories & Moments',
    items: [
      { title: 'Special Days', href: '/special-days', icon: '📅', desc: 'Countdowns & milestones' },
      { title: 'Map', href: '/map', icon: '🗺️', desc: 'Places we\'ve been' },
      { title: 'Search', href: '/search', icon: '🔍', desc: 'Find any memory' },
    ],
  },
  {
    title: 'Writing & Reflections',
    items: [
      { title: 'Journal', href: '/journal', icon: '📔', desc: 'Daily thoughts' },
      { title: 'Letters to Future', href: '/letters', icon: '💌', desc: 'Messages locked in time' },
      { title: 'Time Capsule', href: '/time-capsule', icon: '🔮', desc: 'Treasures to unlock later' },
    ],
  },
  {
    title: 'Media & Profile',
    items: [
      { title: 'Music', href: '/music', icon: '🎵', desc: 'Our playlist' },
      { title: 'Profile', href: '/profile', icon: '👤', desc: 'Our relationship stats' },
      { title: 'Settings', href: '/settings', icon: '⚙️', desc: 'Preferences & security' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export default function MorePage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          More
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore all features
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {sections.map((section) => (
          <motion.div key={section.title} variants={sectionVariants}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <motion.div
                  key={item.href}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard
                    onClick={() => router.push(item.href)}
                    padding="md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-blue-300/20">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <svg
                        className="flex-shrink-0 text-slate-300"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">A private space for two hearts</p>
      </div>
    </div>
  );
}
