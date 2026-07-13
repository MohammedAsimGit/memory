'use client';

export default function DateSeparator({ date }: { date: string }) {
  const getDateLabel = () => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="flex justify-center my-3 px-1">
      <span className="px-3 py-[5px] rounded-full bg-slate-100/80 dark:bg-white/[0.06] text-[11px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-white/[0.06]">
        {getDateLabel()}
      </span>
    </div>
  );
}
