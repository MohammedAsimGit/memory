'use client';

import { Memory } from '@/types';
import TimelineCard from './TimelineCard';

export default function TimelineList({ memories }: { memories: Memory[] }) {
  const grouped = memories.reduce((acc: Record<string, Memory[]>, memory) => {
    const year = memory.date.split('-')[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div>
      {years.map((year) => (
        <div key={year} className="mb-6">
          <h2 className="text-2xl font-bold text-slate-300 mb-4 pl-4">{year}</h2>
          <div>
            {grouped[year].map((memory, i) => (
              <TimelineCard key={memory._id} memory={memory} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
