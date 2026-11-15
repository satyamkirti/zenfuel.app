import { AppAnalytics, StreakData, Insight, HabitAnalytics } from '@/types';
import { t } from '@/i18n/translate';
import { formatDateStyle, formatHourLabel } from '@/i18n/format';

// Short observations from the person's own tracked activity, in the interface language.
// Habit names come from HabitAnalytics.habitName (already in the interface language); Hidden
// Mode masks them on screen with maskText.
export function generateInsights(
  analytics: AppAnalytics,
  streaks: StreakData,
  habitAnalytics?: HabitAnalytics[]
): Insight[] {
  const insights: Insight[] = [];

  if (analytics.lifetimeCount === 0) {
    return [{ id: 'empty', type: 'info', message: t('gen.empty'), icon: '📊' }];
  }

  // Most-tracked habit
  if (habitAnalytics && habitAnalytics.length > 0) {
    const sorted = [...habitAnalytics].filter(h => h.lifetimeCount > 0).sort((a, b) => b.lifetimeCount - a.lifetimeCount);
    if (sorted.length > 0) {
      const top = sorted[0];
      insights.push({
        id: 'top-habit',
        type: 'warning',
        message: t('gen.topHabit', { name: top.habitName, pct: top.percentOfTotal }),
        icon: '⚠️',
      });
    }

    // Fastest improving habit (month over month)
    const improving = [...habitAnalytics].filter(h => {
      const mc = h.monthlyCounts;
      if (mc.length < 2) return false;
      const last = mc[mc.length - 1].count;
      const prev = mc[mc.length - 2].count;
      return prev > 0 && last < prev * 0.7;
    }).sort((a, b) => {
      const aR = (a.monthlyCounts.at(-1)?.count ?? 0) / Math.max(1, a.monthlyCounts.at(-2)?.count ?? 1);
      const bR = (b.monthlyCounts.at(-1)?.count ?? 0) / Math.max(1, b.monthlyCounts.at(-2)?.count ?? 1);
      return aR - bR;
    });
    if (improving.length > 0) {
      const h = improving[0];
      const last = h.monthlyCounts.at(-1)?.count ?? 0;
      const prev = h.monthlyCounts.at(-2)?.count ?? 1;
      const pct = Math.round(((prev - last) / prev) * 100);
      insights.push({
        id: `improving-${h.habitId}`,
        type: 'positive',
        message: t('gen.improving', { name: h.habitName, pct }),
        icon: h.habitIcon,
      });
    }

    // Per-habit streak highlight
    const topStreakHabit = [...habitAnalytics]
      .filter(h => h.streak.currentStreak >= 7)
      .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)[0];
    if (topStreakHabit) {
      insights.push({
        id: `habit-streak-${topStreakHabit.habitId}`,
        type: 'positive',
        message: t('gen.habitStreak', { count: topStreakHabit.streak.currentStreak, name: topStreakHabit.habitName }),
        icon: topStreakHabit.habitIcon,
      });
    }
  }

  // Monthly progress
  if (analytics.monthlyCounts.length >= 2) {
    const last = analytics.monthlyCounts.at(-1)!;
    const prev = analytics.monthlyCounts.at(-2)!;
    if (prev.count > 0) {
      const pct = Math.round(((prev.count - last.count) / prev.count) * 100);
      if (pct <= -20) {
        insights.push({ id: 'increasing', type: 'warning', message: t('gen.increasing', { pct: Math.abs(pct) }), icon: '📈' });
      } else if (pct >= 20) {
        insights.push({ id: 'reducing', type: 'positive', message: t('gen.reducing', { pct }), icon: '📉' });
      }
    }
  }

  // Global streak
  if (streaks.currentStreak >= 3) {
    insights.push({ id: 'global-streak', type: 'positive', message: t('gen.globalStreak', { count: streaks.currentStreak }), icon: '🔥' });
  }
  if (streaks.longestStreak > 0) {
    insights.push({ id: 'longest-streak', type: 'info', message: t('gen.longestStreak', { count: streaks.longestStreak }), icon: '🏆' });
  }

  // Risk day
  if (analytics.mostActiveWeekday && analytics.mostActiveWeekday.count > 0) {
    insights.push({ id: 'risk-day', type: 'warning', message: t('gen.riskDay', { day: analytics.mostActiveWeekday.day }), icon: '📅' });
  }

  // Peak hour
  if (analytics.peakHours.length > 0) {
    insights.push({ id: 'peak-hour', type: 'info', message: t('gen.peakHour', { hour: formatHourLabel(analytics.peakHours[0]) }), icon: '🕐' });
  }

  // Peak month
  if (analytics.highestActivityMonth) {
    const [y, m] = analytics.highestActivityMonth.month.split('-').map(Number);
    insights.push({
      id: 'peak-month',
      type: 'info',
      message: t('gen.peakMonth', { month: formatDateStyle(new Date(y, m - 1, 1), 'monthYear'), count: analytics.highestActivityMonth.count }),
      icon: '📆',
    });
  }

  return insights.slice(0, 8);
}
