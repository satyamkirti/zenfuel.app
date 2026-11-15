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
        'group relative inline-flex w-12 h-7 shrink-0 items-center rounded-full transition-colors duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-brand-gradient shadow-glow' : 'bg-line-strong dark:bg-surface-3'
      )}
    >
      <span className={clsx('block h-5 rounded-full bg-white shadow-md transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] w-5 group-active:w-6', checked ? 'translate-x-6 group-active:translate-x-5' : 'translate-x-1')} />
    </button>
  );
}
