import { LogEntry, DetoxScore } from '@/types';
import { getStartOfDay, getStartOfWeek } from './dateUtils';
import { computeStreaks } from './streaks';

export function computeDetoxScore(entries: LogEntry[]): DetoxScore {
  if (entries.length === 0) {
    return { score: 100, label: 'Excellent', color: '#10b981', trend: 'stable' };
  }

  const now = new Date();
  const todayStart = getStartOfDay(now).getTime();
  const weekStart = getStartOfWeek(now).getTime();
  const prevWeekStart = weekStart - 7 * 86400000;

  const todayCount = entries.filter(e => e.timestamp >= todayStart).length;
  const thisWeekCount = entries.filter(e => e.timestamp >= weekStart).length;
  const lastWeekCount = entries.filter(e => e.timestamp >= prevWeekStart && e.timestamp < weekStart).length;

  const streaks = computeStreaks(entries);

  let score = 100;

  // Today penalty (max -35)
  score -= Math.min(35, todayCount * 12);

  // Weekly trend (max ±20)
  if (lastWeekCount > 0) {
    const change = (thisWeekCount - lastWeekCount) / lastWeekCount;
    if (change > 0.1) score -= Math.min(20, Math.round(change * 15));
    else if (change < -0.1) score += Math.min(15, Math.round(-change * 10));
  } else if (thisWeekCount === 0) {
    score += 10;
  }

  // Streak bonus (max +25)
  score += Math.min(25, streaks.currentStreak * 3);

  // Longest streak bonus
  if (streaks.longestStreak >= 30) score += 5;
  else if (streaks.longestStreak >= 14) score += 3;
  else if (streaks.longestStreak >= 7) score += 1;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const trend: 'up' | 'down' | 'stable' =
    lastWeekCount === 0 ? 'stable' :
    thisWeekCount < lastWeekCount ? 'up' :
    thisWeekCount > lastWeekCount ? 'down' : 'stable';

  let label: DetoxScore['label'];
  let color: string;
  if (score >= 80) { label = 'Excellent'; color = '#10b981'; }
  else if (score >= 60) { label = 'Good'; color = '#3b82f6'; }
  else if (score >= 40) { label = 'Moderate'; color = '#f59e0b'; }
  else { label = 'Needs Improvement'; color = '#ef4444'; }

  return { score, label, color, trend };
}
