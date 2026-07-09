'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';

const navItems = [
  { title: 'Special Days', href: '/special-days', icon: '📅' },
  { title: 'Profile', href: '/profile', icon: '👤' },
  { title: 'Journal', href: '/journal', icon: '📔' },
  { title: 'Letters to Future', href: '/letters', icon: '💌' },
  { title: 'Time Capsule', href: '/time-capsule', icon: '🔮' },
  { title: 'Map', href: '/map', icon: '🗺️' },
  { title: 'Music', href: '/music', icon: '🎵' },
  { title: 'Search', href: '/search', icon: '🔍' },
  { title: 'Settings', href: '/settings', icon: '⚙️' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 24,
    },
  },
};

export default function MorePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center text-3xl font-bold text-white"
      >
        More
      </motion.h1>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-lg grid-cols-2 gap-4"
      >
        {navItems.map((item) => (
          <motion.div
            key={item.href}
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassCard
              className="flex cursor-pointer items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/10"
              onClick={() => router.push(item.href)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {item.title}
                </p>
              </div>
              <span className="text-white/40 text-lg">›</span>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
