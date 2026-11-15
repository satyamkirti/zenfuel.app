'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { LayoutGrid } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';
import { BrandMark } from '@/components/ui/BrandMark';
import { useT } from '@/i18n/I18nProvider';

type LogoSize = 'sm' | 'md' | 'lg';

const TILE: Record<LogoSize, number> = { sm: 34, md: 40, lg: 56 };
const TEXT: Record<LogoSize, string> = { sm: 'text-[19px]', md: 'text-[21px]', lg: 'text-3xl' };
// The brand tagline under the wordmark: small uppercase with open letter spacing.
const TAGLINE: Record<LogoSize, string> = { sm: 'text-[8.5px] tracking-[0.14em]', md: 'text-[9px] tracking-[0.12em]', lg: 'text-[11px] tracking-[0.14em]' };

interface LogoProps {
  size?: LogoSize;
  className?: string;
  linked?: boolean;
  /** Show the tagline "SCREEN TIME & HABIT TRACKER" under the wordmark. */
  descriptor?: boolean;
  /** Light wordmark for always-dark surfaces (sidebar, hero). */
  onDark?: boolean;
}

// The approved ZenFuel identity: the blue clock-and-leaf app icon plus the "ZenFuel" wordmark (Zen in
// cobalt blue, Fuel in turquoise). In Hidden Mode it shows the neutral title instead.
export function Logo({ size = 'md', className, linked = true, descriptor, onDark }: LogoProps) {
  const { hiddenMode, hiddenTitle } = usePrivacy();
  const t = useT();
  const px = TILE[size];

  const content = hiddenMode ? (
    <span className={clsx('inline-flex items-center gap-2.5 min-w-0', className)}>
      <span className={clsx('shrink-0 rounded-xl flex items-center justify-center', onDark ? 'bg-white/10 text-white/80' : 'bg-surface-2 text-ink-2')} style={{ width: px, height: px }}>
        <LayoutGrid size={Math.round(px * 0.5)} aria-hidden="true" />
      </span>
      <span className={clsx('font-semibold truncate', onDark ? 'text-white' : 'text-ink', size === 'lg' ? 'text-2xl' : 'text-base')}>{hiddenTitle}</span>
    </span>
  ) : (
    // data-brand: hidden by CSS before hydration when Hidden Mode is saved (see layout.tsx).
    <span data-brand className={clsx('inline-flex items-center gap-2 min-w-0', className)}>
      <BrandMark size={px} tone={onDark ? 'onDark' : 'auto'} />
      <span className="flex flex-col min-w-0">
        {/* The lockup's own colours: Zen in cobalt blue, Fuel in turquoise (top-to-bottom gradients). */}
        <span className={clsx('font-display font-extrabold tracking-[-0.035em] leading-none', TEXT[size])}>
          <span className="bg-gradient-to-b from-[#2187f4] to-[#1452d9] bg-clip-text text-transparent">Zen</span>
          <span className="bg-gradient-to-b from-[#00cbb9] to-[#079ea8] bg-clip-text text-transparent">Fuel</span>
        </span>
        {descriptor && (
          <span className={clsx('brand-tagline mt-1 font-semibold uppercase leading-none truncate', TAGLINE[size], onDark ? 'text-[#a7c0d6]' : 'text-[#55768f] dark:text-[#a7c0d6]')}>
            {t('brand.tagline')}
          </span>
        )}
      </span>
    </span>
  );

  if (!linked) return content;

  return (
    <Link
      href="/"
      aria-label={t('brand.homeLabel', { name: hiddenMode ? hiddenTitle : 'ZenFuel' })}
      className="inline-flex min-w-0 shrink rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {content}
    </Link>
  );
}
