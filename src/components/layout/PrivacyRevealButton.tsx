'use client';

import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { usePrivacy } from '@/context/PrivacyContext';
import { useT } from '@/i18n/I18nProvider';

// Shown only while Hidden Mode is on: temporarily shows private details (for two minutes,
// or until the app goes to the background) without turning Hidden Mode off.
export function PrivacyRevealButton({ compact, onDark }: { compact?: boolean; onDark?: boolean }) {
  const { hiddenMode, revealed, reveal, conceal } = usePrivacy();
  const t = useT();
  if (!hiddenMode) return null;
  return (
    <button
      type="button"
      onClick={revealed ? conceal : reveal}
      aria-pressed={revealed}
      aria-label={revealed ? t('privacy.hideDetails') : t('privacy.showFor2')}
      title={revealed ? t('privacy.hideDetails') : t('privacy.showFor2')}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        compact ? 'px-2' : 'px-3',
        revealed
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
          : onDark ? 'bg-white/10 text-blue-50 hover:bg-white/15' : 'btn-ghost text-ink-2'
      )}
    >
      {revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
      <span className={compact ? 'sr-only sm:not-sr-only' : ''}>{revealed ? t('privacy.hide') : t('privacy.show')}</span>
    </button>
  );
}
