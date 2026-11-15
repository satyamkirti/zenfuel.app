'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { clsx } from 'clsx';
import { checkinWording } from '@/components/dashboard/checkinLabels';
import { HabitGlyph } from '@/components/dashboard/HabitGlyph';
import { useT } from '@/i18n/I18nProvider';

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastState { visible: boolean; habitName: string; icon: string }

function Toast({ toast }: { toast: ToastState }) {
  const t = useT();
  if (!toast.visible) return null;
  return (
    <div role="status" className="fixed top-[calc(1rem+var(--sat))] inset-x-0 flex justify-center z-[100] pointer-events-none toast-in">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-ink text-surface rounded-full shadow-pop text-sm font-medium">
        <span>{t('sheet.tracked', { name: toast.habitName })}</span>
        <span className="pop-in w-5 h-5 rounded-full bg-good text-white dark:text-charcoal-950 flex items-center justify-center"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
      </div>
    </div>
  );
}

// ── Bottom Sheet ───────────────────────────────────────────────────────────────

interface SheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: (habitName: string, icon: string) => void;
}

function QuickLogBottomSheet({ open, onClose, onLogged }: SheetProps) {
  const { habits, habitAnalytics, logEntry } = useApp();
  const { habitName, habitIcon, masked } = usePrivacy();
  const t = useT();
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Top habits by total count
  const topHabits = [...habits]
    .sort((a, b) => {
      const aCount = habitAnalytics.find(h => h.habitId === a.id)?.lifetimeCount ?? 0;
      const bCount = habitAnalytics.find(h => h.habitId === b.id)?.lifetimeCount ?? 0;
      return bCount - aCount;
    })
    .slice(0, 8);

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>('button')?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, onClose]);

  // Reset state when closed
  useEffect(() => {
    if (!open) { setNote(''); setShowNote(false); setLogging(null); }
  }, [open]);

  const handleLog = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || logging) return;
    setLogging(habitId);
    logEntry(habitId, note || undefined);
    onLogged(checkinWording(habit, habitName(habit), masked).noun, habitIcon(habit));
    onClose();
    setLogging(null);
  }, [habits, logEntry, note, onLogged, onClose, logging, habitName, habitIcon, masked]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal-950/70 fade-in pointer-events-none" aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
        className="relative w-full max-w-lg max-h-[85dvh] overflow-y-auto bg-surface rounded-t-3xl sm:rounded-3xl sm:mb-6 shadow-pop border border-line sheet-in pb-[calc(1rem+var(--sab))]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-10 h-1 bg-line-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <h3 id="quick-log-title" className="font-display text-lg font-semibold tracking-tight text-ink">{t('sheet.title')}</h3>
            <p className="text-sm text-muted">{t('sheet.body')}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="p-2 rounded-lg btn-ghost">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Habit grid */}
        <div className="px-4 pb-2 grid grid-cols-4 gap-2" role="group" aria-label={t('sheet.habits')}>
          {topHabits.map(habit => (
            <button
              key={habit.id}
              onClick={() => handleLog(habit.id)}
              disabled={!!logging}
              aria-label={checkinWording(habit, habitName(habit), masked).action}
              className={clsx(
                'flex flex-col items-center justify-center gap-1.5 min-h-[76px] p-2 rounded-2xl border transition-colors active:scale-[0.97]',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
                logging === habit.id
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-line bg-surface hover:border-brand/60 hover:bg-brand-soft'
              )}
            >
              <span className="w-10 h-10 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center" aria-hidden="true"><HabitGlyph habit={habit} size={22} /></span>
              <span className="text-xs font-medium text-ink-2 text-center leading-tight line-clamp-2 w-full" aria-hidden="true">
                {habitName(habit)}
              </span>
            </button>
          ))}
        </div>

        {/* Note field */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowNote(v => !v)}
            aria-expanded={showNote}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-2 py-1.5"
          >
            <ChevronDown size={12} className={`transition-transform ${showNote ? 'rotate-180' : ''}`} aria-hidden="true" />
            {showNote ? t('sheet.hideNote') : t('sheet.addNote')}
          </button>
          {showNote && (
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('sheet.notePlaceholder')}
              className="input text-sm"
              maxLength={100}
              aria-label={t('quicklog.note')}
              autoFocus
            />
          )}
        </div>

      </div>
    </div>
  );
}

// ── Floating Action Button (exported entry point) ─────────────────────────────

export function FloatingActionButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, habitName: '', icon: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hidden while an on-page quick-log card (data-fab-hide) is visible, so the two never overlap.
  const [inlineLogVisible, setInlineLogVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-fab-hide]'));
    if (targets.length === 0 || !('IntersectionObserver' in window)) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver(items => {
      items.forEach(i => (i.isIntersecting ? visible.add(i.target) : visible.delete(i.target)));
      setInlineLogVisible(visible.size > 0);
    }, { threshold: 0.15 });
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);

  // Tucked away while scrolling down so it never sits on top of what is being read; it comes back
  // on scrolling up or near the top of the page.
  const [scrolledAway, setScrolledAway] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const nearEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 24;
        if (y < 80 || y < last - 6 || nearEnd) setScrolledAway(false);
        else if (y > last + 6) setScrolledAway(true);
        last = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const tucked = (inlineLogVisible || scrolledAway) && !open;

  const handleLogged = useCallback((habitName: string, icon: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, habitName, icon });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  return (
    <>
      <Toast toast={toast} />

      {/* FAB: --fab-gap above the bottom bar, using the bar's measured height (safe area included). */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'fixed z-40 right-4 bottom-[calc(var(--bottom-nav-h,var(--bottom-nav-fallback))+var(--fab-gap))] lg:bottom-6 lg:right-6',
          'w-[var(--fab-size)] h-[var(--fab-size)] rounded-[20px] shadow-glow ring-4 ring-bg',
          'bg-brand-gradient hover:bg-brand-gradient-hover',
          'flex items-center justify-center',
          'transition-[transform,background-color,opacity] duration-300 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/50',
          open ? 'rotate-45' : '',
          tucked ? 'opacity-0 pointer-events-none translate-y-3 scale-90' : 'opacity-100'
        )}
        aria-label={t('sheet.fab')}
        aria-hidden={tucked ? true : undefined}
        tabIndex={tucked ? -1 : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Plus size={26} className="text-on-brand" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <QuickLogBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        onLogged={handleLogged}
      />
    </>
  );
}
