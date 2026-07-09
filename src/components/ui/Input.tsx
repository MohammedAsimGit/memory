'use client';

import { cn } from '@/lib/utils';

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  name?: string;
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  label,
  icon,
  error,
  multiline,
  rows = 4,
  required,
  name,
}: InputProps) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 ml-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <Component
          name={name}
          type={type}
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]/50 transition-all duration-200 shadow-sm',
            icon ? 'pl-10 pr-4' : 'px-4',
            multiline ? 'py-3' : 'py-3',
            multiline && 'resize-none',
            error && 'border-red-300 focus:ring-red-200',
            className
          )}
          rows={multiline ? rows : undefined}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
}
