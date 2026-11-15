// Date, time and number formatting in the active language and region. Pure (relative imports).
//
// Stored values never change: entries keep their "YYYY-MM-DD" date and "HH:MM" time in the
// device's local time zone. Only how they are shown follows the language.

import { getFormattingTag, formatNumberFor } from './translate';

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(options: Intl.DateTimeFormatOptions, tag = getFormattingTag()): Intl.DateTimeFormat {
  const key = tag + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    try { f = new Intl.DateTimeFormat(tag, options); } catch { f = new Intl.DateTimeFormat('en', options); }
    cache.set(key, f);
  }
  return f;
}

/** A local calendar date "YYYY-MM-DD" as a Date at local midnight. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatNumber(n: number): string { return formatNumberFor(getFormattingTag(), n); }

export function formatPercent(n: number): string {
  try { return new Intl.NumberFormat(getFormattingTag(), { style: 'percent', maximumFractionDigits: 0 }).format(n / 100); } catch { return `${Math.round(n)}%`; }
}

export type DateStyle =
  | 'full'        // Sunday, 15 November
  | 'medium'      // 15 Nov 2026
  | 'dayMonth'    // 15 Nov
  | 'monthYear'   // Nov 2026
  | 'monthLong'   // November
  | 'monthShort'  // Nov
  | 'weekdayLong' // Sunday
  | 'weekdayShort'// Sun
  | 'weekdayDayMonth'; // Sunday, 15 Nov

const STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  full: { weekday: 'long', day: 'numeric', month: 'long' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  dayMonth: { day: 'numeric', month: 'short' },
  monthYear: { month: 'short', year: 'numeric' },
  monthLong: { month: 'long' },
  monthShort: { month: 'short' },
  weekdayLong: { weekday: 'long' },
  weekdayShort: { weekday: 'short' },
  weekdayDayMonth: { weekday: 'long', day: 'numeric', month: 'short' },
};

export function formatDateStyle(date: Date | number | string, style: DateStyle): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : new Date(date);
  return dtf(STYLES[style]).format(d);
}

/** Weekday name for 0 (Sunday) … 6. */
export function weekdayName(index: number, width: 'long' | 'short' = 'long'): string {
  // 2023-01-01 was a Sunday.
  return dtf({ weekday: width }).format(new Date(2023, 0, 1 + index));
}

/** Month name for 0 (January) … 11. */
export function monthName(index: number, width: 'long' | 'short' = 'short'): string {
  return dtf({ month: width }).format(new Date(2023, index, 1));
}

/** A clock time in the person's usual style (e.g. "9:05 pm"). */
export function formatClock(date: Date | number): string {
  return dtf({ hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

/** A stored "HH:MM" time shown in the language's style. */
export function formatStoredTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return formatClock(new Date(2023, 0, 1, h, m));
}

/** An hour of the day (0–23) as a short label, such as "9 am". */
export function formatHourLabel(hour: number): string {
  return dtf({ hour: 'numeric' }).format(new Date(2023, 0, 1, hour));
}

/** Date and time together. */
export function formatDateTime(date: Date | number): string {
  return dtf({ day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

/** The device's current IANA time zone (follows the phone when it travels). */
export function deviceTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

/** The zone's current UTC offset, e.g. "GMT+5:30". */
export function timeZoneOffsetLabel(timeZone: string, at = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(at).find(p => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch { return ''; }
}
