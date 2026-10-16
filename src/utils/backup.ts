// Full backup / restore of the data ZenFuel keeps in localStorage.
//
// Restores are all-or-nothing: a file is fully parsed and validated before anything is
// written, and if any write fails every touched key is put back to its previous value.

import { LogEntry, Habit, Challenge, Goal, AppSettings, HabitCategory, GoalType } from '@/types';
import { Subscription, SubscriptionPlan, SubscriptionStatus, PaymentProvider } from '@/types/subscription';
import { NotificationPrefs, PREFS_KEY } from '@/lib/notifications';
import { SUB_KEY } from './subscription';
import { KEYS, storage } from './storage';

export const BACKUP_FORMAT = 'zenfuel-backup';
export const BACKUP_VERSION = 3;
// Period exports from the Reports page. They hold only part of the history, so they are
// never accepted as a backup.
export const REPORT_EXPORT_FORMAT = 'zenfuel-report-entries';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

// Each field is the stored value, or null when that key is absent on the device.
export interface BackupData {
  entries: LogEntry[] | null;
  habits: Habit[] | null;
  challenges: Challenge[] | null;
  goals: Goal[] | null;
  settings: Partial<AppSettings> | null;
  notificationPrefs: Partial<NotificationPrefs> | null;
  subscription: Subscription | null;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  app: 'ZenFuel';
  exportedAt: string;
  data: BackupData;
}

const FIELD_KEYS: Record<keyof BackupData, string> = {
  entries: KEYS.ENTRIES,
  habits: KEYS.HABITS,
  challenges: KEYS.CHALLENGES,
  goals: KEYS.GOALS,
  settings: KEYS.SETTINGS,
  notificationPrefs: PREFS_KEY,
  subscription: SUB_KEY,
};

// ── Export ────────────────────────────────────────────────────────────────────

function readRaw(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function createBackup(): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: 'ZenFuel',
    exportedAt: new Date().toISOString(),
    data: {
      // Entries go through the same migration the app applies when reading them.
      entries: localStorage.getItem(KEYS.ENTRIES) === null ? null : storage.getEntries(),
      habits: readRaw(KEYS.HABITS) as Habit[] | null,
      challenges: readRaw(KEYS.CHALLENGES) as Challenge[] | null,
      goals: readRaw(KEYS.GOALS) as Goal[] | null,
      settings: readRaw(KEYS.SETTINGS) as Partial<AppSettings> | null,
      notificationPrefs: readRaw(PREFS_KEY) as Partial<NotificationPrefs> | null,
      subscription: readRaw(SUB_KEY) as Subscription | null,
    },
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

class InvalidBackup extends Error {}
const fail = (msg: string): never => { throw new InvalidBackup(msg); };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const HABIT_CATEGORIES: HabitCategory[] = ['digital', 'adult', 'food', 'substance', 'other'];
const GOAL_TYPES: GoalType[] = ['reduce_by_percent', 'max_per_week', 'streak_days', 'free_for_days'];
const PLANS: SubscriptionPlan[] = ['free', 'monthly', 'yearly', 'lifetime'];
const STATUSES: SubscriptionStatus[] = ['active', 'trial', 'expired', 'cancelled'];
const PROVIDERS: PaymentProvider[] = ['stripe', 'razorpay', 'google_play', 'apple_iap', 'demo'];

function req<T>(o: Obj, key: string, check: (v: unknown) => v is T, where: string): T {
  const v = o[key];
  if (!check(v)) fail(`${where}: "${key}" is missing or has the wrong type.`);
  return v as T;
}

function validateEntry(v: unknown, where: string): LogEntry {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const id = req(v, 'id', isStr, where);
  const date = req(v, 'date', isStr, where);
  const time = req(v, 'time', isStr, where);
  const timestamp = req(v, 'timestamp', isNum, where);
  if (!id) fail(`${where}: "id" is empty.`);
  if (!DATE_RE.test(date)) fail(`${where}: "date" must look like YYYY-MM-DD.`);
  if (!TIME_RE.test(time)) fail(`${where}: "time" must look like HH:MM.`);
  // Older versions stored entries without habitId; the app reads those as 'masturbation'.
  if (v.habitId !== undefined && !isStr(v.habitId)) fail(`${where}: "habitId" has the wrong type.`);
  if (v.notes !== undefined && v.notes !== null && !isStr(v.notes)) fail(`${where}: "notes" has the wrong type.`);
  if (v.createdAt !== undefined && !isNum(v.createdAt)) fail(`${where}: "createdAt" has the wrong type.`);
  if (v.updatedAt !== undefined && !isNum(v.updatedAt)) fail(`${where}: "updatedAt" has the wrong type.`);
  return {
    id,
    habitId: (v.habitId as string | undefined) ?? 'masturbation',
    date,
    time,
    timestamp,
    notes: isStr(v.notes) ? v.notes : undefined,
    createdAt: (v.createdAt as number | undefined) ?? timestamp,
    updatedAt: (v.updatedAt as number | undefined) ?? timestamp,
  };
}

function validateHabit(v: unknown, where: string): Habit {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const category = req(v, 'category', isStr, where) as HabitCategory;
  if (!HABIT_CATEGORIES.includes(category)) fail(`${where}: unknown category "${category}".`);
  if (v.isHidden !== undefined && !isBool(v.isHidden)) fail(`${where}: "isHidden" has the wrong type.`);
  return {
    id: req(v, 'id', isStr, where),
    name: req(v, 'name', isStr, where),
    icon: req(v, 'icon', isStr, where),
    color: req(v, 'color', isStr, where),
    category,
    isDefault: req(v, 'isDefault', isBool, where),
    createdAt: req(v, 'createdAt', isNum, where),
    ...(v.isHidden !== undefined ? { isHidden: v.isHidden as boolean } : {}),
  };
}

function validateChallenge(v: unknown, where: string): Challenge {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const durationDays = req(v, 'durationDays', isNum, where);
  if (durationDays <= 0) fail(`${where}: "durationDays" must be positive.`);
  if (v.startDate !== null && !isStr(v.startDate)) fail(`${where}: "startDate" has the wrong type.`);
  if (v.startedAt !== undefined && !isNum(v.startedAt)) fail(`${where}: "startedAt" has the wrong type.`);
  return {
    id: req(v, 'id', isStr, where),
    name: req(v, 'name', isStr, where),
    description: req(v, 'description', isStr, where),
    habitId: req(v, 'habitId', isStr, where),
    durationDays,
    startDate: v.startDate as string | null,
    isActive: req(v, 'isActive', isBool, where),
    isCompleted: req(v, 'isCompleted', isBool, where),
    isBuiltIn: req(v, 'isBuiltIn', isBool, where),
    createdAt: req(v, 'createdAt', isNum, where),
    ...(v.startedAt !== undefined ? { startedAt: v.startedAt as number } : {}),
  };
}

function validateGoal(v: unknown, where: string): Goal {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const type = req(v, 'type', isStr, where) as GoalType;
  if (!GOAL_TYPES.includes(type)) fail(`${where}: unknown goal type "${type}".`);
  return {
    id: req(v, 'id', isStr, where),
    name: req(v, 'name', isStr, where),
    habitId: req(v, 'habitId', isStr, where),
    type,
    targetValue: req(v, 'targetValue', isNum, where),
    startDate: req(v, 'startDate', isStr, where),
    isActive: req(v, 'isActive', isBool, where),
    createdAt: req(v, 'createdAt', isNum, where),
  };
}

// Settings and notification prefs are stored as partial objects merged over defaults.
function validatePartial<T>(v: unknown, where: string, shape: Record<string, (x: unknown) => boolean>): Partial<T> {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const out: Obj = {};
  for (const [key, check] of Object.entries(shape)) {
    if (v[key] === undefined) continue;
    if (!check(v[key])) fail(`${where}: "${key}" has the wrong type.`);
    out[key] = v[key];
  }
  return out as Partial<T>;
}

const SETTINGS_SHAPE = {
  theme: (x: unknown) => x === 'light' || x === 'dark',
  pinEnabled: isBool, pinHash: isStr, pinLength: isNum, autoLockMinutes: isNum, hiddenMode: isBool, hiddenTitle: isStr,
};
const isTime = (x: unknown) => isStr(x) && TIME_RE.test(x);
const NOTIFICATION_SHAPE = {
  enabled: isBool, morningEnabled: isBool, morningTime: isTime, eveningEnabled: isBool, eveningTime: isTime,
  vulnerableEnabled: isBool, vulnerableTime: isTime, userName: isStr, fcmToken: isStr,
};

function validateSubscription(v: unknown, where: string): Subscription {
  if (!isObj(v)) return fail(`${where} is not an object.`);
  const plan = req(v, 'plan', isStr, where) as SubscriptionPlan;
  const status = req(v, 'status', isStr, where) as SubscriptionStatus;
  if (!PLANS.includes(plan)) fail(`${where}: unknown plan "${plan}".`);
  if (!STATUSES.includes(status)) fail(`${where}: unknown status "${status}".`);
  if (v.expiresAt !== null && !isNum(v.expiresAt)) fail(`${where}: "expiresAt" has the wrong type.`);
  if (v.provider !== null && !PROVIDERS.includes(v.provider as PaymentProvider)) fail(`${where}: unknown provider.`);
  if (v.transactionId !== undefined && !isStr(v.transactionId)) fail(`${where}: "transactionId" has the wrong type.`);
  if (v.trialEndsAt !== undefined && !isNum(v.trialEndsAt)) fail(`${where}: "trialEndsAt" has the wrong type.`);
  return {
    plan, status,
    startedAt: req(v, 'startedAt', isNum, where),
    expiresAt: v.expiresAt as number | null,
    provider: v.provider as PaymentProvider | null,
    ...(v.transactionId !== undefined ? { transactionId: v.transactionId as string } : {}),
    ...(v.trialEndsAt !== undefined ? { trialEndsAt: v.trialEndsAt as number } : {}),
  };
}

function validateList<T extends { id: string }>(v: unknown, label: string, one: (x: unknown, where: string) => T): T[] {
  if (!Array.isArray(v)) return fail(`"${label}" is not a list.`);
  const items = v.map((x, i) => one(x, `${label} #${i + 1}`));
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) fail(`${label}: the id "${item.id}" appears more than once.`);
    seen.add(item.id);
  }
  return items;
}

// undefined in the input means "not part of this file" (kept as undefined: leave as is).
function field<T>(v: unknown, parse: (x: unknown) => T): T | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return parse(v);
}

// ── Parsing ───────────────────────────────────────────────────────────────────

export interface BackupSummary {
  entryCount: number;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
  customHabitCount: number | null;
  goalCount: number | null;
  customChallengeCount: number | null;
  includesSettings: boolean;
  pinEnabled: boolean;
  includesNotificationPrefs: boolean;
  includesSubscription: boolean;
}

export type ParsedBackup =
  // A full backup: every defined field replaces the matching data on this device.
  | { kind: 'full'; exportedAt: string | null; data: { [K in keyof BackupData]?: BackupData[K] }; summary: BackupSummary }
  // A bare entries array exported by earlier versions of ZenFuel.
  | { kind: 'legacy-entries'; exportedAt: null; entries: LogEntry[]; summary: BackupSummary };

export type ParseResult = { ok: true; backup: ParsedBackup } | { ok: false; error: string };

function summarize(data: { [K in keyof BackupData]?: BackupData[K] }): BackupSummary {
  const entries = data.entries ?? [];
  const dates = entries.map(e => e.date).sort();
  const settings = data.settings ?? null;
  return {
    entryCount: entries.length,
    firstEntryDate: dates[0] ?? null,
    lastEntryDate: dates[dates.length - 1] ?? null,
    customHabitCount: data.habits === undefined ? null : (data.habits ?? []).filter(h => !h.isDefault).length,
    goalCount: data.goals === undefined ? null : (data.goals ?? []).length,
    customChallengeCount: data.challenges === undefined ? null : (data.challenges ?? []).filter(c => !c.isBuiltIn).length,
    includesSettings: data.settings !== undefined,
    pinEnabled: !!settings?.pinEnabled,
    includesNotificationPrefs: data.notificationPrefs !== undefined,
    includesSubscription: data.subscription !== undefined,
  };
}

function parseData(d: Obj): { [K in keyof BackupData]?: BackupData[K] } {
  return {
    entries: field(d.entries, v => validateList(v, 'entries', validateEntry)),
    habits: field(d.habits, v => validateList(v, 'habits', validateHabit)),
    challenges: field(d.challenges, v => validateList(v, 'challenges', validateChallenge)),
    goals: field(d.goals, v => validateList(v, 'goals', validateGoal)),
    settings: field(d.settings, v => validatePartial<AppSettings>(v, 'settings', SETTINGS_SHAPE)),
    notificationPrefs: field(d.notificationPrefs, v => validatePartial<NotificationPrefs>(v, 'notification preferences', NOTIFICATION_SHAPE)),
    subscription: field(d.subscription, v => validateSubscription(v, 'plan status')),
  };
}

export function parseBackupText(text: string): ParseResult {
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { ok: false, error: 'This file is not valid JSON.' }; }

  try {
    if (Array.isArray(json)) {
      const entries = validateList(json, 'entries', validateEntry);
      return { ok: true, backup: { kind: 'legacy-entries', exportedAt: null, entries, summary: summarize({ entries }) } };
    }
    if (!isObj(json)) return { ok: false, error: 'This file is not a ZenFuel backup.' };

    if (json.format === REPORT_EXPORT_FORMAT) {
      return { ok: false, error: 'This is a report export, which holds only one period of entries — not a backup. Use "Export backup" in Settings to create a file you can restore.' };
    }

    if (json.format === BACKUP_FORMAT) {
      if (!isNum(json.version)) return { ok: false, error: 'This backup has no version number.' };
      if (json.version > BACKUP_VERSION) return { ok: false, error: 'This backup was made by a newer version of ZenFuel. Update the app and try again.' };
      if (!isObj(json.data)) return { ok: false, error: 'This backup has no data section.' };
      const data = parseData(json.data);
      // A current-format backup must describe every field, so a restore fully replaces the data.
      for (const key of Object.keys(FIELD_KEYS) as (keyof BackupData)[]) {
        if (data[key] === undefined) fail(`This backup is missing "${key}".`);
      }
      const exportedAt = isStr(json.exportedAt) ? json.exportedAt : null;
      return { ok: true, backup: { kind: 'full', exportedAt, data, summary: summarize(data) } };
    }

    // Earlier object-shaped backups ({ version: 2, entries, habits, ... }) without a format tag.
    if (Array.isArray(json.entries)) {
      const data = parseData(json);
      const exportedAt = isStr(json.exportedAt) ? json.exportedAt : null;
      return { ok: true, backup: { kind: 'full', exportedAt, data, summary: summarize(data) } };
    }

    return { ok: false, error: 'This file is not a ZenFuel backup.' };
  } catch (err) {
    if (err instanceof InvalidBackup) return { ok: false, error: `This backup could not be read: ${err.message}` };
    return { ok: false, error: 'This backup could not be read.' };
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────

export type RestoreMode = 'replace' | 'merge';
export type RestoreResult = { ok: true; entryCount: number } | { ok: false; error: string };

const sortEntries = (entries: LogEntry[]) => [...entries].sort((a, b) => b.timestamp - a.timestamp);

/** Applies a parsed backup. `merge` is only meaningful for legacy entries-only files. */
export function applyBackup(backup: ParsedBackup, mode: RestoreMode = 'replace'): RestoreResult {
  const writes = new Map<string, string | null>(); // null = remove the key

  if (backup.kind === 'legacy-entries') {
    let next = backup.entries;
    if (mode === 'merge') {
      const current = storage.getEntries();
      const known = new Set(current.map(e => e.id));
      next = [...current, ...backup.entries.filter(e => !known.has(e.id))];
    }
    writes.set(KEYS.ENTRIES, JSON.stringify(sortEntries(next)));
  } else {
    for (const [field, key] of Object.entries(FIELD_KEYS) as [keyof BackupData, string][]) {
      const value = backup.data[field];
      if (value === undefined) continue;
      writes.set(key, value === null ? null : JSON.stringify(field === 'entries' ? sortEntries(value as LogEntry[]) : value));
    }
  }
  // Not part of a backup: restart the auto-lock timer so a restored PIN does not lock instantly.
  writes.set(KEYS.LAST_ACTIVE, JSON.stringify(Date.now()));

  const previous = new Map<string, string | null>();
  for (const key of writes.keys()) previous.set(key, localStorage.getItem(key));
  try {
    for (const [key, value] of writes) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch {
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch {}
    }
    return { ok: false, error: 'Restore failed — there is not enough browser storage. Your existing data was left unchanged.' };
  }
  const count = backup.kind === 'legacy-entries' ? backup.entries.length : (backup.data.entries ?? []).length;
  return { ok: true, entryCount: count };
}
