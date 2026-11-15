'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, History, FileText, Settings,
  Lock, Target, Trophy, Zap, Crown, LucideIcon, Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { MONETIZATION_UI_ENABLED } from '@/utils/subscription';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyRevealButton } from './PrivacyRevealButton';
import { INFO_LINKS, SCREEN_TIME_LINK } from './Navbar';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';

// `color`: the feature's icon colour on the navy panel (its FEATURE_TONE, lightened for contrast).
type Item = { href: string; label: MessageKey; icon: LucideIcon; color: string; premium?: boolean };

// Grouped by what people come to do: track (both core products), understand, plan.
const GROUPS: { label: MessageKey; items: Item[] }[] = [
  {
    label: 'nav.groupTrack',
    items: [
      { href: '/', label: 'nav.home', icon: LayoutDashboard, color: 'text-sky-300' },
      { href: SCREEN_TIME_LINK.href, label: SCREEN_TIME_LINK.label, icon: SCREEN_TIME_LINK.icon, color: 'text-cyan-300' },
      { href: '/habits', label: 'nav.habits', icon: Zap, color: 'text-teal-300' },
      { href: '/history', label: 'nav.history', icon: History, color: 'text-pink-300' },
    ],
  },
  {
    label: 'nav.groupInsights',
    items: [
      { href: '/analytics', label: 'nav.analytics', icon: BarChart3, color: 'text-purple-300' },
      { href: '/reports', label: 'nav.reports', icon: FileText, color: 'text-cyan-300' },
    ],
  },
  {
    label: 'nav.groupPlan',
    items: [
      { href: '/goals', label: 'nav.goals', icon: Target, color: 'text-violet-300' },
      { href: '/challenges', label: 'nav.challenges', icon: Trophy, color: 'text-orange-300' },
      { href: '/settings', label: 'nav.settings', icon: Settings, color: 'text-slate-300' },
    ],
  },
];

function NavLink({ href, label, icon: Icon, color, premium }: Item) {
  const pathname = usePathname();
  const { isPremium: hasPremium } = useApp();
  const t = useT();
  const active = pathname === href;
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={active ? 'nav-link-active' : 'nav-link'}>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.9} className={active ? 'text-white' : color} aria-hidden="true" />
      {t(label)}
      {premium && !hasPremium && <Crown size={11} className="ml-auto text-amber-400" />}
    </Link>
  );
}

// Deep navy-blue panel in both themes (a deeper night blue in dark mode): it frames the content
// and carries the brand.
export function Sidebar() {
  const { detoxScore, analytics, pinEnabled, lock, isPremium, subscription, trialDaysLeft } = useApp();
  const { discreet } = usePrivacy();
  const t = useT();
  const hasScore = detoxScore.label !== 'Not enough data yet';

  const scoreColor =
    detoxScore.score >= 80 ? 'bg-green-400' :
    detoxScore.score >= 60 ? 'bg-sky-300' :
    detoxScore.score >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <aside className="hidden lg:flex flex-col w-[264px] shrink-0 h-screen sticky top-0 bg-sidebar-gradient dark:bg-sidebar-gradient-night text-white/90 border-r border-white/10 overflow-hidden">

      <div className="relative pl-4 pr-3 h-[76px] flex items-center">
        <div className="flex items-center justify-between gap-2 w-full">
          <Logo size="md" descriptor onDark />
          {MONETIZATION_UI_ENABLED && <PlanBadge plan={subscription.plan} size="xs" />}
        </div>
      </div>

      {/* Trial banner — future paid plans only */}
      {MONETIZATION_UI_ENABLED && subscription.status === 'trial' && trialDaysLeft !== null && (
        <div className="relative mx-3 mt-1 px-3 py-2 bg-white/10 border border-white/10 rounded-xl">
          <p className="text-xs font-semibold text-white">{t('nav.trialDaysLeft', { count: trialDaysLeft })}</p>
          <Link href="/upgrade" className="text-[10px] text-zen-200 hover:underline">{t('nav.upgradeNow')}</Link>
        </div>
      )}

      <div className="relative px-3 pt-1 empty:hidden"><PrivacyRevealButton onDark /></div>

      <nav aria-label={t('nav.main')} className="relative flex-1 px-3 py-2 overflow-y-auto">
        {GROUPS.map((g, i) => (
          <div key={g.label} className={i > 0 ? 'mt-5' : ''}>
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">{t(g.label)}</p>
            <div className="space-y-0.5">
              {g.items.map(n => <NavLink key={n.href} {...n} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative px-3 py-4 border-t border-white/10 space-y-3">
        {/* Score summary */}
        <div className="px-3.5 py-3 rounded-2xl bg-white/[0.08] ring-1 ring-white/15 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/60">{discreet(t('nav.detoxScore'), t('nav.score'))}</p>
            <p className="text-xl font-bold tabular-nums text-white flex items-center gap-1.5">
              {hasScore && <span className={`w-2 h-2 rounded-full ${scoreColor}`} aria-hidden="true" />}
              {hasScore ? detoxScore.score : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/60">{t('nav.tracked')}</p>
            <p className="text-sm font-semibold tabular-nums text-white/90">{analytics.lifetimeCount}</p>
          </div>
        </div>

        {/* Upgrade to Premium entry point — future paid plans only */}
        {MONETIZATION_UI_ENABLED && !isPremium && (
          <Link href="/upgrade" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-[transform,box-shadow,background-color,border-color,color,opacity]">
            <Crown size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-none">{t('nav.upgradePremium')}</p>
              <p className="text-[10px] text-white/70 mt-0.5">{t('nav.unlockAll')}</p>
            </div>
            <Sparkles size={12} className="text-white/70" />
          </Link>
        )}

        <div className="flex items-center justify-between">
          <ThemeToggle onDark />
          {pinEnabled && (
            <button onClick={lock} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-300" title={t('nav.lockNow')} aria-label={t('nav.lockNow')}>
              <Lock size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Legal links */}
        <nav aria-label={t('nav.information')} className="flex flex-wrap gap-x-3 gap-y-1 px-1 pt-1">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-[11px] text-white/55 hover:text-white transition-colors">
              {t(label)}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
