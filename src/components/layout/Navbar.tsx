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
        className="relative w-full max-h-[85dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-slide-up pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id="more-title" className="font-bold text-slate-900 dark:text-white">More</h2>
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
                pathname === href ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              )}
            >
              <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Icon size={18} aria-hidden="true" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="mx-5 my-3 h-px bg-slate-200 dark:bg-slate-700" />

        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <EyeOff size={16} aria-hidden="true" /> Hidden Mode
            </span>
            <Switch checked={hiddenMode} onChange={setHiddenMode} label="Hidden Mode" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleTheme} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 min-h-[40px]">
              {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            {pinEnabled && (
              <button onClick={() => { onClose(); lock(); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 min-h-[40px]">
                <Lock size={15} aria-hidden="true" /> Lock now
              </button>
            )}
          </div>
        </div>

        <div className="mx-5 my-3 h-px bg-slate-200 dark:bg-slate-700" />

        <nav aria-label="Information" className="px-5 flex flex-wrap gap-x-4 gap-y-2">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1">
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

  const item = 'flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[10px] font-medium transition-colors focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800';

  return (
    <>
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx(item, active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="truncate max-w-full px-0.5">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={clsx(item, moreActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 h-12">
        <Logo size="sm" />
        <div className="flex items-center gap-2 min-w-0">
          {title && title !== 'Dashboard' && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</span>
          )}
          <PrivacyRevealButton compact />
        </div>
      </div>
    </header>
  );
}
