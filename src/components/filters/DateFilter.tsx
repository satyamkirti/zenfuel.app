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
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface-2" role="group" aria-label="Time period">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          className={clsx(
            'min-h-[32px] px-2.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
            value === p.value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-muted hover:text-ink'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
