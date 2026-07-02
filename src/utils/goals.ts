import { Goal, LogEntry } from '@/types';
import { getStartOfWeek, getStartOfMonth } from './dateUtils';
import { computeStreaks } from './streaks';

export interface GoalProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
  isAchieved: boolean;
  label: string;
}

export function computeGoalProgress(goal: Goal, entries: LogEntry[]): GoalProgress {
  const now = new Date();
  const monthStart = getStartOfMonth(now).getTime();
  const weekStart = getStartOfWeek(now).getTime();
  const habitEntries = entries.filter(e => e.habitId === goal.habitId);

  switch (goal.type) {
    case 'max_per_week': {
      const count = habitEntries.filter(e => e.timestamp >= weekStart).length;
      const pct = goal.targetValue > 0
        ? Math.max(0, Math.round(((goal.targetValue - count) / goal.targetValue) * 100))
        : 0;
      return { currentValue: count, targetValue: goal.targetValue, percentage: pct, isAchieved: count <= goal.targetValue, label: `${count}/${goal.targetValue} this week` };
    }
    case 'streak_days':
    case 'free_for_days': {
      const streaks = computeStreaks(habitEntries);
      const pct = Math.min(100, Math.round((streaks.currentStreak / goal.targetValue) * 100));
      return { currentValue: streaks.currentStreak, targetValue: goal.targetValue, percentage: pct, isAchieved: streaks.currentStreak >= goal.targetValue, label: `${streaks.currentStreak}/${goal.targetValue} days` };
    }
    case 'reduce_by_percent': {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const prevCount = habitEntries.filter(e => e.timestamp >= prevMonthStart && e.timestamp < monthStart).length;
      const thisCount = habitEntries.filter(e => e.timestamp >= monthStart).length;
      const reduction = prevCount > 0 ? Math.max(0, Math.round(((prevCount - thisCount) / prevCount) * 100)) : 0;
      const pct = Math.min(100, Math.round((reduction / goal.targetValue) * 100));
      return { currentValue: reduction, targetValue: goal.targetValue, percentage: pct, isAchieved: reduction >= goal.targetValue, label: `${reduction}% reduction (target: ${goal.targetValue}%)` };
    }
    default:
      return { currentValue: 0, targetValue: goal.targetValue, percentage: 0, isAchieved: false, label: '' };
  }
}
