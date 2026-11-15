'use client';

import { useMemo } from 'react';
import { LogEntry, Habit, HabitAnalytics } from '@/types';
import { computeAnalytics } from '@/utils/analytics';
import { computeStreaks } from '@/utils/streaks';
import { generateInsights } from '@/utils/insights';
import { computeDetoxScore } from '@/utils/detoxScore';
import { localizedHabitName } from '@/i18n/habitNames';
import type { Locale } from '@/i18n/locales';

// `locale`: labels (weekday and month names) and insight wording are generated in the interface
// language, so they are recomputed when it changes.
export function useAnalytics(entries: LogEntry[], habits: Habit[], locale: Locale) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analytics = useMemo(() => computeAnalytics(entries), [entries, locale]);
  const streaks = useMemo(() => computeStreaks(entries), [entries]);
  const detoxScore = useMemo(() => computeDetoxScore(entries), [entries]);

  const habitAnalytics = useMemo((): HabitAnalytics[] => {
    const total = entries.length;
    return habits.map(habit => {
      const he = entries.filter(e => e.habitId === habit.id);
      return {
        ...computeAnalytics(he),
        habitId: habit.id,
        // Shown in insights: the name in the interface language (Hidden Mode masks it on screen).
        habitName: localizedHabitName(habit, locale),
        habitIcon: habit.icon,
        habitColor: habit.color,
        percentOfTotal: total > 0 ? Math.round((he.length / total) * 100) : 0,
        streak: computeStreaks(he),
      };
    });
  }, [entries, habits, locale]);

  const insights = useMemo(
    () => generateInsights(analytics, streaks, habitAnalytics),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, streaks, habitAnalytics, locale]
  );

  return { analytics, streaks, detoxScore, habitAnalytics, insights };
}
