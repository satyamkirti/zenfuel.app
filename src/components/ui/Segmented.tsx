'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The one segmented control (period filters, theme, tabs): equal segments on a tinted track, and a
 * teal pill that slides to the chosen one. Each segment is a real button with aria-pressed.
 */
export function Segmented<T extends string>({ options, value, onChange, label, size = 'md', className }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const n = options.length;
  return (
    <div
      className={clsx('relative grid p-1 rounded-2xl bg-surface-2 border border-line', className)}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      role="group"
      aria-label={label}
    >
      <span
        className="absolute inset-y-1 left-1 rounded-xl bg-brand-gradient shadow-glow transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${n})`, transform: `translateX(${index * 100}%)` }}
        aria-hidden="true"
      />
      {options.map(o => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={clsx(
              'relative z-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl font-semibold whitespace-nowrap transition-colors duration-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface-2',
              size === 'sm' ? 'min-h-[36px] text-[13px]' : 'min-h-[42px] text-sm',
              on ? 'text-on-brand' : 'text-muted hover:text-ink'
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
