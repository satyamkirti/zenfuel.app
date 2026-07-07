'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, Clock, CheckCircle2, Brain } from 'lucide-react';
import {
  RiskAssessment, RiskLevel, RISK_PALETTE, RISK_LEVEL_ORDER, DISMISS_STORAGE_KEY,
} from '@/lib/risk-calculator';
import { clsx } from 'clsx';

// ── Dismiss helpers ────────────────────────────────────────────────────────────

function getDismissedLevel(): RiskLevel | null {
  if (typeof window === 'undefined') return null;
  try { return (localStorage.getItem(DISMISS_STORAGE_KEY) as RiskLevel) ?? null; } catch { return null; }
}

function saveDismissedLevel(level: RiskLevel) {
  try { localStorage.setItem(DISMISS_STORAGE_KEY, level); } catch {}
}

function shouldShowAlert(current: RiskLevel, dismissed: RiskLevel | null): boolean {
  if (current === 'low') return false;
  if (!dismissed) return true;
  return RISK_LEVEL_ORDER[current] > RISK_LEVEL_ORDER[dismissed];
}

// ── Timer display ──────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RiskAlertProps {
  assessment: RiskAssessment;
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

export function RiskAlert({ assessment }: RiskAlertProps) {
  const { level, title, message, suggestion, triggers, timerMinutes } = assessment;
  const palette = RISK_PALETTE[level];

  const [visible, setVisible] = useState(false);
  const [timerSecs, setTimerSecs] = useState(timerMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Decide visibility based on dismissed level
  useEffect(() => {
    const dismissed = getDismissedLevel();
    setVisible(shouldShowAlert(level, dismissed));
    // Reset timer state when risk level changes
    setTimerSecs(timerMinutes * 60);
    setTimerRunning(false);
    setTimerDone(false);
  }, [level, timerMinutes]);

  // Countdown
  useEffect(() => {
    if (!timerRunning) return;
    intervalRef.current = setInterval(() => {
      setTimerSecs(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerRunning(false);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const handleDismiss = useCallback(() => {
    saveDismissedLevel(level);
    setVisible(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [level]);

  const handleStartTimer = useCallback(() => {
    setTimerSecs(timerMinutes * 60);
    setTimerRunning(true);
    setTimerDone(false);
  }, [timerMinutes]);

  const handleStopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerSecs(timerMinutes * 60);
  }, [timerMinutes]);

  if (!visible) return null;

  const isCritical = level === 'critical';
  const isHigh = level === 'high';

  return (
    <div
      role="alert"
      className={clsx(
        'relative rounded-2xl border-2 p-4 animate-slide-up shadow-lg',
        palette.bg, palette.border
      )}
    >
      {/* Level pill */}
      <div className="flex items-start gap-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', palette.accent)}>
          {level === 'critical' || level === 'high'
            ? <AlertTriangle size={18} className="text-white" />
            : <Brain size={18} className="text-white" />
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={clsx('font-bold text-sm leading-tight', palette.text)}>{title}</h3>
            <span className={clsx('text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full', palette.accent, 'text-white')}>
              {LEVEL_LABELS[level]}
            </span>
          </div>

          {/* Message */}
          <p className={clsx('text-sm leading-snug mb-2', palette.muted)}>{message}</p>

          {/* Suggestion */}
          <div className={clsx('flex items-start gap-2 p-2.5 rounded-xl border', palette.border, 'bg-white/50 dark:bg-black/10')}>
            <span className="text-base leading-none mt-0.5">💡</span>
            <p className={clsx('text-xs leading-snug', palette.muted)}>{suggestion}</p>
          </div>

          {/* Triggers (expandable) */}
          {triggers.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className={clsx('mt-2 text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity', palette.muted)}
            >
              {expanded ? 'Hide' : `${triggers.length} risk factor${triggers.length > 1 ? 's' : ''} detected`}
            </button>
          )}
          {expanded && (
            <ul className="mt-1.5 space-y-0.5">
              {triggers.map((t, i) => (
                <li key={i} className={clsx('text-xs flex items-center gap-1.5', palette.muted)}>
                  <span className="w-1 h-1 rounded-full shrink-0 inline-block" style={{ background: 'currentColor' }} />
                  {t}
                </li>
              ))}
            </ul>
          )}

          {/* Timer section */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {timerDone ? (
              <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold', 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300')}>
                <CheckCircle2 size={13} />
                Time's up — well done. Ready to continue.
              </div>
            ) : timerRunning ? (
              <div className="flex items-center gap-2">
                <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black tabular-nums', palette.accent, 'text-white')}>
                  <Clock size={13} />
                  {formatTime(timerSecs)}
                </div>
                <button
                  onClick={handleStopTimer}
                  className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors', palette.border, palette.muted, 'hover:bg-white/30 dark:hover:bg-black/20')}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartTimer}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95',
                  isCritical ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20'
                    : isHigh ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                )}
              >
                <Clock size={12} />
                Start {timerMinutes} min break timer
              </button>
            )}

            <button
              onClick={handleDismiss}
              className={clsx('px-3 py-2 rounded-xl text-xs font-medium border transition-colors ml-auto', palette.border, palette.muted, 'hover:bg-white/40 dark:hover:bg-black/20')}
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={clsx('p-1 rounded-lg transition-colors shrink-0', palette.muted, 'hover:bg-white/40 dark:hover:bg-black/20')}
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
