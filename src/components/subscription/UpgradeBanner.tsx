'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface UpgradeBannerProps {
  message: string;
  cta?: string;
  variant?: 'subtle' | 'prominent';
  className?: string;
  dismissKey?: string;
}

export function UpgradeBanner({ message, cta = 'Upgrade to Premium', variant = 'subtle', className, dismissKey }: UpgradeBannerProps) {
  const sessionKey = dismissKey ? `banner_dismissed_${dismissKey}` : null;
  const [dismissed, setDismissed] = useState(() => {
    if (!sessionKey || typeof window === 'undefined') return false;
    return sessionStorage.getItem(sessionKey) === '1';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    if (sessionKey) sessionStorage.setItem(sessionKey, '1');
    setDismissed(true);
  };

  if (variant === 'prominent') {
    return (
      <div className={clsx('relative rounded-xl overflow-hidden', className)}>
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">{message}</p>
          </div>
          <Link href="/upgrade" className="shrink-0 px-4 py-1.5 bg-white text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-50 transition-colors whitespace-nowrap">
            {cta} →
          </Link>
          <button onClick={handleDismiss} className="shrink-0 text-white/60 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl', className)}>
      <Crown size={15} className="text-amber-500 shrink-0" />
      <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">{message}</p>
      <Link href="/upgrade" className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap">{cta} →</Link>
      <button onClick={handleDismiss} className="text-amber-400 hover:text-amber-600 transition-colors ml-1">
        <X size={12} />
      </button>
    </div>
  );
}
