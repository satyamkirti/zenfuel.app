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
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { Logo } from '@/components/ui/Logo';

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
    <Link href={href} className={active ? 'nav-link-active' : 'nav-link'}>
      <Icon size={17} />
      {label}
      {premium && !hasPremium && <Crown size={11} className="ml-auto text-amber-400" />}
    </Link>
  );
}

export function Sidebar() {
  const { detoxScore, analytics, pinEnabled, lock, isPremium, subscription, trialDaysLeft } = useApp();

  const scoreColor =
    detoxScore.score >= 80 ? 'text-emerald-500' :
    detoxScore.score >= 60 ? 'text-blue-500' :
    detoxScore.score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <Logo size="md" />
          <PlanBadge plan={subscription.plan} size="xs" />
        </div>
      </div>

      {/* Trial banner */}
      {subscription.status === 'trial' && trialDaysLeft !== null && (
        <div className="mx-3 mt-3 px-3 py-2 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">⚡ Trial — {trialDaysLeft}d left</p>
          <Link href="/upgrade" className="text-[10px] text-violet-500 hover:underline">Upgrade now →</Link>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5 mb-4">
          {NAV_PRIMARY.map(n => <NavLink key={n.href} {...n} />)}
        </div>
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-1 mt-4">Tools</p>
        <div className="space-y-0.5">
          {NAV_SECONDARY.map(n => <NavLink key={n.href} {...n} />)}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* Score card */}
        <div className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Detox Score</p>
            <p className={`text-xl font-bold ${scoreColor}`}>{detoxScore.score}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Events</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{analytics.lifetimeCount}</p>
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {!isPremium && (
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
            <button onClick={lock} className="btn-ghost p-2 rounded-lg" title="Lock app">
              <Lock size={15} />
            </button>
          )}
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pt-1">
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Refund', '/refund'], ['Contact', '/contact']].map(([label, href]) => (
            <Link key={href} href={href} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
