'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { clsx } from 'clsx';

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastState { visible: boolean; habitName: string; icon: string }

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;
  return (
    <div role="status" className="fixed top-[calc(1rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-ink text-surface rounded-full shadow-pop text-sm font-medium">
        <span>{toast.icon}</span>
        <span>{toast.habitName} logged</span>
        <Check size={15} className="text-emerald-400 dark:text-emerald-600" aria-hidden="true" />
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
  const { habitName, habitIcon } = usePrivacy();
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
    onLogged(habitName(habit), habitIcon(habit));
    onClose();
    setLogging(null);
  }, [habits, logEntry, note, onLogged, onClose, logging, habitName, habitIcon]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
        className="relative w-full max-w-lg max-h-[85dvh] overflow-y-auto bg-surface rounded-t-3xl sm:rounded-3xl sm:mb-6 shadow-pop border border-line animate-slide-up pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-10 h-1 bg-line-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <h3 id="quick-log-title" className="text-base font-semibold text-ink">Quick log</h3>
            <p className="text-xs text-muted">Tap a habit to log it now</p>
          </div>
          <button onClick={onClose} aria-label="Close quick log" className="p-2 rounded-lg btn-ghost">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Habit grid */}
        <div className="px-4 pb-2 grid grid-cols-4 gap-2" role="group" aria-label="Habits">
          {topHabits.map(habit => (
            <button
              key={habit.id}
              onClick={() => handleLog(habit.id)}
              disabled={!!logging}
              aria-label={`Log ${habitName(habit)}`}
              className={clsx(
                'flex flex-col items-center justify-center gap-1.5 min-h-[76px] p-2 rounded-2xl border transition-colors active:scale-[0.97]',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30',
                logging === habit.id
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-transparent bg-surface-2 hover:border-blue-400/60'
              )}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{habitIcon(habit)}</span>
              <span className="text-[11px] font-medium text-ink-2 text-center leading-tight line-clamp-2 w-full" aria-hidden="true">
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
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-2 py-1"
          >
            <ChevronDown size={12} className={`transition-transform ${showNote ? 'rotate-180' : ''}`} aria-hidden="true" />
            {showNote ? 'Hide note' : 'Add a note (optional)'}
          </button>
          {showNote && (
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What triggered this? (optional)"
              className="input text-sm"
              maxLength={100}
              aria-label="Note"
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

  const handleLogged = useCallback((habitName: string, icon: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, habitName, icon });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  return (
    <>
      <Toast toast={toast} />

      {/* FAB — sits above the mobile bottom nav (60 px plus the home-indicator inset) */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'fixed z-40 right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:right-6',
          'w-14 h-14 rounded-2xl shadow-pop',
          'bg-brand hover:bg-brand-strong',
          'flex items-center justify-center',
          'transition-[transform,background-color,opacity] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50',
          open ? 'rotate-45' : '',
          inlineLogVisible && !open ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
        )}
        aria-label="Quick log"
        aria-hidden={inlineLogVisible && !open ? true : undefined}
        tabIndex={inlineLogVisible && !open ? -1 : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Plus size={26} className="text-white" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <QuickLogBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        onLogged={handleLogged}
      />
    </>
  );
}
