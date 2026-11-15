// Habit names on screen. Pure (relative imports), covered by `npm test`.
//
// Stored names never change. A built-in habit (or one added from a Good Habit Template) whose
// name is still the one it was created with is shown in the interface language; anything the
// person typed is shown exactly as typed.

import { CATALOGS, translate } from './translate';
import { LOCALES, Locale } from './locales';
import { isTemplateId } from '../lib/habits/templates';

/** The English names the built-in habits are stored with. */
export const BUILT_IN_HABIT_NAMES: Record<string, string> = {
  'social-media': 'Social Media',
  porn: 'Porn',
  masturbation: 'Masturbation',
  gaming: 'Gaming',
  'short-videos': 'Short Videos',
  'junk-food': 'Junk Food',
  smoking: 'Smoking',
  alcohol: 'Alcohol',
};

interface NamedHabit { id: string; name: string; templateId?: string }

/** True when `name` is the template's name in any supported language (i.e. not renamed). */
export function isTemplateName(templateId: string, name: string): boolean {
  const key = `template.${templateId}.name`;
  return LOCALES.some(l => (CATALOGS[l] as Record<string, unknown>)[key] === name.trim());
}

/** The key of the localised name for this habit, or null when its own name should be shown. */
export function habitNameKey(h: NamedHabit): string | null {
  if (BUILT_IN_HABIT_NAMES[h.id] !== undefined && h.name === BUILT_IN_HABIT_NAMES[h.id]) return `habit.${h.id}`;
  if (h.templateId && isTemplateId(h.templateId) && isTemplateName(h.templateId, h.name)) return `template.${h.templateId}.name`;
  return null;
}

/** The habit's name in `locale` (its own name if the person renamed it or created it). */
export function localizedHabitName(h: NamedHabit, locale: Locale): string {
  const key = habitNameKey(h);
  return key ? translate(locale, key) : h.name;
}
