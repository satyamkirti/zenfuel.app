// Small translated labels shared by several screens.
import type { DetoxScore } from '@/types';
import type { HabitGoal } from '@/lib/habits/templates';
import type { I18nValue } from './I18nProvider';
import { tDynamic } from './translate';
import { formatStoredTime } from './format';

type T = I18nValue['t'];

/** The detox score's label ("Excellent", "Not enough data yet"…) in the interface language. */
export function scoreLabel(_t: T, label: DetoxScore['label']): string {
  return tDynamic(`score.label.${label}`);
}

/** A good habit's goal as a short phrase ("Goal: 30 min a day"), or null when it has none. */
export function goalSummary(t: T, goal: HabitGoal | undefined): string | null {
  if (!goal) return null;
  if (goal.kind === 'duration' && goal.minutes) return t('goal.summary.duration', { minutes: goal.minutes });
  if (goal.kind === 'count' && goal.count) return t('goal.summary.count', { amount: goalAmount(goal) });
  if (goal.kind === 'bedtime' && goal.bedtime) return t('goal.summary.bedtime', { time: formatStoredTime(goal.bedtime) });
  return null;
}

/** "8 glasses", "2 bottles"… for a count goal. */
export function goalAmount(goal: HabitGoal): string {
  const unit = goal.unit ?? 'times';
  return tDynamic(`goal.unit.${unit}`, { count: goal.count ?? 0 });
}
