import { LogEntry } from '@/types';
import { getStartOfDay } from '@/utils/dateUtils';

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
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-900 dark:text-emerald-100',
    muted: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
    dot: '#10b981',
  },
  moderate: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-900 dark:text-amber-100',
    muted: 'text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
    dot: '#f59e0b',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/30',
    text: 'text-orange-900 dark:text-orange-100',
    muted: 'text-orange-700 dark:text-orange-300',
    accent: 'bg-orange-500',
    dot: '#f97316',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/30',
    text: 'text-red-900 dark:text-red-100',
    muted: 'text-red-700 dark:text-red-300',
    accent: 'bg-red-500',
    dot: '#ef4444',
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
  if (hasLateNightLog) triggers.push('Late-night trigger logged (12 am – 5 am)');

  // ── Same habit 3+ times in last hour ──────────────────────────────────────
  const habitCountsLastHr = new Map<string, number>();
  logsLastHr.forEach(e => habitCountsLastHr.set(e.habitId, (habitCountsLastHr.get(e.habitId) ?? 0) + 1));
  const maxSameHabitLastHr = habitCountsLastHr.size > 0 ? Math.max(...habitCountsLastHr.values()) : 0;
  if (maxSameHabitLastHr >= 3) {
    triggers.push(`Same habit triggered ${maxSameHabitLastHr}× in the last hour`);
  }

  // ── 5+ different habits today ──────────────────────────────────────────────
  const uniqueHabitsToday = new Set(logsToday.map(e => e.habitId)).size;
  if (uniqueHabitsToday >= 5) triggers.push(`${uniqueHabitsToday} different habit triggers today`);

  // ── Log count thresholds ───────────────────────────────────────────────────
  if (logsTodayCount >= 8)      triggers.push(`${logsTodayCount} events in one day`);
  else if (logsTodayCount >= 5) triggers.push(`${logsTodayCount} events logged today`);
  else if (logsTodayCount >= 3) triggers.push(`${logsTodayCount} events logged today`);

  // ── Score thresholds ───────────────────────────────────────────────────────
  if (dopamineScore < 30)      triggers.push(`Detox score critically low (${dopamineScore}/100)`);
  else if (dopamineScore < 50) triggers.push(`Detox score low (${dopamineScore}/100)`);

  // ── Activity spike vs yesterday (proxy for score drop) ────────────────────
  if (logsYest.length > 0 && logsTodayCount >= logsYest.length * 2 && logsTodayCount >= 4) {
    triggers.push(`Activity doubled vs yesterday (${logsYest.length} → ${logsTodayCount})`);
  }

  // ── Zero streak for 3+ days (approximated) ────────────────────────────────
  if (currentStreak === 0 && logsTodayCount >= 2) {
    triggers.push('No active detox streak');
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
    const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    title = 'Late night warning 🌙';
    message = `It's ${t} and your brain is seeking dopamine. Late-night triggers dig the deepest grooves.`;
    suggestion = 'Put the phone face-down. Sleep is the most powerful dopamine reset available to you.';
    timerMinutes = 30;
  } else if (level === 'critical') {
    title = 'High risk detected 🔴';
    message = logsTodayCount >= 8
      ? `Your brain has had ${logsTodayCount} dopamine hits today and your score is critically low. This is the moment ZenFuel was built for.`
      : `Your dopamine score is critically low (${dopamineScore}/100). This is the moment ZenFuel was built for.`;
    suggestion = 'Close all apps. Do one physical thing right now — walk, stretch, drink water. Come back in 30 minutes.';
    timerMinutes = 30;
  } else if (level === 'high') {
    title = 'Your brain needs a reset 🟠';
    message = `You've had ${logsTodayCount} dopamine hits today. This is when the cycle gets hard to break.`;
    suggestion = "Step away from all screens for 20 minutes. You'll feel clearer after.";
    timerMinutes = 20;
  } else {
    title = 'Heads up 🟡';
    message = logsTodayCount >= 3
      ? `You've logged ${logsTodayCount} triggers today. Your brain is working hard — give it a moment.`
      : `Your score is dipping. Your brain is working overtime today.`;
    suggestion = 'Try a 5-minute walk or drink a glass of water.';
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
