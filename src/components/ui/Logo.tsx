'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { LayoutGrid } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';

type LogoSize = 'sm' | 'md' | 'lg';

const MARK: Record<LogoSize, number> = { sm: 30, md: 36, lg: 48 };
const TEXT: Record<LogoSize, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

interface LogoProps {
  size?: LogoSize;
  className?: string;
  linked?: boolean;
}

// Brand mark plus a text wordmark (the original artwork is mostly empty space and was
// rendered as a 100–140 px square). In Hidden Mode it shows the neutral title instead.
export function Logo({ size = 'md', className, linked = true }: LogoProps) {
  const { hiddenMode, hiddenTitle } = usePrivacy();
  const px = MARK[size];

  const content = hiddenMode ? (
    <span className={clsx('inline-flex items-center gap-2 min-w-0', className)}>
      <span className="shrink-0 rounded-lg bg-line text-slate-500 dark:text-slate-300 flex items-center justify-center" style={{ width: px, height: px }}>
        <LayoutGrid size={Math.round(px * 0.5)} aria-hidden="true" />
      </span>
      <span className={clsx('font-semibold text-ink truncate', size === 'lg' ? 'text-2xl' : 'text-base')}>{hiddenTitle}</span>
    </span>
  ) : (
    // data-brand: hidden by CSS before hydration when Hidden Mode is saved (see layout.tsx).
    <span data-brand className={clsx('inline-flex items-center gap-2', className)}>
      <Image src="/images/zenfuel-mark.png" alt="" width={px} height={px} priority className="shrink-0" />
      <span className={clsx('font-bold tracking-tight leading-none', TEXT[size])}>
        <span className="text-teal-600 dark:text-teal-400">Zen</span>
        <span className="text-amber-500 dark:text-amber-400">Fuel</span>
      </span>
    </span>
  );

  if (!linked) return content;

  return (
    <Link
      href="/"
      aria-label={hiddenMode ? `${hiddenTitle} — home` : 'ZenFuel — home'}
      className="inline-flex min-w-0 shrink rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {content}
    </Link>
  );
}
