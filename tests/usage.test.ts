// Screen-time logic tests: status thresholds, freshness, day boundaries, settings validation,
// record validation and de-duplication, summaries and insights, and catalog/manifest agreement.
// Run with `npm test`.
process.env.TZ = 'Asia/Kolkata';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  USAGE_STATUS_THRESHOLDS, levelForRatio, usageStatus, freshness, formatDuration, formatDurationLong, localDayKey,
  shiftLocalDay, startOfLocalDay, STALE_AFTER_MS, currentFreshness, statusLabel,
} from '../src/lib/usage/status';
import {
  sanitizeUsageSettings, toggleApp, setAppLimit, defaultUsageSettings, DEFAULT_LIMIT_MINUTES, sanitizeLimit,
  normalizeSelection, setSelectedApps, startTracking, toNativeConfig, limitAlertsState, UsageSettings,
} from '../src/lib/usage/settings';
import { parseRecord, parseRecords, mergeRecords, summarize, buildUsageInsights, DailyUsageRecord, recordId } from '../src/lib/usage/records';
import { SUPPORTED_APPS, OWN_PACKAGE, getSupportedApp } from '../src/lib/usage/catalog';

const MIN = 60_000;
const local = (y: number, mo: number, d: number, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const NOW = local(2026, 10, 24, 18, 0);
const rec = (day: string, appId: string, minutes: number, updatedAt = 1): DailyUsageRecord =>
  ({ id: recordId(day, appId), day, appId, foregroundMs: minutes * MIN, sessions: 1, updatedAt, schemaVersion: 1 });

// ── Status thresholds ─────────────────────────────────────────────────────────

test('threshold rule: green below 70%, yellow 70–100% inclusive, red above 100%', () => {
  assert.equal(USAGE_STATUS_THRESHOLDS.yellowFromRatio, 0.7);
  assert.equal(USAGE_STATUS_THRESHOLDS.redAboveRatio, 1);
  assert.equal(levelForRatio(0), 'green');
  assert.equal(levelForRatio(0.6999), 'green');
  assert.equal(levelForRatio(0.7), 'yellow');
  assert.equal(levelForRatio(1), 'yellow');
  assert.equal(levelForRatio(1.0001), 'red');
});

test('status boundaries for a 60-minute limit', () => {
  assert.equal(usageStatus(41 * MIN + 59_000, 60, 'fresh').level, 'green');
  assert.equal(usageStatus(42 * MIN, 60, 'fresh').level, 'yellow');
  assert.equal(usageStatus(60 * MIN, 60, 'fresh').level, 'yellow');
  assert.equal(usageStatus(60 * MIN + 1, 60, 'fresh').level, 'red');
});

test('missing or invalid data is never shown as green', () => {
  assert.equal(usageStatus(0, 60, 'missing').level, 'no-data');
  assert.equal(usageStatus(null, 60, 'fresh').level, 'no-data');
  assert.equal(usageStatus(undefined, 60, 'fresh').level, 'no-data');
  assert.equal(usageStatus(NaN, 60, 'fresh').level, 'no-data');
  assert.equal(usageStatus(-5, 60, 'fresh').level, 'no-data');
  assert.equal(usageStatus(0, 60, 'missing').stale, false);
});

test('stale data keeps its level but is flagged', () => {
  const s = usageStatus(10 * MIN, 60, 'stale');
  assert.equal(s.level, 'green');
  assert.equal(s.stale, true);
  assert.equal(usageStatus(10 * MIN, 60, 'fresh').stale, false);
});

test('no limit or a non-positive limit gives no-limit, not green', () => {
  assert.equal(usageStatus(10 * MIN, null, 'fresh').level, 'no-limit');
  assert.equal(usageStatus(10 * MIN, 0, 'fresh').level, 'no-limit');
  assert.equal(usageStatus(10 * MIN, -30, 'fresh').level, 'no-limit');
});

// ── Freshness and day boundaries ──────────────────────────────────────────────

test('freshness: missing before today, stale after an hour', () => {
  assert.equal(freshness(null, NOW), 'missing');
  assert.equal(freshness(local(2026, 10, 23, 23, 59), NOW), 'missing');
  assert.equal(freshness(NOW - 30 * MIN, NOW), 'fresh');
  assert.equal(freshness(NOW - STALE_AFTER_MS, NOW), 'fresh');
  assert.equal(freshness(NOW - STALE_AFTER_MS - 1, NOW), 'stale');
  assert.equal(freshness(startOfLocalDay(NOW), NOW), 'stale');
  assert.equal(freshness(NaN, NOW), 'missing');
});

test('local day keys use the device time zone', () => {
  assert.equal(localDayKey(local(2026, 10, 24, 0, 0)), '2026-10-24');
  assert.equal(localDayKey(local(2026, 10, 23, 23, 59)), '2026-10-23');
  assert.equal(localDayKey(Date.UTC(2026, 9, 23, 19, 0)), '2026-10-24'); // 00:30 in India
  assert.equal(shiftLocalDay(NOW, 0), '2026-10-24');
  assert.equal(shiftLocalDay(NOW, 6), '2026-10-18');
  assert.equal(shiftLocalDay(local(2026, 3, 1, 12), 1), '2026-02-28');
});

test('day shifting is calendar based across daylight saving changes', () => {
  const saved = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const afterChange = new Date(2026, 2, 9, 0, 30).getTime(); // just after midnight, day after DST start
    assert.equal(localDayKey(afterChange), '2026-03-09');
    assert.equal(shiftLocalDay(afterChange, 1), '2026-03-08');
    assert.equal(shiftLocalDay(afterChange, 2), '2026-03-07');
    const dstDay = new Date(2026, 2, 8, 12).getTime();
    assert.equal(new Date(startOfLocalDay(dstDay)).getHours(), 0);
  } finally {
    process.env.TZ = saved;
  }
});

test('durations are shown in hours and minutes, rounded down', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(59_999), '0m');
  assert.equal(formatDuration(45 * MIN), '45m');
  assert.equal(formatDuration(61 * MIN), '1h 01m');
  assert.equal(formatDuration(120 * MIN), '2h');
  assert.equal(formatDuration(-1), '0m');
  assert.equal(formatDuration(NaN), '0m');
  assert.equal(formatDurationLong(65 * MIN), '1 hour 5 minutes');
  assert.equal(formatDurationLong(0), '0 minutes');
});

// ── Settings ──────────────────────────────────────────────────────────────────

test('settings from storage are validated', () => {
  assert.deepEqual(sanitizeUsageSettings(null), defaultUsageSettings());
  assert.deepEqual(sanitizeUsageSettings('nope'), defaultUsageSettings());
  const s = sanitizeUsageSettings({
    trackingEnabled: true, consentedAt: 5, alertsEnabled: 'yes',
    apps: [
      { appId: 'instagram', limitMinutes: 30 },
      { appId: 'instagram', limitMinutes: 90 },
      { appId: 'not-an-app', limitMinutes: 30 },
      { appId: 'youtube', limitMinutes: -4 },
      { appId: 'reddit', limitMinutes: 99999, limitIsDefault: true },
      null, 'x',
    ],
  });
  assert.equal(s.trackingEnabled, true);
  assert.equal(s.alertsEnabled, false);
  assert.deepEqual(s.apps, [
    { appId: 'instagram', limitMinutes: 30, limitIsDefault: false },
    { appId: 'youtube', limitMinutes: null, limitIsDefault: false },
    { appId: 'reddit', limitMinutes: 1440, limitIsDefault: true },
  ]);
  assert.equal(sanitizeLimit('45'), 45);
  assert.equal(sanitizeLimit(''), null);
});

test('selecting an app adds a labelled default limit; changing it clears the default flag', () => {
  let s = toggleApp(defaultUsageSettings(), 'instagram', true);
  assert.deepEqual(s.apps, [{ appId: 'instagram', limitMinutes: DEFAULT_LIMIT_MINUTES, limitIsDefault: true }]);
  assert.equal(toggleApp(s, 'instagram', true), s, 'selecting twice changes nothing');
  s = setAppLimit(s, 'instagram', null);
  assert.deepEqual(s.apps[0], { appId: 'instagram', limitMinutes: null, limitIsDefault: false });
  s = toggleApp(s, 'instagram', false);
  assert.deepEqual(s.apps, []);
  assert.deepEqual(toggleApp(defaultUsageSettings(), 'unknown-app', true).apps, []);
});

// ── Records ───────────────────────────────────────────────────────────────────

test('malformed records from the native layer are rejected', () => {
  const ok = { day: '2026-10-24', appId: 'instagram', foregroundMs: 1000, sessions: 2, updatedAt: 5, schemaVersion: 1 };
  assert.deepEqual(parseRecord(ok), { ...ok, id: '2026-10-24:instagram' });
  for (const bad of [null, 'x', { ...ok, day: '24/10/2026' }, { ...ok, appId: '' }, { ...ok, foregroundMs: -1 },
    { ...ok, foregroundMs: NaN }, { ...ok, foregroundMs: '100' }, { ...ok, foregroundMs: 26 * 3_600_000 }]) {
    assert.equal(parseRecord(bad), null, JSON.stringify(bad));
  }
  assert.equal(parseRecord({ ...ok, sessions: -3 })?.sessions, 0);
  assert.deepEqual(parseRecords('not an array'), []);
});

test('refreshing never duplicates records', () => {
  const first = [rec('2026-10-24', 'instagram', 10, 1), rec('2026-10-24', 'youtube', 5, 1)];
  const second = [rec('2026-10-24', 'instagram', 25, 2)];
  const once = mergeRecords(first, second);
  assert.equal(once.length, 2);
  assert.equal(once.find(r => r.appId === 'instagram')?.foregroundMs, 25 * MIN);
  assert.deepEqual(mergeRecords(once, second), once, 'applying the same refresh again is a no-op');
  assert.deepEqual(mergeRecords(once, once), once);
  assert.equal(parseRecords([first[0], first[0], { ...first[0] }]).length, 1);
});

// ── Summaries ─────────────────────────────────────────────────────────────────

const tracked = [
  { appId: 'instagram', limitMinutes: 60, limitIsDefault: false },
  { appId: 'youtube', limitMinutes: null, limitIsDefault: false },
];

test('today: measured values, zero usage, and apps with no record', () => {
  const s = summarize([rec('2026-10-24', 'instagram', 50), rec('2026-10-24', 'reddit', 999)], tracked, 'fresh', NOW);
  const ig = s.apps.find(a => a.app.id === 'instagram')!;
  const yt = s.apps.find(a => a.app.id === 'youtube')!;
  assert.equal(ig.usedMs, 50 * MIN);
  assert.equal(ig.status.level, 'yellow');
  assert.equal(yt.usedMs, null);
  assert.equal(yt.status.level, 'no-data');
  assert.equal(s.totalTodayMs, 50 * MIN, 'unselected apps are not counted');
  const zero = summarize([rec('2026-10-24', 'instagram', 0)], tracked, 'fresh', NOW);
  assert.equal(zero.apps.find(a => a.app.id === 'instagram')!.status.level, 'green');
  assert.equal(zero.totalTodayMs, 0);
});

test('without a refresh today, nothing is shown for today', () => {
  const s = summarize([rec('2026-10-24', 'instagram', 50)], tracked, 'missing', NOW);
  assert.equal(s.totalTodayMs, null);
  assert.ok(s.apps.every(a => a.usedMs === null && a.status.level === 'no-data'));
  assert.equal(s.week[6].totalMs, null);
});

test('the 7-day view keeps unmeasured days empty and needs 3 days for an average', () => {
  const two = summarize([rec('2026-10-22', 'instagram', 30), rec('2026-10-23', 'instagram', 60)], tracked, 'fresh', NOW);
  assert.equal(two.week.length, 7);
  assert.equal(two.week[0].day, '2026-10-18');
  assert.equal(two.week[0].totalMs, null);
  assert.equal(two.averageMs, null);
  const three = summarize([rec('2026-10-21', 'youtube', 30), ...[22, 23].map(d => rec(`2026-10-${d}`, 'instagram', 60))], tracked, 'fresh', NOW);
  assert.equal(three.measuredPastDays, 3);
  assert.equal(three.averageMs, 50 * MIN);
});

test('insights come only from measured data', () => {
  const label = (a: { label: string }) => a.label;
  assert.deepEqual(buildUsageInsights(summarize([], tracked, 'fresh', NOW), label, formatDuration), []);
  const over = buildUsageInsights(summarize([rec('2026-10-24', 'instagram', 75), rec('2026-10-24', 'youtube', 5)], tracked, 'fresh', NOW), label, formatDuration);
  assert.ok(over.some(i => i.id === 'over-instagram' && i.text.includes('15m over')));
  assert.ok(over.some(i => i.id === 'top-share' && i.text.includes('94%')));
  const history = [19, 20, 21].map(d => rec(`2026-10-${d}`, 'instagram', 100)).concat(rec('2026-10-23', 'instagram', 50));
  const trend = buildUsageInsights(summarize(history, tracked, 'fresh', NOW), label, formatDuration);
  assert.ok(trend.some(i => i.id === 'yesterday-vs-avg' && i.text.includes('50% lower') && i.tone === 'positive'));
  const short = buildUsageInsights(summarize(history.slice(1), tracked, 'fresh', NOW), label, formatDuration);
  assert.ok(!short.some(i => i.id === 'yesterday-vs-avg'), 'needs 3 days before yesterday');
});

// ── Catalog and Android manifest ──────────────────────────────────────────────

test('catalog IDs and packages are unique and valid, and ZenFuel is never tracked', () => {
  const ids = SUPPORTED_APPS.map(a => a.id);
  const pkgs = SUPPORTED_APPS.flatMap(a => a.packages);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(pkgs).size, pkgs.length);
  assert.ok(ids.every(id => /^[a-z0-9-]{1,64}$/.test(id)), 'IDs must pass the native validation');
  assert.ok(pkgs.every(p => /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(p)));
  assert.ok(!pkgs.includes(OWN_PACKAGE));
  assert.equal(getSupportedApp('youtube')?.label, 'YouTube');
  const capConfig = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
  assert.equal(capConfig.appId, OWN_PACKAGE);
});

test('every catalog package is declared in the Android manifest <queries>, and nothing else', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const queries = manifest.match(/<queries>([\s\S]*?)<\/queries>/)?.[1] ?? '';
  const declared = [...queries.matchAll(/<package android:name="([^"]+)"/g)].map(m => m[1]).sort();
  assert.deepEqual(declared, SUPPORTED_APPS.flatMap(a => a.packages).sort());
  // Exactly these permissions: no QUERY_ALL_PACKAGES, accessibility, foreground service, location, contacts, mic or camera.
  const permissionTags = [...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*(tools:node="remove")?/g)];
  assert.deepEqual(permissionTags.filter(m => !m[2]).map(m => m[1]).sort(), ['android.permission.INTERNET', 'android.permission.PACKAGE_USAGE_STATS', 'android.permission.POST_NOTIFICATIONS']);
  assert.deepEqual(permissionTags.filter(m => m[2]).map(m => m[1]), ['android.permission.FOREGROUND_SERVICE'], 'the foreground-service permission is removed');
  // No services or receivers of our own; the only <service> entry removes WorkManager's foreground service.
  assert.ok(!/<receiver/.test(manifest));
  const services = [...manifest.matchAll(/<service[\s\S]*?\/>/g)].map(m => m[0]);
  assert.ok(services.length === 1 && services[0].includes('SystemForegroundService') && services[0].includes('tools:node="remove"'));
  assert.ok(manifest.includes('android:allowBackup="false"'));
});

// ── App selection matches consent ─────────────────────────────────────────────

const PRIVACY = { discreet: false, discreetTitle: '' };
const ids = (s: UsageSettings) => s.apps.map(a => a.appId);
/** Tracking was on for three apps; Instagram's limit was customised. */
const threeApps = (): UsageSettings => setAppLimit(
  { ...defaultUsageSettings(), trackingEnabled: true, consentedAt: 1, apps: ['instagram', 'youtube', 'reddit'].map(appId => ({ appId, limitMinutes: DEFAULT_LIMIT_MINUTES, limitIsDefault: true })) },
  'instagram', 30,
);

test('selection: confirming two of three previously selected apps keeps exactly those two', () => {
  const next = setSelectedApps(threeApps(), ['instagram', 'youtube']);
  assert.deepEqual(ids(next), ['instagram', 'youtube']);
  assert.deepEqual(next.apps[0], { appId: 'instagram', limitMinutes: 30, limitIsDefault: false }, 'a kept app keeps its limit');
});

test('selection: unticking an app removes it from the active (native) configuration', () => {
  const before = toggleApp(threeApps(), 'reddit', false);
  assert.deepEqual(ids(before), ['instagram', 'youtube']);
  const native = toNativeConfig(before, PRIVACY);
  assert.deepEqual(native.apps.map(a => a.id), ['instagram', 'youtube']);
  assert.ok(!native.apps.some(a => a.packages.includes('com.reddit.frontpage')), 'Reddit packages are no longer read');
});

test('selection: adding an app adds it with the default limit', () => {
  const next = setSelectedApps(threeApps(), ['instagram', 'youtube', 'reddit', 'tiktok']);
  assert.deepEqual(ids(next), ['instagram', 'youtube', 'reddit', 'tiktok']);
  assert.deepEqual(next.apps[3], { appId: 'tiktok', limitMinutes: DEFAULT_LIMIT_MINUTES, limitIsDefault: true });
  assert.deepEqual(toNativeConfig(next, PRIVACY).apps.find(a => a.id === 'tiktok')?.packages, ['com.zhiliaoapp.musically', 'com.ss.android.ugc.trill']);
});

test('selection: re-enabling tracking with a changed selection does not restore old apps', () => {
  const off = { ...threeApps(), trackingEnabled: false, alertsEnabled: false };
  const on = startTracking(off, ['youtube', 'snapchat'], 500);
  assert.ok(on);
  assert.equal(on.trackingEnabled, true);
  assert.equal(on.consentedAt, 500, 'consent time is the latest confirmation');
  assert.deepEqual(ids(on), ['youtube', 'snapchat']);
  const native = toNativeConfig(on, PRIVACY);
  assert.equal(native.enabled, true);
  assert.deepEqual(native.apps.map(a => a.id), ['youtube', 'snapchat']);
});

test('selection: empty or invalid selections are handled safely and repeated saves are idempotent', () => {
  const off = { ...threeApps(), trackingEnabled: false };
  assert.equal(startTracking(off, [], 1), null, 'nothing is turned on for an empty selection');
  assert.equal(startTracking(off, ['not-an-app', '', null, 7], 1), null);
  assert.deepEqual(normalizeSelection(['youtube', 'youtube', 'bogus', 'x', 42, 'youtube']), ['youtube', 'x']);
  const once = setSelectedApps(threeApps(), ['reddit', 'reddit', 'instagram']);
  assert.deepEqual(ids(once), ['reddit', 'instagram']);
  assert.deepEqual(setSelectedApps(once, ['reddit', 'instagram']), once, 'saving the same selection again changes nothing');
  // Removing every app leaves an empty native list, which stops background refresh.
  const none = setSelectedApps(threeApps(), []);
  assert.deepEqual(none.apps, []);
  assert.deepEqual(toNativeConfig(none, PRIVACY).apps, []);
});

test('selection: native configuration always mirrors web settings', () => {
  const s = sanitizeUsageSettings({ ...threeApps(), alertsEnabled: true, apps: [...threeApps().apps, { appId: 'unknown-app', limitMinutes: 5 }] });
  const native = toNativeConfig(s, { discreet: true, discreetTitle: 'Notes' });
  assert.deepEqual(native.apps.map(a => [a.id, a.limitMinutes]), s.apps.map(a => [a.appId, a.limitMinutes]));
  assert.equal(native.alertsEnabled, true);
  assert.equal(native.discreet, true);
  assert.equal(native.discreetTitle, 'Notes');
  assert.equal(toNativeConfig({ ...s, trackingEnabled: false }, PRIVACY).enabled, false);
  // The same IDs pass the native validation (UsageConfig.fromJson).
  assert.ok(native.apps.every(a => /^[a-z0-9-]{1,64}$/.test(a.id) && a.packages.length > 0));
});

test('selection: stored history is kept when an app is removed, and shows again if it is re-added', () => {
  const records = [rec('2026-10-22', 'reddit', 40), rec('2026-10-24', 'reddit', 10), rec('2026-10-24', 'instagram', 5)];
  const removed = setSelectedApps(threeApps(), ['instagram']);
  const without = summarize(records, removed.apps, 'fresh', NOW);
  assert.ok(!without.apps.some(a => a.app.id === 'reddit'), 'no longer shown as tracked');
  assert.equal(records.length, 3, 'changing the selection deletes nothing');
  const readded = summarize(records, setSelectedApps(removed, ['instagram', 'reddit']).apps, 'fresh', NOW);
  assert.equal(readded.week.find(d => d.day === '2026-10-22')?.totalMs, 40 * MIN);
});

// ── Limit alerts preference ───────────────────────────────────────────────────

test('alerts: the switch always shows the saved preference the native side acts on', () => {
  // Regression: with notifications blocked the switch used to show Off while alerts stayed on,
  // so alerts came back once notifications were allowed although the screen said Off.
  for (const n of ['denied', 'prompt', 'prompt-with-rationale']) {
    assert.deepEqual(limitAlertsState(true, n), { switchOn: true, blocked: true }, n);
  }
  assert.deepEqual(limitAlertsState(true, 'granted'), { switchOn: true, blocked: false });
  assert.deepEqual(limitAlertsState(true, undefined), { switchOn: true, blocked: false }, 'status not loaded yet');
  for (const n of ['granted', 'denied', undefined]) {
    assert.deepEqual(limitAlertsState(false, n), { switchOn: false, blocked: false }, `off stays off (${n})`);
  }
});

test('alerts: turning alerts off reaches the native configuration even while notifications are blocked', () => {
  const on = { ...threeApps(), alertsEnabled: true };
  assert.equal(toNativeConfig(on, PRIVACY).alertsEnabled, true);
  const off = { ...on, alertsEnabled: false };
  assert.equal(limitAlertsState(off.alertsEnabled, 'denied').switchOn, false);
  assert.equal(toNativeConfig(off, PRIVACY).alertsEnabled, false, 'native side sends no alerts');
  assert.equal(toNativeConfig(sanitizeUsageSettings({ ...on, alertsEnabled: 'true' }), PRIVACY).alertsEnabled, false, 'only a real true enables alerts');
});

// ── Usage Access revoked ──────────────────────────────────────────────────────

test('access: without Usage Access, freshness is no-access whatever the last refresh time', () => {
  assert.equal(currentFreshness('denied', NOW - 5 * MIN, NOW), 'no-access');
  assert.equal(currentFreshness('denied', null, NOW), 'no-access');
  assert.equal(currentFreshness('granted', NOW - 5 * MIN, NOW), 'fresh');
  assert.equal(currentFreshness('granted', NOW - STALE_AFTER_MS - 1, NOW), 'stale');
  assert.equal(currentFreshness('granted', null, NOW), 'missing', 'never refreshed');
  assert.equal(currentFreshness('granted', local(2026, 10, 23, 22), NOW), 'missing', 'not refreshed today');
});

test('access: revoked access with stored totals shows no green/yellow/red and keeps history', () => {
  const tr = [{ appId: 'instagram', limitMinutes: 60, limitIsDefault: false }, { appId: 'youtube', limitMinutes: 30, limitIsDefault: false }];
  const records = [rec('2026-10-23', 'instagram', 45), rec('2026-10-24', 'instagram', 20), rec('2026-10-24', 'youtube', 90)];
  const s = summarize(records, tr, currentFreshness('denied', NOW - 2 * MIN, NOW), NOW);
  assert.equal(s.measuring, false);
  for (const a of s.apps) {
    assert.equal(a.status.level, 'not-measuring');
    assert.equal(a.status.ratio, null, 'no progress toward the limit is shown');
    assert.equal(statusLabel(a.status), 'Not measuring');
  }
  assert.equal(s.apps.find(a => a.app.id === 'instagram')?.usedMs, 20 * MIN, 'stored figure kept (labelled as stored in the UI)');
  assert.equal(s.week.find(d => d.day === '2026-10-23')?.totalMs, 45 * MIN, 'history stays visible');
  const insights = buildUsageInsights(s, a => a.label, formatDuration);
  assert.ok(!insights.some(i => i.id.startsWith('over-') || i.id === 'top-share'), 'no current-day observations');
});

test('access: a missing measurement never becomes a false zero or false green', () => {
  const tr = [{ appId: 'instagram', limitMinutes: 60, limitIsDefault: false }];
  const revokedNoData = summarize([], tr, 'no-access', NOW);
  assert.equal(revokedNoData.apps[0].usedMs, null);
  assert.equal(revokedNoData.totalTodayMs, null);
  assert.equal(revokedNoData.apps[0].status.level, 'not-measuring');
  const never = summarize([rec('2026-10-24', 'instagram', 0)], tr, 'missing', NOW);
  assert.equal(never.apps[0].usedMs, null);
  assert.equal(never.totalTodayMs, null);
  assert.notEqual(never.apps[0].status.level, 'green');
});

test('access: stale data is always labelled as possibly out of date', () => {
  const s = summarize([rec('2026-10-24', 'instagram', 10)], [{ appId: 'instagram', limitMinutes: 60, limitIsDefault: false }], 'stale', NOW);
  assert.equal(s.apps[0].status.stale, true);
  assert.equal(statusLabel(s.apps[0].status), 'Under limit (may be out of date)');
  assert.equal(statusLabel(usageStatus(80 * MIN, 60, 'stale')), 'Over limit (may be out of date)');
});

test('access: re-granting and a successful refresh restores verified status from new data', () => {
  const tr = [{ appId: 'instagram', limitMinutes: 60, limitIsDefault: false }];
  const stored = [rec('2026-10-24', 'instagram', 20, 1)];
  assert.equal(summarize(stored, tr, currentFreshness('denied', NOW - 3 * MIN, NOW), NOW).apps[0].status.level, 'not-measuring');
  // Access granted again; the refresh just now recomputed today as 50 minutes.
  const refreshed = mergeRecords(stored, [rec('2026-10-24', 'instagram', 50, 2)]);
  const s = summarize(refreshed, tr, currentFreshness('granted', NOW, NOW), NOW);
  assert.equal(s.measuring, true);
  assert.equal(s.apps[0].usedMs, 50 * MIN);
  assert.equal(s.apps[0].status.level, 'yellow');
  assert.equal(statusLabel(s.apps[0].status), 'Near limit');
});
