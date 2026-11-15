import { formatDateStyle, formatDateTime, formatHourLabel } from '@/i18n/format';
import { t } from '@/i18n/translate';

// English names, kept for data keys; on screen use weekdayName/monthName from '@/i18n/format'.
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: Date | number): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTime(date: Date | number): string {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
}

/** A stored "YYYY-MM-DD" date for display, in the interface language (e.g. "15 Nov 2026"). */
export function formatDisplayDate(dateStr: string): string {
  return formatDateStyle(dateStr, 'medium');
}

export function formatDisplayDateTime(timestamp: number): string {
  return formatDateTime(timestamp);
}

export function formatRelativeDate(dateStr: string): string {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return t('common.today');
  if (dateStr === yesterday) return t('common.yesterday');
  return formatDisplayDate(dateStr);
}

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getStartOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function getWeekKey(date: Date): string {
  const start = getStartOfWeek(new Date(date));
  return formatDate(start);
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDaysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}

export function getFilterDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;
  switch (period) {
    case 'today':
      start = getStartOfDay(now);
      break;
    case '7d':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case '90d':
      start = new Date(now);
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case '6m':
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case '1y':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(0);
  }
  return { start, end };
}

export function filterEntriesByPeriod<T extends { timestamp: number }>(
  entries: T[],
  period: string,
  customRange?: { start: string; end: string }
): T[] {
  if (period === 'lifetime') return entries;
  if (period === 'custom' && customRange) {
    const start = new Date(customRange.start).getTime();
    const end = new Date(customRange.end + 'T23:59:59').getTime();
    return entries.filter(e => e.timestamp >= start && e.timestamp <= end);
  }
  const { start, end } = getFilterDateRange(period);
  return entries.filter(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime());
}

/** An hour of the day (0–23) as a short label, in the interface language ("9 am"). */
export function formatHour(hour: number): string {
  return formatHourLabel(hour);
}
