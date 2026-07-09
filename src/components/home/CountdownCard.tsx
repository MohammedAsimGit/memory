'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import { daysUntil, isToday } from '@/lib/utils';

interface CountdownCardProps {
  title: string;
  date: string;
  icon: string;
}

export default function CountdownCard({ title, date, icon }: CountdownCardProps) {
  const days = daysUntil(date);
  const today = isToday(date);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-md flex items-center gap-4 cursor-pointer"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-300/30 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{date}</p>
      </div>
      <div className="bg-sky-50 rounded-xl px-3 py-2 text-center flex-shrink-0">
        <p className="text-lg font-bold text-[#1976D2]">
          {today ? '🎉' : days > 0 ? days : '🎊'}
        </p>
        <p className="text-[10px] text-slate-500 font-medium">
          {today ? 'Today!' : days > 0 ? 'days' : 'Past'}
        </p>
      </div>
    </motion.div>
  );
}
