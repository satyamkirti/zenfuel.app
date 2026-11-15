import { t, tDynamic } from '../../i18n/translate';
// Usage limit status: how measured app time compares with the user's daily limit, and whether
// the measurement is current enough to trust.

/**
 * The single place to change the status rule.
 * - Green: below 70% of the limit.
 * - Yellow: from 70% up to and including 100%.
 * - Red: above 100%.
 */
export const USAGE_STATUS_THRESHOLDS = {
  yellowFromRatio: 0.7,
  redAboveRatio: 1.0,
} as const;

/** After this long without a successful refresh, figures are labelled as possibly out of date. */
export const STALE_AFTER_MS = 60 * 60_000;

/** 'not-measuring': Usage Access is off, so no figure is current, whatever was stored before. */
export type UsageLevel = 'green' | 'yellow' | 'red' | 'no-limit' | 'no-data' | 'not-measuring';
/**
 * - fresh / stale: refreshed today with Usage Access granted (stale after STALE_AFTER_MS).
 * - missing: Usage Access granted, but never refreshed or not yet today.
 * - no-access: Usage Access is not granted. Stored figures are history, not a current reading.
 */
export type Freshness = 'fresh' | 'stale' | 'missing' | 'no-access';

export interface UsageStatus {
  level: UsageLevel;
  /** Used time as a share of the limit (1 = at the limit). Null without a limit or data. */
  ratio: number | null;
  /** True when the figure may be behind (see STALE_AFTER_MS). Never true for 'no-data'. */
  stale: boolean;
}

export function levelForRatio(ratio: number): 'green' | 'yellow' | 'red' {
  if (ratio > USAGE_STATUS_THRESHOLDS.redAboveRatio) return 'red';
  if (ratio >= USAGE_STATUS_THRESHOLDS.yellowFromRatio) return 'yellow';
  return 'green';
}

/** Local calendar day for a timestamp, as YYYY-MM-DD. */
export function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The local day `offset` days before the day containing `ms` (calendar-based, safe across DST). */
export function shiftLocalDay(ms: number, offset: number): string {
  const d = new Date(ms);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return localDayKey(d.getTime());
}

/**
 * Whether today's figures can be shown:
 * - missing: no successful refresh since local midnight, so there is nothing for today.
 * - stale: refreshed today, but longer ago than STALE_AFTER_MS.
 */
export function freshness(lastSyncAt: number | null, now: number): Freshness {
  if (lastSyncAt === null || !Number.isFinite(lastSyncAt) || lastSyncAt < startOfLocalDay(now)) return 'missing';
  return now - lastSyncAt > STALE_AFTER_MS ? 'stale' : 'fresh';
}

/** Freshness that accounts for the Usage Access permission Android currently reports. */
export function currentFreshness(usageAccess: 'granted' | 'denied', lastSyncAt: number | null, now: number): Freshness {
  return usageAccess === 'granted' ? freshness(lastSyncAt, now) : 'no-access';
}

export function usageStatus(usedMs: number | null | undefined, limitMinutes: number | null, fresh: Freshness): UsageStatus {
  // Without Usage Access nothing is being measured, so no green/yellow/red, even for stored figures.
  if (fresh === 'no-access') return { level: 'not-measuring', ratio: null, stale: false };
  if (fresh === 'missing' || usedMs === null || usedMs === undefined || !Number.isFinite(usedMs) || usedMs < 0) {
    return { level: 'no-data', ratio: null, stale: false };
  }
  const stale = fresh === 'stale';
  if (limitMinutes === null || !Number.isFinite(limitMinutes) || limitMinutes <= 0) {
    return { level: 'no-limit', ratio: null, stale };
  }
  const ratio = usedMs / (limitMinutes * 60_000);
  return { level: levelForRatio(ratio), ratio, stale };
}

/** Badge text in the interface language. Stale figures always say so, so they never read as current. */
export function statusLabel(status: UsageStatus): string {
  const label = tDynamic(`usage.level.${status.level}`);
  return status.stale ? t('usage.stale', { label }) : label;
}

/** "0m", "45m", "1h 05m", "12h". Minutes are rounded down so a limit is never shown as met early. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return t('dur.m', { m: '0' });
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return t('dur.m', { m: String(m) });
  return m === 0 ? t('dur.h', { h: String(h) }) : t('dur.hm', { h: String(h), mm: String(m).padStart(2, '0') });
}

/** Screen-reader form: "1 hour 5 minutes". */
export function formatDurationLong(ms: number): string {
  const totalMinutes = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 60_000) : 0;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (h) parts.push(t('dur.hours', { count: h }));
  if (m || !h) parts.push(t('dur.minutes', { count: m }));
  return parts.join(' ');
}
