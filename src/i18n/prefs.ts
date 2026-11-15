// Language, country and onboarding preferences. Pure (relative imports) so it is covered by
// `npm test`. Stored under their own key, separate from every existing record, so adding them
// never touches habits, history, settings, PIN, Hidden Mode or screen-time data.

import { Locale, isLocale, suggestLocale } from './locales';
import { isRegion, suggestRegion } from './regions';

export const LOCALE_PREFS_KEY = 'zf_prefs';

export interface LocalePrefs {
  /** Chosen interface language. Absent: follow the device suggestion. */
  language?: Locale;
  /** Chosen country/region (ISO 3166-1 alpha-2). Absent: none chosen yet. */
  country?: string;
  /** First-launch setup finished (or skipped because the person already used the app). */
  onboarded: boolean;
  onboardedAt?: number;
  /** Set when an existing user was moved onto these preferences without onboarding. */
  migrated?: boolean;
}

/**
 * Keys that mean ZenFuel was already used on this device before onboarding existed. Any of them
 * present → the person is an existing user and is never sent through onboarding.
 */
export const EXISTING_DATA_KEYS = [
  'mt_entries', 'mt_settings', 'mt_last_active', 'ddt_habits', 'ddt_challenges', 'ddt_goals', 'ddt_habit_order',
  'ddt_subscription', 'zenfuel_notification_prefs', 'zenfuel_usage_settings', 'zenfuel_risk_dismissed_level',
];

export function parseLocalePrefs(value: unknown): LocalePrefs | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const prefs: LocalePrefs = { onboarded: o.onboarded === true };
  if (isLocale(o.language)) prefs.language = o.language;
  if (isRegion(o.country)) prefs.country = o.country;
  if (typeof o.onboardedAt === 'number') prefs.onboardedAt = o.onboardedAt;
  if (o.migrated === true) prefs.migrated = true;
  return prefs;
}

export interface DeviceHints {
  languages: readonly string[];
  timeZone: string;
}

export interface ResolvedPrefs {
  prefs: LocalePrefs;
  /** The language to show now: the chosen one, or the device suggestion. */
  locale: Locale;
  /** The chosen region, or the device suggestion (null when there is no hint). */
  country: string | null;
  /** Show first-launch onboarding (new install only). */
  needsOnboarding: boolean;
  /** The stored record should be written (an existing user was just migrated). */
  write: boolean;
}

/**
 * New install (nothing stored): onboarding. Existing user without preferences: mark as onboarded
 * (never shown onboarding), language and country follow the device until chosen in Settings.
 */
export function resolveLocalePrefs(stored: LocalePrefs | null, hasExistingData: boolean, device: DeviceHints): ResolvedPrefs {
  const suggestedLocale = suggestLocale(device.languages);
  const suggestedCountry = suggestRegion(device.languages, device.timeZone);
  if (stored) {
    return {
      prefs: stored,
      locale: stored.language ?? suggestedLocale,
      country: stored.country ?? suggestedCountry,
      needsOnboarding: !stored.onboarded,
      write: false,
    };
  }
  if (hasExistingData) {
    const prefs: LocalePrefs = { onboarded: true, migrated: true };
    return { prefs, locale: suggestedLocale, country: suggestedCountry, needsOnboarding: false, write: true };
  }
  return { prefs: { onboarded: false }, locale: suggestedLocale, country: suggestedCountry, needsOnboarding: true, write: false };
}
