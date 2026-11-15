'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, History, Settings, MoreHorizontal, X, Home, Clock3, ListChecks,
  Trophy, Target, FileText, Lock, Sun, Moon, EyeOff, LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { Switch } from '@/components/ui/Switch';
import { Tone, IconTile } from '@/components/ui/Card';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Segmented } from '@/components/ui/Segmented';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyRevealButton } from './PrivacyRevealButton';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';

export interface NavItem { href: string; label: MessageKey; icon: LucideIcon; description: MessageKey; tone: Tone }

// Screen Time is one of ZenFuel's two core products, so it is a main tab everywhere. On the
// website the page explains that measuring needs the Android app.
export const SCREEN_TIME_LINK: NavItem = { href: '/screen-time', label: 'nav.screenTime', icon: Clock3, description: 'nav.screenTimeDesc', tone: 'blue' };

// Mobile bottom bar (the rest are under More).
const NAV: { href: string; label: MessageKey; icon: LucideIcon }[] = [
  { href: '/', label: 'nav.home', icon: Home },
  { href: SCREEN_TIME_LINK.href, label: SCREEN_TIME_LINK.label, icon: SCREEN_TIME_LINK.icon },
  { href: '/analytics', label: 'nav.analytics', icon: BarChart3 },
  { href: '/habits', label: 'nav.habits', icon: ListChecks },
];

// Survives page changes (each page mounts its own nav), so the pill can slide from the old tab.
let lastTab = -1;

export const MORE_LINKS: NavItem[] = [
  { href: '/history', label: 'nav.history', icon: History, description: 'nav.historyDesc', tone: 'pink' },
  { href: '/goals', label: 'nav.goals', icon: Target, description: 'nav.goalsDesc', tone: 'violet' },
  { href: '/challenges', label: 'nav.challenges', icon: Trophy, description: 'nav.challengesDesc', tone: 'orange' },
  { href: '/reports', label: 'nav.reports', icon: FileText, description: 'nav.reportsDesc', tone: 'cyan' },
  { href: '/settings', label: 'nav.settings', icon: Settings, description: 'nav.settingsDesc', tone: 'slate' },
];

export const INFO_LINKS: [MessageKey, string][] = [
  ['nav.freeBeta', '/upgrade'],
  ['nav.privacy', '/privacy'],
  ['nav.terms', '/terms'],
  ['nav.refund', '/refund'],
  ['nav.contact', '/contact'],
];

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme, pinEnabled, lock } = useApp();
  const { hiddenMode, setHiddenMode } = usePrivacy();
  const t = useT();
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
      <div className="absolute inset-0 bg-navy-950/60 fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-title"
        className="relative w-full max-h-[85dvh] overflow-y-auto bg-surface rounded-t-[28px] border-t border-line shadow-pop sheet-in pb-[calc(1rem+var(--sab))]"
      >
        <div className="flex justify-center pt-2.5" aria-hidden="true"><span className="w-10 h-1 rounded-full bg-line-strong" /></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-2">
          <h2 id="more-title" className="font-display text-lg font-semibold tracking-tight text-ink">{t('nav.more')}</h2>
          <button onClick={onClose} aria-label={t('nav.closeMenu')} className="p-2 rounded-xl btn-ghost min-w-[40px] min-h-[40px] flex items-center justify-center">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 space-y-5 rise">
          <nav aria-label={t('nav.morePages')}>
            <h3 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{t('nav.yourProgress')}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {MORE_LINKS.filter(l => l.href !== '/settings').map(({ href, label, icon: Icon, description, tone }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  className={clsx(
                    'flex flex-col gap-2.5 p-3.5 min-h-[104px] rounded-2xl border transition-[background-color,border-color,transform] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    pathname === href ? 'border-brand/50 bg-brand-soft' : 'border-line bg-surface-2/60 hover:border-line-strong'
                  )}
                >
                  <IconTile tone={tone} solid><Icon size={18} /></IconTile>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink leading-tight">{t(label)}</span>
                    <span className="block mt-0.5 text-xs text-muted leading-snug">{t(description)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          <ListGroup title={t('nav.app')}>
            <ListRow href="/settings" current={pathname === '/settings'} icon={<Settings size={19} />} tone="slate" title={t('nav.settings')} sub={t('nav.settingsDesc')} />
            <ListRow
              icon={<EyeOff size={19} />}
              tone="purple"
              title={t('privacy.hiddenMode')}
              sub={t('nav.hiddenModeSub')}
              trailing={<Switch checked={hiddenMode} onChange={setHiddenMode} label={t('privacy.hiddenMode')} />}
            />
            <div className="flex items-center gap-3.5 px-4 py-3 min-h-[64px]">
              <IconTile tone="yellow" size="lg">{theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}</IconTile>
              <span className="flex-1 min-w-0 text-[15px] font-semibold text-ink">{t('common.theme')}</span>
              <Segmented
                label={t('common.theme')}
                size="sm"
                className="w-[150px] shrink-0"
                value={theme === 'dark' ? 'dark' : 'light'}
                onChange={v => { if (v !== (theme === 'dark' ? 'dark' : 'light')) toggleTheme(); }}
                options={[{ value: 'light', label: t('common.light'), icon: <Sun size={14} aria-hidden="true" /> }, { value: 'dark', label: t('common.dark'), icon: <Moon size={14} aria-hidden="true" /> }]}
              />
            </div>
            {pinEnabled && (
              <ListRow onClick={() => { onClose(); lock(); }} icon={<Lock size={19} />} tone="green" title={t('nav.lockNow')} sub={t('nav.lockNowSub')} />
            )}
          </ListGroup>
        </div>

        <div className="mx-5 my-4 h-px bg-line" />

        <nav aria-label={t('nav.information')} className="px-5 flex flex-wrap gap-x-4 gap-y-2">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-muted hover:text-ink py-1">
              {t(label)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useRef(() => setMoreOpen(false)).current;
  const moreActive = MORE_LINKS.some(l => l.href === pathname);
  const current = moreActive ? NAV.length : NAV.findIndex(n => n.href === pathname);

  // Publish the dock's real height (safe area included) so page padding and the quick-log button
  // can sit exactly above it, even when large Android text sizes make the labels wrap.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--bottom-nav-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The pill starts on the previous tab and slides to the current one.
  const [pill, setPill] = useState(lastTab >= 0 ? lastTab : current);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPill(current));
    lastTab = current;
    return () => cancelAnimationFrame(raf);
  }, [current]);

  // Each tab is a full-height target; the active one sits on the sliding pill. Light: brand
  // (teal) on white. Dark: white on navy with a blue pill.
  const item = (active: boolean) => clsx(
    'relative z-10 min-w-0 flex flex-col items-center justify-center gap-1 min-h-[56px] px-0.5 py-1.5 rounded-[18px] text-[10.5px] leading-[1.1] tracking-[-0.01em] transition-[color,transform] duration-200 active:scale-[0.94]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-white/80',
    active
      ? 'text-brand-text dark:text-white font-semibold'
      : 'text-muted dark:text-white/70 font-medium hover:text-ink dark:hover:text-white'
  );

  return (
    <>
      {/* A full-width bar pinned to the bottom edge, with rounded upper corners and a soft shadow.
          It is opaque all the way down, through Android's navigation area (which the app draws
          behind), so nothing scrolls into view below the tabs. Its measured height, safe area
          included, sets every page's bottom padding (--bottom-nav-h). */}
      <nav
        ref={navRef}
        aria-label={t('nav.main')}
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 min-[380px]:px-3 pt-1.5 pb-[max(0.375rem,var(--sab))] rounded-t-[26px] bg-gradient-to-b from-surface to-surface-2 border-t border-line shadow-[0_-14px_34px_-20px_rgb(23_43_69/0.35)] dark:from-[#0d2c66] dark:to-[#0a2152] dark:border-white/10 dark:shadow-[0_-14px_34px_-18px_rgb(0_0_0/0.8)]"
      >
        <div className="relative mx-auto max-w-md grid grid-cols-5 items-stretch">
          <span
            className={clsx('absolute inset-y-0 left-0 w-1/5 px-1 transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]', pill < 0 && 'opacity-0')}
            style={{ transform: `translateX(${Math.max(0, pill) * 100}%)` }}
            aria-hidden="true"
          >
            <span className="relative block h-full rounded-[18px] bg-brand-soft ring-1 ring-inset ring-brand/15 dark:bg-gradient-to-b dark:from-blue-500 dark:to-blue-600 dark:ring-white/20 dark:shadow-glow">
              {/* Light mode: a short brand bar along the top edge of the active tab. */}
              <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-9 h-[3px] rounded-b-full bg-brand-gradient dark:hidden" />
            </span>
          </span>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={item(active)}
              >
                <Icon size={21} strokeWidth={active ? 2.2 : 1.8} className={clsx('transition-transform duration-300', active && '-translate-y-px')} aria-hidden="true" />
                <span className="max-w-full text-center whitespace-normal">{t(label)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={item(moreActive)}
          >
            <MoreHorizontal size={21} strokeWidth={moreActive ? 2.2 : 1.8} aria-hidden="true" />
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}

// Each page shows its own title, so the bar only carries the brand (logo, wordmark and tagline)
// and the privacy control.
export function TopBar(_props: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-surface/[0.97] dark:bg-bg/[0.97] border-b border-line/80 pt-[var(--sat)]">
      <div className="flex items-center justify-between gap-3 px-4 h-[60px]">
        <Logo size="md" descriptor />
        <div className="flex items-center gap-2 min-w-0">
          <PrivacyRevealButton compact />
        </div>
      </div>
    </header>
  );
}
