'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, History, FileText, Settings,
  Lock, Target, Trophy, Zap, Crown, LucideIcon, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { MONETIZATION_UI_ENABLED } from '@/utils/subscription';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyRevealButton } from './PrivacyRevealButton';
import { INFO_LINKS } from './Navbar';

const NAV_PRIMARY: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/habits', label: 'Habits', icon: Zap },
  { href: '/history', label: 'History', icon: History },
];

const NAV_SECONDARY: { href: string; label: string; icon: LucideIcon; premium?: boolean }[] = [
  { href: '/challenges', label: 'Challenges', icon: Trophy },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({ href, label, icon: Icon, premium }: { href: string; label: string; icon: LucideIcon; premium?: boolean }) {
  const pathname = usePathname();
  const { isPremium: hasPremium } = useApp();
  const active = pathname === href;
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={active ? 'nav-link-active' : 'nav-link'}>
      <Icon size={17} aria-hidden="true" />
      {label}
      {premium && !hasPremium && <Crown size={11} className="ml-auto text-amber-400" />}
    </Link>
  );
}

export function Sidebar() {
  const { detoxScore, analytics, pinEnabled, lock, isPremium, subscription, trialDaysLeft } = useApp();
  const { discreet } = usePrivacy();

  const scoreColor =
    detoxScore.score >= 80 ? 'bg-emerald-500' :
    detoxScore.score >= 60 ? 'bg-sky-500' :
    detoxScore.score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface border-r border-line">
      <div className="px-5 h-16 flex items-center">
        <div className="flex items-center justify-between gap-2 w-full">
          <Logo size="md" />
          {MONETIZATION_UI_ENABLED && <PlanBadge plan={subscription.plan} size="xs" />}
        </div>
      </div>

      {/* Trial banner — future paid plans only */}
      {MONETIZATION_UI_ENABLED && subscription.status === 'trial' && trialDaysLeft !== null && (
        <div className="mx-3 mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">⚡ Trial — {trialDaysLeft}d left</p>
          <Link href="/upgrade" className="text-[10px] text-blue-500 hover:underline">Upgrade now →</Link>
        </div>
      )}

      <div className="px-3 pt-3 empty:hidden"><PrivacyRevealButton /></div>

      <nav aria-label="Main" className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_PRIMARY.map(n => <NavLink key={n.href} {...n} />)}
        </div>
        <p className="eyebrow px-3 mb-1.5 mt-6">Tools</p>
        <div className="space-y-0.5">
          {NAV_SECONDARY.map(n => <NavLink key={n.href} {...n} />)}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-line space-y-3">
        {/* Score summary */}
        <div className="px-3 py-3 rounded-xl bg-surface-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">{discreet('Detox score', 'Score')}</p>
            <p className="text-xl font-semibold tabular-nums text-ink flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${scoreColor}`} aria-hidden="true" />
              {detoxScore.score}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">Events</p>
            <p className="text-sm font-semibold tabular-nums text-ink-2">{analytics.lifetimeCount}</p>
          </div>
        </div>

        {/* Upgrade to Premium entry point — future paid plans only */}
        {MONETIZATION_UI_ENABLED && !isPremium && (
          <Link href="/upgrade" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all">
            <Crown size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-none">Upgrade to Premium</p>
              <p className="text-[10px] text-white/70 mt-0.5">Unlock all features</p>
            </div>
            <Sparkles size={12} className="text-white/70" />
          </Link>
        )}

        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          {pinEnabled && (
            <button onClick={lock} className="btn-ghost p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title="Lock now" aria-label="Lock now">
              <Lock size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Legal links */}
        <nav aria-label="Information" className="flex flex-wrap gap-x-3 gap-y-1 px-1 pt-1">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-[11px] text-muted hover:text-ink transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
