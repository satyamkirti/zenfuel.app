'use client';

import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Hidden Mode". */
  label: string;
  disabled?: boolean;
}

// An on/off toggle announced as a switch with its state.
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex w-11 h-6 shrink-0 items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
      )}
    >
      <span className={clsx('block w-4 h-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}
