'use client';

import { FilterPeriod } from '@/types';
import { clsx } from 'clsx';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';

interface DateFilterProps {
  value: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}

const PERIODS: { value: FilterPeriod; label: MessageKey }[] = [
  { value: 'today', label: 'periods.today' },
  { value: '7d', label: 'periods.7d' },
  { value: '30d', label: 'periods.30d' },
  { value: '90d', label: 'periods.90d' },
  { value: '6m', label: 'periods.6m' },
  { value: '1y', label: 'periods.1y' },
  { value: 'lifetime', label: 'periods.lifetime' },
];

// Period chips: one scrollable row on phones (no wrapping into a ragged block), the chosen one in teal.
export function DateFilter({ value, onChange }: DateFilterProps) {
  const t = useT();
  return (
    <div className="-mx-1 px-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap" role="group" aria-label={t('periods.label')}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          className={clsx(
            'shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            value === p.value
              ? 'bg-brand border-brand text-on-brand shadow-glow'
              : 'bg-surface-2 border-line text-ink-2 hover:text-ink hover:border-line-strong'
          )}
        >
          {t(p.label)}
        </button>
      ))}
    </div>
  );
}
