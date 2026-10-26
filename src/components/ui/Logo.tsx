'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { LayoutGrid } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';

type LogoSize = 'sm' | 'md' | 'lg';
const MARK: Record<LogoSize, number> = { sm: 28, md: 34, lg: 46 };
const TEXT: Record<LogoSize, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

interface LogoProps {
  size?: LogoSize;
  className?: string;
  linked?: boolean;
}

export function Logo({ size = 'md', className, linked = true }: LogoProps) {
  const { hiddenMode, hiddenTitle } = usePrivacy();
  const px = MARK[size];
  const content = hiddenMode ? (
    <span className={clsx('inline-flex items-center gap-2 min-w-0', className)}>
      <span className="shrink-0 rounded-xl bg-line text-slate-500 dark:text-slate-300 flex items-center justify-center" style={{ width: px, height: px }}>
        <LayoutGrid size={Math.round(px * 0.5)} aria-hidden="true" />
      </span>
      <span className={clsx('font-semibold text-ink truncate', size === 'lg' ? 'text-xl' : 'text-base')}>{hiddenTitle}</span>
    </span>
  ) : (
    <span data-brand className={clsx('inline-flex items-center gap-2.5 min-w-0', className)}>
      <Image src="/images/zenfuel-app-icon.svg" alt="" width={px} height={px} priority className="shrink-0 rounded-xl object-contain" />
      <span className="flex min-w-0 flex-col gap-1">
        <span className={clsx('font-extrabold tracking-[-0.045em] leading-none whitespace-nowrap', TEXT[size])}>
          <span className="text-blue-600 dark:text-blue-400">Zen</span><span className="text-teal-600 dark:text-teal-400">Fuel</span>
        </span>
        {size === 'lg' && <span className="text-[8px] font-bold uppercase tracking-[0.13em] leading-none text-muted whitespace-nowrap">Screen Time &amp; Habit Tracker</span>}
      </span>
    </span>
  );
  if (!linked) return content;
  return <Link href="/" aria-label={hiddenMode ? hiddenTitle + ' — home' : 'ZenFuel — Screen Time and Habit Tracker — home'} className="inline-flex min-w-0 rounded-xl focus-visible:outline-offset-4">{content}</Link>;
}
