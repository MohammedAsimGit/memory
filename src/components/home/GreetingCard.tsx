'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';

interface GreetingCardProps {
  daysTogether: number;
  partnerName1: string;
  partnerName2: string;
}

export default function GreetingCard({ daysTogether, partnerName1, partnerName2 }: GreetingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#4FC3F7] via-[#2196F3] to-[#1976D2] rounded-3xl p-6 shadow-xl shadow-blue-400/30 text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        <h2 className="text-lg opacity-90 font-medium mb-1">Our Story</h2>
        <h1 className="text-3xl font-bold mb-4">
          {partnerName1} <span className="opacity-70">&</span> {partnerName2}
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
            💕
          </div>
          <div>
            <p className="text-sm opacity-80">Together for</p>
            <p className="text-2xl font-bold">
              {daysTogether.toLocaleString()} days
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
