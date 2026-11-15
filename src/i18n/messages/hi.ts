// Hindi catalogue, built from the message sections (every message carries its Hindi text).
import { pickLocale } from './catalog';
import type { Messages } from './en';

export const hi: Messages = pickLocale('hi');
