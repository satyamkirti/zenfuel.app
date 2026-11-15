import { LogEntry } from '@/types';
import { getStartOfDay } from '@/utils/dateUtils';

import { t } from '@/i18n/translate';
import { formatClock } from '@/i18n/format';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  low: 0, moderate: 1, high: 2, critical: 3,
};

export interface RiskAssessment {
  level: RiskLevel;
  title: string;
  message: string;
  suggestion: string;
  triggers: string[];
  isLateNight: boolean;
  timerMinutes: number;
  logsTodayCount: number;
}

export const RISK_PALETTE: Record<RiskLevel, {
  bg: string; border: string; text: string; muted: string; accent: string; dot: string;
}> = {
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-400/[0.07]',
    border: 'border-emerald-200 dark:border-emerald-400/25',
    text: 'text-emerald-900 dark:text-emerald-50',
    muted: 'text-emerald-800 dark:text-emerald-100/75',
    accent: 'bg-emerald-500',
    dot: '#22c77a',
  },
  moderate: {
    bg: 'bg-amber-50 dark:bg-amber-400/[0.07]',
    border: 'border-amber-200 dark:border-amber-400/25',
    text: 'text-amber-900 dark:text-amber-50',
    muted: 'text-amber-800 dark:text-amber-100/75',
    accent: 'bg-amber-500',
    dot: '#ffc83d',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-400/[0.08]',
    border: 'border-amber-300 dark:border-amber-400/30',
    text: 'text-amber-900 dark:text-amber-50',
    muted: 'text-amber-800 dark:text-amber-100/75',
    accent: 'bg-orange-500',
    dot: '#ffc83d',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-400/[0.08]',
    border: 'border-red-200 dark:border-red-400/30',
    text: 'text-red-900 dark:text-red-50',
    muted: 'text-red-800 dark:text-red-100/75',
    accent: 'bg-red-500',
    dot: '#ef5350',
  },
};

export function calculateRisk(
  dopamineScore: number,
  entries: LogEntry[],
  currentStreak: number
): RiskAssessment {
  const now = new Date();
  const todayStart = getStartOfDay(now).getTime();
  const oneHourAgo = now.getTime() - 3_600_000;
  const yesterdayStart = todayStart - 86_400_000;

  const logsToday  = entries.filter(e => e.timestamp >= todayStart);
  const logsLastHr = entries.filter(e => e.timestamp >= oneHourAgo);
  const logsYest   = entries.filter(e => e.timestamp >= yesterdayStart && e.timestamp < todayStart);

  const logsTodayCount = logsToday.length;
  const triggers: string[] = [];

  // ── Late night (12am–5am) ──────────────────────────────────────────────────
  const hasLateNightLog = logsToday.some(e => new Date(e.timestamp).getHours() < 5);
  const isLateNight = now.getHours() < 5 && logsTodayCount > 0;
  if (hasLateNightLog) triggers.push(t('riskmsg.trigLate'));

  // ── Same habit 3+ times in last hour ──────────────────────────────────────
  const habitCountsLastHr = new Map<string, number>();
  logsLastHr.forEach(e => habitCountsLastHr.set(e.habitId, (habitCountsLastHr.get(e.habitId) ?? 0) + 1));
  const maxSameHabitLastHr = habitCountsLastHr.size > 0 ? Math.max(...habitCountsLastHr.values()) : 0;
  if (maxSameHabitLastHr >= 3) {
    triggers.push(t('riskmsg.trigSameHabit', { count: maxSameHabitLastHr }));
  }

  // ── 5+ different habits today ──────────────────────────────────────────────
  const uniqueHabitsToday = new Set(logsToday.map(e => e.habitId)).size;
  if (uniqueHabitsToday >= 5) triggers.push(t('riskmsg.trigUnique', { count: uniqueHabitsToday }));

  // ── Log count thresholds ───────────────────────────────────────────────────
  if (logsTodayCount >= 8)      triggers.push(t('riskmsg.trigMany', { count: logsTodayCount }));
  else if (logsTodayCount >= 3) triggers.push(t('riskmsg.trigToday', { count: logsTodayCount }));

  // ── Score thresholds ───────────────────────────────────────────────────────
  if (dopamineScore < 30)      triggers.push(t('riskmsg.trigScoreCritical', { score: dopamineScore }));
  else if (dopamineScore < 50) triggers.push(t('riskmsg.trigScoreLow', { score: dopamineScore }));

  // ── Activity spike vs yesterday (proxy for score drop) ────────────────────
  if (logsYest.length > 0 && logsTodayCount >= logsYest.length * 2 && logsTodayCount >= 4) {
    triggers.push(t('riskmsg.trigDoubled', { before: logsYest.length, now: logsTodayCount }));
  }

  // ── Zero streak for 3+ days (approximated) ────────────────────────────────
  if (currentStreak === 0 && logsTodayCount >= 2) {
    triggers.push(t('riskmsg.trigNoStreak'));
  }

  // ── Determine level ────────────────────────────────────────────────────────
  let level: RiskLevel;
  if (dopamineScore < 30 || logsTodayCount >= 8) {
    level = 'critical';
  } else if (
    dopamineScore < 50 ||
    logsTodayCount >= 5 ||
    maxSameHabitLastHr >= 3 ||
    uniqueHabitsToday >= 5
  ) {
    level = 'high';
  } else if (
    dopamineScore < 70 ||
    logsTodayCount >= 3 ||
    hasLateNightLog ||
    currentStreak === 0
  ) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  // Late night floors at moderate
  if ((isLateNight || hasLateNightLog) && RISK_LEVEL_ORDER[level] < 1) level = 'moderate';

  // ── Copy (warm, not preachy) ───────────────────────────────────────────────
  let title: string, message: string, suggestion: string, timerMinutes: number;

  if (isLateNight || hasLateNightLog) {
    title = t('riskmsg.lateTitle');
    message = t('riskmsg.lateMessage', { time: formatClock(now) });
    suggestion = t('riskmsg.lateSuggestion');
    timerMinutes = 30;
  } else if (level === 'critical') {
    title = t('riskmsg.criticalTitle');
    message = logsTodayCount >= 8
      ? t('riskmsg.criticalMany', { count: logsTodayCount })
      : t('riskmsg.criticalScore', { score: dopamineScore });
    suggestion = t('riskmsg.criticalSuggestion');
    timerMinutes = 30;
  } else if (level === 'high') {
    title = t('riskmsg.highTitle');
    message = t('riskmsg.highMessage', { count: logsTodayCount });
    suggestion = t('riskmsg.highSuggestion');
    timerMinutes = 20;
  } else {
    title = t('riskmsg.moderateTitle');
    message = logsTodayCount >= 3
      ? t('riskmsg.moderateMany', { count: logsTodayCount })
      : t('riskmsg.moderateScore');
    suggestion = t('riskmsg.moderateSuggestion');
    timerMinutes = 10;
  }

  return { level, title, message, suggestion, triggers, isLateNight: isLateNight || hasLateNightLog, timerMinutes, logsTodayCount };
}

/**
 * Compute a simplified risk level for a single past day (for the timeline chart).
 * Uses only log count as a proxy since we don't have historical scores.
 */
export function getRiskLevelForDay(entries: LogEntry[], dayDate: Date): RiskLevel {
  const dayStart = getStartOfDay(dayDate).getTime();
  const dayEnd   = dayStart + 86_400_000;
  const count    = entries.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd).length;
  if (count === 0) return 'low';
  if (count >= 8)  return 'critical';
  if (count >= 5)  return 'high';
  if (count >= 3)  return 'moderate';
  return 'low';
}

export const DISMISS_STORAGE_KEY = 'zenfuel_risk_dismissed_level';
