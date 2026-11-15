'use client';

// Language, country and time zone for the whole app.
//
// - Preferences live under their own key (zf_prefs), separate from all existing data.
// - New installs see onboarding; existing users are never sent through it (see prefs.ts).
// - Changing the language re-renders every screen immediately; nothing else is touched.
// - The time zone always comes from the device (refreshed when the app returns to the
//   foreground, so it follows the phone when travelling). No location permission is used.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { DEFAULT_LOCALE, Locale, formattingTag } from './locales';
import { LOCALE_PREFS_KEY, LocalePrefs, EXISTING_DATA_KEYS, parseLocalePrefs, resolveLocalePrefs } from './prefs';
import { translate, setActiveLocale, MessageKey, Vars } from './translate';
import { deviceTimeZone } from './format';

export interface I18nValue {
  /** False until stored preferences have been read (the first client frame). */
  ready: boolean;
  locale: Locale;
  /** Chosen country/region, or the device suggestion; null when unknown. */
  country: string | null;
  /** True when the person picked the country (not just the suggestion). */
  countryChosen: boolean;
  /** True when the person picked the language (not just the device suggestion). */
  languageChosen: boolean;
  /** BCP 47 tag for formatting, e.g. "hi-IN". */
  tag: string;
  /** The device's IANA time zone. */
  timeZone: string;
  needsOnboarding: boolean;
  t: (key: MessageKey, vars?: Vars) => string;
  setLocale: (locale: Locale) => void;
  setCountry: (country: string) => void;
  completeOnboarding: (choice: { locale: Locale; country: string | null }) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

function deviceLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  const list = navigator.languages?.length ? [...navigator.languages] : [navigator.language];
  return list.filter(Boolean);
}

function readStored(): LocalePrefs | null {
  try { return parseLocalePrefs(JSON.parse(localStorage.getItem(LOCALE_PREFS_KEY) || 'null')); } catch { return null; }
}

function writeStored(prefs: LocalePrefs): void {
  try { localStorage.setItem(LOCALE_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

// Whether ZenFuel had data on this device before this page load. Taken by the inline script in
// layout.tsx before any app code runs (window.__zfBoot), because some hooks write small values
// (such as the last-active time) as soon as they mount, which would make a brand-new install look
// like an existing user.
declare global { interface Window { __zfBoot?: { existing: boolean } } }
let existingAtStart: boolean | null = null;
function hasExistingData(): boolean {
  if (existingAtStart !== null) return existingAtStart;
  if (typeof window !== 'undefined' && window.__zfBoot) return (existingAtStart = window.__zfBoot.existing);
  try { return (existingAtStart = EXISTING_DATA_KEYS.some(k => localStorage.getItem(k) !== null)); } catch { return false; }
}

interface State {
  ready: boolean;
  prefs: LocalePrefs;
  locale: Locale;
  country: string | null;
  needsOnboarding: boolean;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ready: false, prefs: { onboarded: true }, locale: DEFAULT_LOCALE, country: null, needsOnboarding: false });
  const [timeZone, setTimeZone] = useState('UTC');
  // Take the existing-data snapshot during the first client render, before any child effect.
  useState(() => { if (typeof window !== 'undefined') hasExistingData(); return null; });

  // Keep non-React code (notifications, generated text) on the same language as the screen.
  setActiveLocale(state.locale, state.country);

  const load = useCallback(() => {
    const resolved = resolveLocalePrefs(readStored(), hasExistingData(), { languages: deviceLanguages(), timeZone: deviceTimeZone() });
    if (resolved.write) writeStored(resolved.prefs);
    setActiveLocale(resolved.locale, resolved.country);
    setState({ ready: true, prefs: resolved.prefs, locale: resolved.locale, country: resolved.country, needsOnboarding: resolved.needsOnboarding });
  }, []);

  useEffect(() => {
    load();
    setTimeZone(deviceTimeZone());
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === LOCALE_PREFS_KEY) load(); };
    // The phone may have changed time zone while ZenFuel was in the background.
    const onVisible = () => { if (document.visibilityState === 'visible') setTimeZone(deviceTimeZone()); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('resume', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('resume', onVisible);
    };
  }, [load]);

  // The page language (screen readers, hyphenation, fonts) and the first-paint guard.
  useEffect(() => {
    if (!state.ready) return;
    document.documentElement.lang = state.locale;
    document.documentElement.removeAttribute('data-i18n-wait');
  }, [state.ready, state.locale]);

  const update = useCallback((patch: Partial<LocalePrefs>) => {
    setState(prev => {
      const prefs = { ...prev.prefs, ...patch };
      writeStored(prefs);
      const locale = prefs.language ?? prev.locale;
      const country = prefs.country ?? prev.country;
      setActiveLocale(locale, country);
      return { ...prev, prefs, locale, country };
    });
  }, []);

  const setLocale = useCallback((locale: Locale) => update({ language: locale }), [update]);
  const setCountry = useCallback((country: string) => update({ country }), [update]);
  const completeOnboarding = useCallback((choice: { locale: Locale; country: string | null }) => {
    setState(prev => {
      const prefs: LocalePrefs = { ...prev.prefs, language: choice.locale, onboarded: true, onboardedAt: Date.now() };
      if (choice.country) prefs.country = choice.country;
      writeStored(prefs);
      const country = choice.country ?? prev.country;
      setActiveLocale(choice.locale, country);
      return { ...prev, prefs, locale: choice.locale, country, needsOnboarding: false };
    });
  }, []);

  const tag = formattingTag(state.locale, state.country);
  const tr = useCallback((key: MessageKey, vars?: Vars) => translate(state.locale, key, vars, tag), [state.locale, tag]);

  const value = useMemo<I18nValue>(() => ({
    ready: state.ready,
    locale: state.locale,
    country: state.country,
    countryChosen: !!state.prefs.country,
    languageChosen: !!state.prefs.language,
    tag,
    timeZone,
    needsOnboarding: state.ready && state.needsOnboarding,
    t: tr,
    setLocale,
    setCountry,
    completeOnboarding,
  }), [state, tag, timeZone, tr, setLocale, setCountry, completeOnboarding]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Just the translator (most components only need this). */
export function useT(): I18nValue['t'] {
  return useI18n().t;
}
