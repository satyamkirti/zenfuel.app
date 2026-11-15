import { Habit, LogEntry } from '@/types';
import { computeStreaks } from './streaks';
import { formatDate, getStartOfDay } from './dateUtils';
import { weekdayName } from '@/i18n/format';

const DAY = 86_400_000;

export interface DayCell {
  key: string;      // YYYY-MM-DD
  label: string;    // Mon, Tue… (interface language)
  count: number;    // check-ins that day
  isToday: boolean;
  /** False for days before the first check-in ever, where "clean" would mean nothing. */
  tracked: boolean;
}

/** The last `n` days, oldest first, with the number of check-ins on each. */
export function lastNDays(entries: LogEntry[], n = 7, now = new Date()): DayCell[] {
  const today = getStartOfDay(now);
  const counts = new Map<string, number>();
  let first = Infinity;
  for (const e of entries) {
    const k = formatDate(new Date(e.timestamp));
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (e.timestamp < first) first = e.timestamp;
  }
  const firstDay = first === Infinity ? Infinity : getStartOfDay(new Date(first)).getTime();
  const days: DayCell[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY + 12 * 3_600_000); // midday avoids DST edges
    const k = formatDate(d);
    days.push({
      key: k,
      label: weekdayName(d.getDay(), 'short'),
      count: counts.get(k) ?? 0,
      isToday: i === 0,
      tracked: getStartOfDay(d).getTime() >= firstDay,
    });
  }
  return days;
}

export interface HabitToday {
  habit: Habit;
  today: number;
  /** Consecutive days without a check-in for this habit, including today. */
  streak: number;
  /** Whether this habit has ever been logged (a streak means nothing before that). */
  hasHistory: boolean;
  week: number[];
  weekTotal: number;
}

/** Today's state for each habit, from the user's own check-ins. */
export function habitTodayStats(habits: Habit[], entries: LogEntry[], now = new Date()): HabitToday[] {
  const byHabit = new Map<string, LogEntry[]>();
  for (const e of entries) {
    const list = byHabit.get(e.habitId);
    if (list) list.push(e); else byHabit.set(e.habitId, [e]);
  }
  return habits.map(habit => {
    const list = byHabit.get(habit.id) ?? [];
    const days = lastNDays(list, 7, now);
    return {
      habit,
      today: days[6].count,
      streak: list.length ? computeStreaks(list).currentStreak : 0,
      hasHistory: list.length > 0,
      week: days.map(d => d.count),
      weekTotal: days.reduce((s, d) => s + d.count, 0),
    };
  });
}
