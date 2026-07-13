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
    <div className="flex justify-center my-4">
      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-sm">
        {getDateLabel()}
      </span>
    </div>
  );
}
