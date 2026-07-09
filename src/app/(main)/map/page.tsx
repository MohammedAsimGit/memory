'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useApi } from '@/hooks/useApi';
import type { Memory } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function MapPage() {
  const router = useRouter();
  const { data: memories, loading } = useApi<Memory[]>('/memories');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const locationMemories = (memories || []).filter((m) => m.location);

  const groupedByLocation: Record<string, Memory[]> = {};
  locationMemories.forEach((m) => {
    const loc = m.location!;
    if (!groupedByLocation[loc]) groupedByLocation[loc] = [];
    groupedByLocation[loc].push(m);
  });

  const locations = Object.entries(groupedByLocation).sort((a, b) => b[1].length - a[1].length);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24"
    >
      <motion.div variants={item} className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Map</h1>
        <p className="text-sm text-slate-400 mt-1">
          {locationMemories.length > 0
            ? `${locationMemories.length} memor${locationMemories.length !== 1 ? 'ies' : 'y'} across ${locations.length} location${locations.length !== 1 ? 's' : ''}`
            : 'Explore memories by location'}
        </p>
      </motion.div>

      {locations.length > 0 ? (
        <motion.div className="space-y-3">
          {locations.map(([location, mems], idx) => (
            <motion.div
              key={location}
              variants={item}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <GlassCard
                onClick={() => router.push('/timeline')}
                className="cursor-pointer overflow-hidden"
              >
                <div className="flex gap-4">
                  {mems[0]?.images?.[0] ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={mems[0].images[0]}
                        alt={location}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4FC3F7]/20 to-[#1976D2]/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1976D2"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                      {location}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {mems.length} memor{mems.length !== 1 ? 'ies' : 'y'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mems.slice(0, 3).map((m) => (
                        <span
                          key={m._id}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100"
                        >
                          {m.title}
                        </span>
                      ))}
                      {mems.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                          +{mems.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <svg
                      width="20"
                      height="20"
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
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyState
            icon="🗺️"
            title="No Location Memories"
            description="Add a location when creating memories to see them grouped here on your map. Every adventure deserves a pin!"
          />
        </motion.div>
      )}
    </motion.div>
  );
}
