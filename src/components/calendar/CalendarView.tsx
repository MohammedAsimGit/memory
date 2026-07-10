'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { getMonthDays } from '@/lib/utils';
import { Badge } from '@/components/ui/EmptyState';

interface CalendarViewProps {
  memoriesByDate: Record<string, number>;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export default function CalendarView({ memoriesByDate, onDateSelect, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());

  const days = getMonthDays(currentYear, currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthName = dayjs(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`).format('MMMM YYYY');

  return (
    <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-xl rounded-3xl p-5 border border-white/50 dark:border-slate-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors">
          ‹
        </button>
        <span className="font-bold text-slate-800 dark:text-slate-100">{monthName}</span>
        <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isCurrentMonth = day.month() === currentMonth;
          const count = memoriesByDate[dateStr] || 0;
          const isSelected = dateStr === selectedDate;
          const isToday = day.isSame(dayjs(), 'day');

          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm
                transition-colors duration-150
                ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'}
                ${isSelected ? 'bg-[#2196F3] text-white shadow-md' : 'hover:bg-sky-50 dark:hover:bg-sky-900/40'}
                ${isToday && !isSelected ? 'border-2 border-[#2196F3]' : ''}
              `}
            >
              <span className="font-medium">{day.date()}</span>
              {count > 0 && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-[#2196F3]'
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
