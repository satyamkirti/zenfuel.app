'use client';

import Link from 'next/link';
import { Lock, Crown } from 'lucide-react';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface LockOverlayProps {
  children: ReactNode;
  feature?: string;
  description?: string;
  blur?: boolean;
  className?: string;
  compact?: boolean;
}

export function LockOverlay({ children, feature, description, blur = true, className, compact }: LockOverlayProps) {
  return (
    <div className={clsx('relative rounded-xl overflow-hidden', className)}>
      <div className={blur ? 'blur-sm pointer-events-none select-none' : 'pointer-events-none select-none'}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/70 backdrop-blur-[2px] rounded-xl">
        {compact ? (
          <Link href="/upgrade" className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105">
            <Lock size={11} /> Premium
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown size={24} className="text-white" />
            </div>
            {feature && <p className="font-bold text-slate-800 dark:text-white text-sm">{feature}</p>}
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>}
            <Link
              href="/upgrade"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Unlock Premium →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface LockedButtonProps {
  children: ReactNode;
  className?: string;
}

export function LockedButton({ children, className }: LockedButtonProps) {
  return (
    <Link href="/upgrade" className={clsx('inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed pointer-events-auto', className)}>
      {children}
      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-[9px] font-bold">PRO</span>
    </Link>
  );
}
