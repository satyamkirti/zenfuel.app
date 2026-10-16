'use client';

import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { usePrivacy } from '@/context/PrivacyContext';

// Shown only while Hidden Mode is on: temporarily shows private details (for two minutes,
// or until the app goes to the background) without turning Hidden Mode off.
export function PrivacyRevealButton({ compact }: { compact?: boolean }) {
  const { hiddenMode, revealed, reveal, conceal } = usePrivacy();
  if (!hiddenMode) return null;
  return (
    <button
      type="button"
      onClick={revealed ? conceal : reveal}
      aria-pressed={revealed}
      aria-label={revealed ? 'Hide private details' : 'Show private details for 2 minutes'}
      title={revealed ? 'Hide private details' : 'Show private details for 2 minutes'}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        compact ? 'px-2' : 'px-3',
        revealed
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
          : 'btn-ghost text-slate-600 dark:text-slate-300'
      )}
    >
      {revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
      <span className={compact ? 'sr-only sm:not-sr-only' : ''}>{revealed ? 'Hide' : 'Show'}</span>
    </button>
  );
}
