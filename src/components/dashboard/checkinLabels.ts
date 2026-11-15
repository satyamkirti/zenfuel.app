import { Habit } from '@/types';
import { t, tDynamic } from '@/i18n/translate';
import { BUILT_IN_HABIT_NAMES } from '@/i18n/habitNames';

// Plain wording for activity buttons, so each one says exactly what tapping it tracks, in the
// interface language. Built-in habits that still have their original name get a descriptive
// noun ("Social media use"); a renamed or custom habit uses its own name.
const DESCRIBED = new Set(['social-media', 'gaming', 'short-videos', 'junk-food', 'smoking', 'alcohol']);

/**
 * `displayName` is the name already shown on screen (masked in Hidden Mode). Personal (adult)
 * habits always use neutral wording here, as they did before.
 */
export function checkinWording(habit: Habit, displayName: string, masked: boolean): { noun: string; action: string } {
  if (habit.category === 'adult') {
    const noun = t('habitNoun.personal');
    return { noun, action: t('habitAction.track', { name: noun }) };
  }
  if (!masked && DESCRIBED.has(habit.id) && habit.name === BUILT_IN_HABIT_NAMES[habit.id]) {
    const noun = tDynamic(`habitNoun.${habit.id}`);
    return { noun, action: t('habitAction.track', { name: noun }) };
  }
  return { noun: displayName, action: t('habitAction.track', { name: displayName }) };
}
