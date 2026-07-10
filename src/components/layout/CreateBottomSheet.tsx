'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const actions = [
  { title: 'New Memory', desc: "Save today's special moment.", icon: '📸', color: '#3B82F6', href: '/add-memory' },
  { title: 'New Journal', desc: "Write today's thoughts and feelings.", icon: '📔', color: '#10B981', href: '/journal' },
  { title: 'New Letter', desc: 'Write a letter for your future selves.', icon: '💌', color: '#EC4899', href: '/letters' },
  { title: 'Time Capsule', desc: 'Lock memories until a future date.', icon: '🔮', color: '#8B5CF6', href: '/time-capsule' },
  { title: 'Add Song', desc: 'Attach a song to your relationship.', icon: '🎵', color: '#F59E0B', href: '/music' },
  { title: 'Add Location', desc: 'Mark a special place on the map.', icon: '📍', color: '#14B8A6', href: '/map' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function CreateBottomSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();

  const handleAction = (href: string) => {
    onClose();
    setTimeout(() => router.push(href), 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-white/50 dark:border-slate-700/50 shadow-2xl shadow-black/20 pb-safe overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="px-5 py-4 text-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            ❤️ Create Something
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture another beautiful chapter of your story.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="px-5 pb-8 grid grid-cols-2 gap-3"
        >
          {actions.map((action) => (
            <motion.button
              key={action.title}
              variants={item}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAction(action.href)}
              className="relative bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-slate-700/50 shadow-lg shadow-sky-100/50 dark:shadow-black/20 text-left overflow-hidden group"
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-bl-[28px] opacity-[0.07] group-hover:opacity-[0.14] transition-opacity"
                style={{ background: action.color }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow-md"
                style={{ background: `${action.color}15`, boxShadow: `0 4px 12px ${action.color}18` }}
              >
                {action.icon}
              </div>
              <p className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-tight mb-1">
                {action.title}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-tight line-clamp-2">
                {action.desc}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
