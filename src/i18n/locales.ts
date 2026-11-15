// Supported interface languages. Pure (no React, no path aliases) so it is covered by `npm test`.
//
// Adding a language: add its code here and to LOCALE_INFO, add a complete messages file in
// ./messages (typed as Messages, so a missing key fails the type check) and register it in
// ./translate.ts. No screen needs to change.

export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

/** English is the default and the fallback for anything missing. */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_INFO: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * The language to suggest from the device's preferred languages (most preferred first): the
 * first one ZenFuel supports, otherwise English. Only the primary subtag matters ("hi-IN" → hi).
 */
export function suggestLocale(languages: readonly string[] | undefined | null): Locale {
  for (const tag of languages ?? []) {
    const primary = String(tag).toLowerCase().split(/[-_]/)[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

/** A BCP 47 tag for formatting dates and numbers: the language, with the region when known. */
export function formattingTag(locale: Locale, country: string | null | undefined): string {
  return country && /^[A-Z]{2}$/.test(country) ? `${locale}-${country}` : locale;
}
