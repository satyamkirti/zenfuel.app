// Built-in challenge names and descriptions in the interface language. Pure (relative imports).
// A built-in challenge is shown translated while its stored text is still the original English.

import { translate } from './translate';
import type { Locale } from './locales';

export const BUILT_IN_CHALLENGE_TEXT: Record<string, { name: string; description: string }> = {
  'no-social-7': { name: 'Social Media Detox', description: 'Go 7 days without social media' },
  'no-porn-30': { name: 'Porn-Free Month', description: 'Stay porn-free for 30 days' },
  'no-gaming-7': { name: 'Gaming Detox', description: 'No gaming for 7 days' },
  'no-reels-7': { name: 'No Short Videos', description: '7 days without reels, shorts, or TikTok' },
  'dopamine-reset-30': { name: '30-Day Dopamine Reset', description: 'Minimize all dopamine triggers for 30 days' },
};

/** The translated built-in text, or null when this is a custom (or edited) challenge. */
export function builtInChallengeText(
  c: { id?: string; isBuiltIn?: boolean; name?: string; description?: string },
  field: 'name' | 'description',
  locale: Locale,
): string | null {
  if (!c.id || c.isBuiltIn === false) return null;
  const original = BUILT_IN_CHALLENGE_TEXT[c.id];
  if (!original) return null;
  const stored = c[field];
  if (stored !== undefined && stored !== original[field]) return null;
  return translate(locale, `challenge.${c.id}.${field}`);
}
