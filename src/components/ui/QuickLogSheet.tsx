'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { clsx } from 'clsx';

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastState { visible: boolean; habitName: string; icon: string }

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl shadow-2xl text-sm font-semibold">
        <span>{toast.icon}</span>
        <span>{toast.habitName} logged</span>
        <Check size={15} className="text-emerald-400" />
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
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    onLogged(habit.name, habit.icon);
    onClose();
    setLogging(null);
  }, [habits, logEntry, note, onLogged, onClose, logging]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-700 animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white">Quick Log</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg btn-ghost">
            <X size={16} />
          </button>
        </div>

        {/* Habit grid */}
        <div className="px-4 pb-2 grid grid-cols-4 gap-2">
          {topHabits.map(habit => (
            <button
              key={habit.id}
              onClick={() => handleLog(habit.id)}
              disabled={!!logging}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95',
                logging === habit.id
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5'
              )}
            >
              <span className="text-2xl leading-none">{habit.icon}</span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight truncate w-full">
                {habit.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Note field */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowNote(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-2"
          >
            <ChevronDown size={12} className={`transition-transform ${showNote ? 'rotate-180' : ''}`} />
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
              autoFocus
            />
          )}
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>
    </div>
  );
}

// ── Floating Action Button (exported entry point) ─────────────────────────────

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, habitName: '', icon: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogged = useCallback((habitName: string, icon: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, habitName, icon });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  return (
    <>
      <Toast toast={toast} />

      {/* FAB — sits above mobile bottom nav (h ~64px) and to the right */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'fixed z-40 right-5 bottom-24 lg:bottom-6',
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-gradient-to-br from-teal-500 to-emerald-600',
          'flex items-center justify-center',
          'transition-all hover:scale-110 active:scale-95',
          'shadow-teal-500/40 hover:shadow-teal-500/60',
          open ? 'rotate-45' : ''
        )}
        aria-label="Quick log a trigger"
      >
        <Plus size={26} className="text-white" strokeWidth={2.5} />
      </button>

      <QuickLogBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        onLogged={handleLogged}
      />
    </>
  );
}
