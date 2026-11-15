import type { Locale } from '../locales';

/** Text that depends on a count ({count}); the form is chosen with Intl.PluralRules. */
export interface PluralText { one: string; other: string }

/**
 * One message in every supported language. Adding a language to LOCALES makes every message
 * without it a type error, so a language can never ship half-translated.
 */
export type Entry = { [L in Locale]: string } | { [L in Locale]: PluralText };

export type Section = Record<string, Entry>;
