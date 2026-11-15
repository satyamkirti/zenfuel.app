import { LogEntry } from '@/types';
import { getFilterDateRange } from './dateUtils';

const DAY = 86_400_000;

export interface PeriodComparison {
  /** Check-ins in the last `days` days, today included. */
  current: LogEntry[];
  /** Check-ins in the same number of days just before that. */
  previous: LogEntry[];
  /** True when there are check-ins from before the current period, so a comparison means something. */
  hasHistory: boolean;
}

/** Splits check-ins into the last `days` days and the equally long stretch before it. */
export function comparePeriods(entries: LogEntry[], days: 7 | 30 | 90): PeriodComparison {
  const { start, end } = getFilterDateRange(`${days}d`);
  const startMs = start.getTime();
  const prevStart = startMs - days * DAY;
  return {
    current: entries.filter(e => e.timestamp >= startMs && e.timestamp <= end.getTime()),
    previous: entries.filter(e => e.timestamp >= prevStart && e.timestamp < startMs),
    hasHistory: entries.some(e => e.timestamp < startMs),
  };
}

export interface HabitChange { habitId: string; now: number; before: number; diff: number }

/**
 * The habit whose count changed most between the two periods (by at least `minDiff`).
 * On a tie, a decrease is preferred. Null without earlier history or without a clear change.
 */
export function biggestHabitChange(c: PeriodComparison, minDiff = 2): HabitChange | null {
  if (!c.hasHistory) return null;
  const count = (list: LogEntry[]) => {
    const m = new Map<string, number>();
    for (const e of list) m.set(e.habitId, (m.get(e.habitId) ?? 0) + 1);
    return m;
  };
  const now = count(c.current);
  const before = count(c.previous);
  let best: HabitChange | null = null;
  for (const id of new Set([...now.keys(), ...before.keys()])) {
    const n = now.get(id) ?? 0, b = before.get(id) ?? 0, diff = n - b;
    if (Math.abs(diff) < minDiff) continue;
    if (!best || Math.abs(diff) > Math.abs(best.diff) || (Math.abs(diff) === Math.abs(best.diff) && diff < best.diff)) {
      best = { habitId: id, now: n, before: b, diff };
    }
  }
  return best;
}

export const timesText = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`;
