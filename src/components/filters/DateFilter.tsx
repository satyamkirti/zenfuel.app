'use client';

import { FilterPeriod } from '@/types';
import { clsx } from 'clsx';

interface DateFilterProps {
  value: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}

const PERIODS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'lifetime', label: 'All Time' },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            value === p.value
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
