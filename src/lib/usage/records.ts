// Measured daily usage records and the summaries built from them.
//
// These are separate from manual habit entries: an hour in YouTube is never turned into a
// logged habit event, and nothing here feeds the Detox Score.

import { getSupportedApp, SupportedApp } from './catalog';
import { TrackedAppSetting } from './settings';
import { Freshness, usageStatus, UsageStatus, shiftLocalDay } from './status';
import { t } from '../../i18n/translate';

export const USAGE_RECORD_SCHEMA = 1;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAY_MS = 24 * 60 * 60_000 + 60 * 60_000; // a 25-hour day (DST) is the most a day can hold

export interface DailyUsageRecord {
  /** `${day}:${appId}` — one record per app per local day. */
  id: string;
  day: string;
  appId: string;
  foregroundMs: number;
  /** Approximate number of separate visits; see docs/android-usage-tracking.md. */
  sessions: number;
  /** When this record was last recomputed (ms). */
  updatedAt: number;
  schemaVersion: number;
}

export function recordId(day: string, appId: string): string {
  return `${day}:${appId}`;
}

/** Validates one record from the native layer. Returns null for anything malformed. */
export function parseRecord(raw: unknown): DailyUsageRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const { day, appId, foregroundMs, sessions, updatedAt, schemaVersion } = r;
  if (typeof day !== 'string' || !DAY_RE.test(day)) return null;
  if (typeof appId !== 'string' || !appId || appId.length > 64) return null;
  if (typeof foregroundMs !== 'number' || !Number.isFinite(foregroundMs) || foregroundMs < 0 || foregroundMs > MAX_DAY_MS) return null;
  const s = typeof sessions === 'number' && Number.isFinite(sessions) && sessions >= 0 ? Math.floor(sessions) : 0;
  return {
    id: recordId(day, appId),
    day,
    appId,
    foregroundMs: Math.round(foregroundMs),
    sessions: s,
    updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : 0,
    schemaVersion: typeof schemaVersion === 'number' ? schemaVersion : USAGE_RECORD_SCHEMA,
  };
}

export function parseRecords(raw: unknown): DailyUsageRecord[] {
  if (!Array.isArray(raw)) return [];
  return mergeRecords([], raw.map(parseRecord).filter((r): r is DailyUsageRecord => r !== null));
}

/**
 * Combines records so each app has one record per day. A day is recomputed in full on every
 * refresh, so the newest computation wins; when two have the same time, the larger total is
 * kept (Android may drop old events, which can only make a recomputation smaller).
 * Applying the same refresh twice gives the same result.
 */
export function mergeRecords(existing: DailyUsageRecord[], incoming: DailyUsageRecord[]): DailyUsageRecord[] {
  const byId = new Map<string, DailyUsageRecord>();
  for (const r of [...existing, ...incoming]) {
    const prev = byId.get(r.id);
    if (!prev || r.updatedAt > prev.updatedAt || (r.updatedAt === prev.updatedAt && r.foregroundMs > prev.foregroundMs)) {
      byId.set(r.id, r);
    }
  }
  return [...byId.values()].sort((a, b) => (a.day === b.day ? a.appId.localeCompare(b.appId) : a.day < b.day ? -1 : 1));
}

export interface AppUsageToday {
  app: SupportedApp;
  setting: TrackedAppSetting;
  /** Null when there is no measurement for today. */
  usedMs: number | null;
  sessions: number | null;
  status: UsageStatus;
}

export interface DayTotal {
  day: string;
  /** Null when the day was never measured (tracking off, no permission, before setup). */
  totalMs: number | null;
}

export interface UsageSummary {
  today: string;
  /**
   * False when Usage Access is off: today's figures (if any) are stored from before and are not
   * updating. History stays visible.
   */
  measuring: boolean;
  apps: AppUsageToday[];
  /** Sum over the selected apps. Time in two apps shown side by side counts for both. */
  totalTodayMs: number | null;
  /** The last 7 local days, oldest first, today last. */
  week: DayTotal[];
  /** Average of the measured days before today in `week`. Null with fewer than 3 measured days. */
  averageMs: number | null;
  measuredPastDays: number;
}

export const MIN_DAYS_FOR_AVERAGE = 3;

export function summarize(records: DailyUsageRecord[], tracked: TrackedAppSetting[], fresh: Freshness, now: number): UsageSummary {
  const today = shiftLocalDay(now, 0);
  const selected = new Set(tracked.map(t => t.appId));
  const byKey = new Map(records.filter(r => selected.has(r.appId)).map(r => [r.id, r]));

  const apps: AppUsageToday[] = [];
  for (const setting of tracked) {
    const app = getSupportedApp(setting.appId);
    if (!app) continue;
    const rec = fresh === 'missing' ? undefined : byKey.get(recordId(today, setting.appId));
    const usedMs = rec ? rec.foregroundMs : null;
    apps.push({ app, setting, usedMs, sessions: rec ? rec.sessions : null, status: usageStatus(usedMs, setting.limitMinutes, fresh) });
  }
  // Highest usage first; apps without data at the end.
  apps.sort((a, b) => (b.usedMs ?? -1) - (a.usedMs ?? -1) || a.app.label.localeCompare(b.app.label));

  const week: DayTotal[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const day = shiftLocalDay(now, offset);
    if (offset === 0 && fresh === 'missing') { week.push({ day, totalMs: null }); continue; }
    let total: number | null = null;
    for (const t of tracked) {
      const rec = byKey.get(recordId(day, t.appId));
      if (rec) total = (total ?? 0) + rec.foregroundMs;
    }
    week.push({ day, totalMs: total });
  }

  const past = week.slice(0, -1).filter(d => d.totalMs !== null) as { day: string; totalMs: number }[];
  const averageMs = past.length >= MIN_DAYS_FOR_AVERAGE ? past.reduce((s, d) => s + d.totalMs, 0) / past.length : null;
  const measuredToday = apps.filter(a => a.usedMs !== null);
  const totalTodayMs = measuredToday.length ? measuredToday.reduce((s, a) => s + (a.usedMs ?? 0), 0) : null;

  return { today, measuring: fresh !== 'no-access', apps, totalTodayMs, week, averageMs, measuredPastDays: past.length };
}

export interface UsageInsight {
  id: string;
  tone: 'warning' | 'info' | 'positive';
  text: string;
}

/**
 * Plain observations from measured data only. Returns nothing when there is not enough data.
 * `label` lets the caller mask app names (Hidden Mode).
 */
export function buildUsageInsights(summary: UsageSummary, label: (app: SupportedApp) => string, fmt: (ms: number) => string): UsageInsight[] {
  const out: UsageInsight[] = [];
  for (const a of summary.apps) {
    if (a.status.level === 'red' && a.usedMs !== null && a.setting.limitMinutes) {
      out.push({ id: `over-${a.app.id}`, tone: 'warning', text: t('usage.over', { app: label(a.app), amount: fmt(a.usedMs - a.setting.limitMinutes * 60_000) }) });
    }
  }
  const measured = summary.apps.filter(a => (a.usedMs ?? 0) > 0);
  if (summary.measuring && summary.totalTodayMs !== null && summary.totalTodayMs >= 10 * 60_000 && measured.length >= 2) {
    const top = measured[0];
    const share = Math.round(((top.usedMs ?? 0) / summary.totalTodayMs) * 100);
    if (share >= 50) out.push({ id: 'top-share', tone: 'info', text: t('usage.topShare', { app: label(top.app), share }) });
  }
  const yesterday = summary.week[summary.week.length - 2];
  const before = summary.week.slice(0, -2).filter(d => d.totalMs !== null) as { totalMs: number }[];
  if (yesterday?.totalMs !== null && yesterday?.totalMs !== undefined && before.length >= MIN_DAYS_FOR_AVERAGE) {
    const avg = before.reduce((s, d) => s + d.totalMs, 0) / before.length;
    if (avg >= 5 * 60_000) {
      const change = Math.round(((yesterday.totalMs - avg) / avg) * 100);
      if (Math.abs(change) >= 10) {
        out.push({
          id: 'yesterday-vs-avg',
          tone: change < 0 ? 'positive' : 'info',
          text: t(change < 0 ? 'usage.yesterdayLower' : 'usage.yesterdayHigher', { total: fmt(yesterday.totalMs), pct: Math.abs(change), count: before.length }),
        });
      }
    }
  }
  return out;
}
