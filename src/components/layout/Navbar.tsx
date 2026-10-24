'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, History, Zap, Settings, MoreHorizontal, X,
  Trophy, Target, FileText, Lock, Sun, Moon, EyeOff, LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { Switch } from '@/components/ui/Switch';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyRevealButton } from './PrivacyRevealButton';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/habits', label: 'Habits', icon: Zap },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const MORE_LINKS: { href: string; label: string; icon: LucideIcon; description: string }[] = [
  { href: '/challenges', label: 'Challenges', icon: Trophy, description: 'Built-in and custom challenges' },
  { href: '/goals', label: 'Goals', icon: Target, description: 'Targets and progress' },
  { href: '/reports', label: 'Reports', icon: FileText, description: 'Monthly, quarterly and annual' },
];

export const INFO_LINKS: [string, string][] = [
  ['Free beta', '/upgrade'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Refund', '/refund'],
  ['Contact', '/contact'],
];

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme, pinEnabled, lock } = useApp();
  const { hiddenMode, setHiddenMode } = usePrivacy();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Keep keyboard focus inside the sheet.
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>('a, button');
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, onClose]);

  // Close after navigating.
  useEffect(() => { onClose(); }, [pathname, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-title"
        className="relative w-full max-h-[85dvh] overflow-y-auto bg-surface rounded-t-3xl border-t border-line shadow-pop animate-slide-up pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex justify-center pt-2.5" aria-hidden="true"><span className="w-10 h-1 rounded-full bg-line-strong" /></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-2">
          <h2 id="more-title" className="text-base font-semibold text-ink">More</h2>
          <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-lg btn-ghost min-w-[40px] min-h-[40px] flex items-center justify-center">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="More pages" className="px-3 space-y-1">
          {MORE_LINKS.map(({ href, label, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                pathname === href ? 'bg-violet-600/10 text-brand-text' : 'hover:bg-surface-2 text-ink'
              )}
            >
              <span className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0"><Icon size={18} aria-hidden="true" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted">{description}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="mx-5 my-3 h-px bg-line" />

        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-ink-2">
              <EyeOff size={16} aria-hidden="true" /> Hidden Mode
            </span>
            <Switch checked={hiddenMode} onChange={setHiddenMode} label="Hidden Mode" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleTheme} className="inline-flex items-center gap-2 px-3.5 rounded-xl bg-surface-2 hover:bg-line text-sm font-medium text-ink-2 min-h-[44px] transition-colors">
              {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            {pinEnabled && (
              <button onClick={() => { onClose(); lock(); }} className="inline-flex items-center gap-2 px-3.5 rounded-xl bg-surface-2 hover:bg-line text-sm font-medium text-ink-2 min-h-[44px] transition-colors">
                <Lock size={15} aria-hidden="true" /> Lock now
              </button>
            )}
          </div>
        </div>

        <div className="mx-5 my-3 h-px bg-line" />

        <nav aria-label="Information" className="px-5 flex flex-wrap gap-x-4 gap-y-2">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-muted hover:text-ink py-1">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useRef(() => setMoreOpen(false)).current;
  const moreActive = MORE_LINKS.some(l => l.href === pathname);

  const item = 'group flex-1 min-w-0 flex flex-col items-center justify-center gap-1 min-h-[60px] text-[11px] font-medium transition-colors focus:outline-none';
  const pill = (active: boolean) => clsx(
    'flex items-center justify-center w-12 h-7 rounded-full transition-colors',
    active ? 'bg-violet-600/10 dark:bg-violet-400/15' : 'group-hover:bg-surface-2 group-focus-visible:bg-surface-2 group-focus-visible:ring-2 group-focus-visible:ring-violet-500'
  );

  return (
    <>
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="flex px-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx(item, active ? 'text-brand-text' : 'text-muted hover:text-ink')}
              >
                <span className={pill(active)}><Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" /></span>
                <span className={clsx('truncate max-w-full px-0.5', active && 'font-semibold')}>{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={clsx(item, moreActive ? 'text-brand-text' : 'text-muted hover:text-ink')}
          >
            <span className={pill(moreActive)}><MoreHorizontal size={20} aria-hidden="true" /></span>
            <span className={clsx(moreActive && 'font-semibold')}>More</span>
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 h-[52px]">
        <Logo size="sm" />
        <div className="flex items-center gap-2 min-w-0">
          {title && title !== 'Dashboard' && (
            <span className="text-sm font-medium text-ink-2 truncate">{title}</span>
          )}
          <PrivacyRevealButton compact />
        </div>
      </div>
    </header>
  );
}
