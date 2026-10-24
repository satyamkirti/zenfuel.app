'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, Clock, CheckCircle2, Brain } from 'lucide-react';
import {
  RiskAssessment, RiskLevel, RISK_PALETTE, RISK_LEVEL_ORDER, DISMISS_STORAGE_KEY,
} from '@/lib/risk-calculator';
import { clsx } from 'clsx';
import { usePrivacy } from '@/context/PrivacyContext';

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
  const { maskText } = usePrivacy();
  const { level, timerMinutes } = assessment;
  const title = maskText(assessment.title);
  const message = maskText(assessment.message);
  const suggestion = maskText(assessment.suggestion);
  const triggers = assessment.triggers.map(maskText);
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

  return (
    <div
      role="alert"
      className={clsx('relative rounded-2xl border p-4 sm:p-5 animate-fade-in', palette.bg, palette.border)}
    >
      <div className="flex items-start gap-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', palette.accent)}>
          {level === 'critical' || level === 'high'
            ? <AlertTriangle size={18} className="text-white" aria-hidden="true" />
            : <Brain size={18} className="text-white" aria-hidden="true" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap pr-8">
            <h3 className={clsx('font-semibold text-sm leading-tight', palette.text)}>{title}</h3>
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md', palette.accent, 'text-white')}>
              {LEVEL_LABELS[level]} risk
            </span>
          </div>

          <p className={clsx('text-sm leading-relaxed mt-1', palette.muted)}>{message}</p>
          <p className={clsx('text-sm leading-relaxed mt-1.5 font-medium', palette.text)}>{suggestion}</p>

          {triggers.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className={clsx('mt-2 text-xs font-medium underline underline-offset-2 decoration-current/40 hover:decoration-current transition-colors py-1', palette.muted)}
            >
              {expanded ? 'Hide risk factors' : `${triggers.length} risk factor${triggers.length > 1 ? 's' : ''}`}
            </button>
          )}
          {expanded && (
            <ul className="mt-1 space-y-0.5">
              {triggers.map((t, i) => (
                <li key={i} className={clsx('text-xs flex items-center gap-1.5', palette.muted)}>
                  <span className="w-1 h-1 rounded-full shrink-0 inline-block bg-current" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {timerDone ? (
              <div role="status" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={13} aria-hidden="true" />
                Time&apos;s up — well done.
              </div>
            ) : timerRunning ? (
              <>
                <div role="timer" aria-live="off" className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold tabular-nums', palette.accent, 'text-white')}>
                  <Clock size={13} aria-hidden="true" />
                  {formatTime(timerSecs)}
                </div>
                <button
                  onClick={handleStopTimer}
                  className={clsx('min-h-[36px] px-3 rounded-xl text-xs font-medium border bg-surface/60 transition-colors hover:bg-surface', palette.border, palette.text)}
                >
                  Cancel timer
                </button>
              </>
            ) : (
              <button
                onClick={handleStartTimer}
                className={clsx(
                  'flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-xl text-xs font-semibold transition-colors',
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : clsx('border bg-surface/70 hover:bg-surface', palette.border, palette.text)
                )}
              >
                <Clock size={13} aria-hidden="true" />
                Start a {timerMinutes}-minute break
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={clsx('absolute top-3 right-3 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10', palette.muted)}
          aria-label="Dismiss alert"
          title="Dismiss"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
