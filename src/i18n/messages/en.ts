// English catalogue (the source of truth and the fallback), built from the message sections.
import { MESSAGES, pickLocale } from './catalog';
import type { PluralText } from './types';

export type { PluralText } from './types';
export type MessageKey = keyof typeof MESSAGES;
export type Messages = Record<MessageKey, string | PluralText>;

export const en: Messages = pickLocale('en');
