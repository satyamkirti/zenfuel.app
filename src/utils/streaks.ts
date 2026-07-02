import { LogEntry, StreakData, StreakInfo } from '@/types';
import { formatDate, getStartOfDay } from './dateUtils';

export function computeStreaks(entries: LogEntry[]): StreakData {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, streakHistory: [], totalStreaks: 0, averageStreakLength: 0 };
  }

  const activeDates = new Set(entries.map(e => formatDate(new Date(e.timestamp))));
  const today = getStartOfDay(new Date());
  const todayStr = formatDate(today);

  const sortedDates = Array.from(activeDates).sort();
  const firstDate = new Date(sortedDates[0] + 'T00:00:00');

  const streaks: StreakInfo[] = [];
  let streakStart: string | null = null;
  let streakLen = 0;

  const cur = new Date(firstDate);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 1);

  while (cur < limit) {
    const dateStr = formatDate(cur);
    if (!activeDates.has(dateStr)) {
      if (streakStart === null) {
        streakStart = dateStr;
        streakLen = 0;
      }
      streakLen++;
    } else {
      if (streakStart !== null && streakLen > 0) {
        const prev = new Date(cur);
        prev.setDate(prev.getDate() - 1);
        streaks.push({ start: streakStart, end: formatDate(prev), length: streakLen });
      }
      streakStart = null;
      streakLen = 0;
    }
    cur.setDate(cur.getDate() + 1);
  }

  let currentStreak = 0;
  if (streakStart !== null && streakLen > 0) {
    if (!activeDates.has(todayStr)) {
      currentStreak = streakLen;
    }
    streaks.push({ start: streakStart, end: todayStr, length: streakLen });
  }

  const longestStreak = streaks.reduce((max, s) => Math.max(max, s.length), 0);
  const completedStreaks = streaks.filter(s => s.end !== todayStr || !currentStreak);
  const avgLen = completedStreaks.length > 0
    ? completedStreaks.reduce((s, k) => s + k.length, 0) / completedStreaks.length
    : 0;

  return {
    currentStreak,
    longestStreak,
    streakHistory: [...streaks].sort((a, b) => b.length - a.length).slice(0, 10),
    totalStreaks: streaks.length,
    averageStreakLength: Math.round(avgLen * 10) / 10,
  };
}
