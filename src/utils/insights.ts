import { AppAnalytics, StreakData, Insight, HabitAnalytics } from '@/types';
import { SHORT_MONTHS } from './dateUtils';

export function generateInsights(
  analytics: AppAnalytics,
  streaks: StreakData,
  habitAnalytics?: HabitAnalytics[]
): Insight[] {
  const insights: Insight[] = [];

  if (analytics.lifetimeCount === 0) {
    return [{ id: 'empty', type: 'info', message: 'Start logging habits to see personalized insights.', icon: '📊' }];
  }

  // Most-triggered habit
  if (habitAnalytics && habitAnalytics.length > 0) {
    const sorted = [...habitAnalytics].filter(h => h.lifetimeCount > 0).sort((a, b) => b.lifetimeCount - a.lifetimeCount);
    if (sorted.length > 0) {
      const top = sorted[0];
      insights.push({
        id: 'top-habit',
        type: 'warning',
        message: `${top.habitIcon} ${top.habitName} accounts for ${top.percentOfTotal}% of all logged events.`,
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
        message: `You reduced ${h.habitName} by ${pct}% compared to last month. Keep going!`,
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
        message: `You have maintained a ${topStreakHabit.streak.currentStreak}-day ${topStreakHabit.habitName} detox streak!`,
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
        insights.push({ id: 'increasing', type: 'warning', message: `Your activity increased by ${Math.abs(pct)}% compared to last month.`, icon: '📈' });
      } else if (pct >= 20) {
        insights.push({ id: 'reducing', type: 'positive', message: `Activity down ${pct}% vs last month. Excellent progress!`, icon: '📉' });
      }
    }
  }

  // Global streak
  if (streaks.currentStreak >= 3) {
    insights.push({ id: 'global-streak', type: 'positive', message: `You're on a ${streaks.currentStreak}-day global detox streak!`, icon: '🔥' });
  }
  if (streaks.longestStreak > 0) {
    insights.push({ id: 'longest-streak', type: 'info', message: `Your longest detox streak is ${streaks.longestStreak} days.`, icon: '🏆' });
  }

  // Risk day
  if (analytics.mostActiveWeekday && analytics.mostActiveWeekday.count > 0) {
    insights.push({ id: 'risk-day', type: 'warning', message: `${analytics.mostActiveWeekday.day} is your highest-risk day — plan accordingly.`, icon: '📅' });
  }

  // Peak hour
  if (analytics.peakHours.length > 0) {
    const h = analytics.peakHours[0];
    const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    insights.push({ id: 'peak-hour', type: 'info', message: `Your peak trigger time is around ${label}. Plan distractions for this window.`, icon: '🕐' });
  }

  // Peak month
  if (analytics.highestActivityMonth) {
    const [y, m] = analytics.highestActivityMonth.month.split('-');
    insights.push({ id: 'peak-month', type: 'info', message: `Your most active month was ${SHORT_MONTHS[parseInt(m) - 1]} ${y} with ${analytics.highestActivityMonth.count} events.`, icon: '📆' });
  }

  return insights.slice(0, 8);
}
