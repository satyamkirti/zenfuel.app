// The translator. Pure (relative imports only) so it is covered by `npm test`.
//
// Messages are flat keys ("home.greeting.morning") in ./messages/en.ts, the source of truth, with
// a complete Hindi catalogue in ./messages/hi.ts (typed, so a missing or extra key fails the type
// check). A value is a string, or { one, other } for counts. "{name}" placeholders are filled from
// `vars`; numbers are formatted for the active language and region. Anything missing falls back
// to English, and a key with no English text shows the key itself (never a blank).
//
// React components use `useI18n()` (I18nProvider) so they re-render when the language changes.
// Non-React code (notifications, generated insights) uses `t()` below, which reads the active
// language that the provider sets.

import { en, MessageKey, Messages, PluralText } from './messages/en';
import { hi } from './messages/hi';
import { DEFAULT_LOCALE, Locale, formattingTag } from './locales';

export type { MessageKey } from './messages/en';
export type Vars = Record<string, string | number>;

export const CATALOGS: Record<Locale, Messages> = { en, hi };

const pluralRules = new Map<string, Intl.PluralRules>();
function pluralCategory(locale: Locale, n: number): string {
  let rules = pluralRules.get(locale);
  if (!rules) { rules = new Intl.PluralRules(locale); pluralRules.set(locale, rules); }
  return rules.select(n);
}

const numberFormats = new Map<string, Intl.NumberFormat>();
export function formatNumberFor(tag: string, n: number): string {
  let f = numberFormats.get(tag);
  if (!f) {
    try { f = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }); } catch { f = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }); }
    numberFormats.set(tag, f);
  }
  return f.format(n);
}

function pick(entry: string | PluralText, locale: Locale, vars?: Vars): string {
  if (typeof entry === 'string') return entry;
  const n = Number(vars?.count ?? 0);
  const cat = pluralCategory(locale, Number.isFinite(n) ? n : 0);
  return (entry as unknown as Record<string, string>)[cat] ?? entry.other;
}

/** Fills {placeholders}. Numbers use the formatting tag; unknown placeholders are left as written. */
export function interpolate(text: string, vars: Vars | undefined, tag: string): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = vars[name];
    if (v === undefined) return m;
    return typeof v === 'number' ? formatNumberFor(tag, v) : v;
  });
}

/** The text for `key` in `locale` (English when missing there), with `vars` filled in. */
export function translate(locale: Locale, key: MessageKey | string, vars?: Vars, tag: string = locale): string {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  const entry = (catalog as Record<string, string | PluralText>)[key] ?? (en as Record<string, string | PluralText>)[key];
  if (entry === undefined) return key;
  const useLocale = (catalog as Record<string, unknown>)[key] !== undefined ? locale : DEFAULT_LOCALE;
  return interpolate(pick(entry, useLocale, vars), vars, tag);
}

/** True when `key` exists (in English, the source of truth). */
export function hasMessage(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}

// ── Active language (set by I18nProvider) ──────────────────────────────────────

let activeLocale: Locale = DEFAULT_LOCALE;
let activeTag = DEFAULT_LOCALE as string;

export function setActiveLocale(locale: Locale, country?: string | null): void {
  activeLocale = locale;
  activeTag = formattingTag(locale, country);
}
export function getActiveLocale(): Locale { return activeLocale; }
/** BCP 47 tag for dates and numbers (language plus region, e.g. "hi-IN"). */
export function getFormattingTag(): string { return activeTag; }

/** Translate with the active language. */
export function t(key: MessageKey, vars?: Vars): string {
  return translate(activeLocale, key, vars, activeTag);
}
/** Translate a key built at run time (falls back to the key itself if it does not exist). */
export function tDynamic(key: string, vars?: Vars): string {
  return translate(activeLocale, key, vars, activeTag);
}
