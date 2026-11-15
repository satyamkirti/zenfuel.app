// Every message section, merged. Each message carries all supported languages (see ./types).
import type { Locale } from '../locales';
import type { PluralText } from './types';
import { core } from './sections/core';
import { setup } from './sections/setup';
import { home } from './sections/home';
import { habitsMsgs } from './sections/habits';
import { screenTime } from './sections/screenTime';
import { insightsMsgs } from './sections/insights';
import { plan } from './sections/plan';
import { settingsMsgs } from './sections/settings';
import { system } from './sections/system';

/** The sections, kept separate so a test can check that no key is defined twice. */
export const SECTIONS = { core, setup, home, habitsMsgs, screenTime, insightsMsgs, plan, settingsMsgs, system };

export const MESSAGES = { ...core, ...setup, ...home, ...habitsMsgs, ...screenTime, ...insightsMsgs, ...plan, ...settingsMsgs, ...system };

export function pickLocale(locale: Locale): Record<keyof typeof MESSAGES, string | PluralText> {
  const out: Record<string, string | PluralText> = {};
  for (const [key, entry] of Object.entries(MESSAGES)) out[key] = (entry as Record<Locale, string | PluralText>)[locale];
  return out as Record<keyof typeof MESSAGES, string | PluralText>;
}
