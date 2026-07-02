'use client';

import { useMemo } from 'react';
import { LogEntry, Habit, HabitAnalytics } from '@/types';
import { computeAnalytics } from '@/utils/analytics';
import { computeStreaks } from '@/utils/streaks';
import { generateInsights } from '@/utils/insights';
import { computeDetoxScore } from '@/utils/detoxScore';

export function useAnalytics(entries: LogEntry[], habits: Habit[]) {
  const analytics = useMemo(() => computeAnalytics(entries), [entries]);
  const streaks = useMemo(() => computeStreaks(entries), [entries]);
  const detoxScore = useMemo(() => computeDetoxScore(entries), [entries]);

  const habitAnalytics = useMemo((): HabitAnalytics[] => {
    const total = entries.length;
    return habits.map(habit => {
      const he = entries.filter(e => e.habitId === habit.id);
      return {
        ...computeAnalytics(he),
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon,
        habitColor: habit.color,
        percentOfTotal: total > 0 ? Math.round((he.length / total) * 100) : 0,
        streak: computeStreaks(he),
      };
    });
  }, [entries, habits]);

  const insights = useMemo(
    () => generateInsights(analytics, streaks, habitAnalytics),
    [analytics, streaks, habitAnalytics]
  );

  return { analytics, streaks, detoxScore, habitAnalytics, insights };
}
