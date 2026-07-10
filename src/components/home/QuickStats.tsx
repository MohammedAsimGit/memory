'use client';

import { motion } from 'framer-motion';

interface StatCard { label: string; value: number; icon: string; color: string }

export default function QuickStats({ stats }: { stats: StatCard[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="grid grid-cols-4 gap-2.5 w-full"
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.06 }}
          whileHover={{ scale: 1.05, y: -2 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-3 text-center border border-white/50 dark:border-slate-700/50 shadow-md"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mx-auto mb-1.5 shadow-sm"
            style={{ background: `${s.color}15` }}
          >
            {s.icon}
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
            {s.value.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
