'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PermissionState } from '@capacitor/core';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  UsageSettings, loadUsageSettings, saveUsageSettings, defaultUsageSettings, toggleApp, setAppLimit, startTracking,
  USAGE_SETTINGS_EVENT, USAGE_SETTINGS_KEY,
} from '@/lib/usage/settings';
import { getUsagePlatform, getUsageRepository, UsagePlatform, UsageStatusSnapshot } from '@/lib/usage/repository';
import { DailyUsageRecord, summarize } from '@/lib/usage/records';
import { currentFreshness, shiftLocalDay } from '@/lib/usage/status';
import { t } from '@/i18n/translate';
import { useI18n } from '@/i18n/I18nProvider';

/** Platform, read after mount so the server render and the first client render match. */
export function useUsagePlatform(): UsagePlatform | null {
  const [platform, setPlatform] = useState<UsagePlatform | null>(null);
  useEffect(() => { setPlatform(getUsagePlatform()); }, []);
  return platform;
}

export type ScreenTimePhase = 'loading' | 'unsupported' | 'ready';

const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : t('usage.genericError'));

export function useScreenTime() {
  const { hiddenMode, hiddenTitle } = usePrivacy();
  const repo = useMemo(() => getUsageRepository(), []);
  const [phase, setPhase] = useState<ScreenTimePhase>('loading');
  const [settings, setSettings] = useState<UsageSettings>(defaultUsageSettings);
  const [status, setStatus] = useState<UsageStatusSnapshot | null>(null);
  const [records, setRecords] = useState<DailyUsageRecord[]>([]);
  const [installed, setInstalled] = useState<Set<string> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const privacy = useRef({ discreet: hiddenMode, discreetTitle: hiddenTitle });
  privacy.current = { discreet: hiddenMode, discreetTitle: hiddenTitle };
  const busy = useRef(false);
  // A request that arrived while another was running; it runs once that one finishes.
  const queued = useRef<{ refresh: boolean; days?: number } | null>(null);

  const load = useCallback(async (opts: { refresh: boolean; days?: number }): Promise<void> => {
    if (repo.platform !== 'android') return;
    if (busy.current) {
      const q = queued.current;
      queued.current = { refresh: opts.refresh || !!q?.refresh, days: Math.max(opts.days ?? 2, q?.days ?? 0) };
      return;
    }
    busy.current = true;
    setRefreshing(opts.refresh);
    setError('');
    try {
      const s = settingsRef.current;
      await repo.applySettings(s, privacy.current);
      let st = await repo.getStatus();
      if (opts.refresh && s.trackingEnabled && s.apps.length > 0 && st.usageAccess === 'granted') {
        await repo.refresh(opts.days ?? 2);
        st = await repo.getStatus();
      }
      const t = Date.now();
      setStatus(st);
      setRecords(await repo.getDailyUsage(shiftLocalDay(t, 7), shiftLocalDay(t, 0)));
      setNow(t);
    } catch (e) {
      setError(errorText(e));
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
    const next = queued.current;
    queued.current = null;
    if (next) await load(next);
  }, [repo]);

  // Initial load: settings, installed apps, then a refresh.
  useEffect(() => {
    const s = loadUsageSettings();
    setSettings(s);
    settingsRef.current = s;
    if (repo.platform !== 'android') { setPhase('unsupported'); return; }
    setPhase('ready');
    repo.getInstalledAppIds().then(setInstalled).catch(() => setInstalled(new Set()));
    // The native side widens this to every day since the last refresh (the whole week the first time).
    void load({ refresh: true, days: 2 });
  }, [repo, load]);

  // Refresh when ZenFuel comes back to the foreground (for example after granting Usage Access).
  useEffect(() => {
    if (repo.platform !== 'android') return;
    const onVisible = () => { if (document.visibilityState === 'visible') void load({ refresh: true }); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [repo, load]);

  // Keep "updated N minutes ago" and the stale check current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Settings changed in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === USAGE_SETTINGS_KEY) setSettings(loadUsageSettings()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: UsageSettings, opts: { refresh?: boolean } = {}) => {
    saveUsageSettings(next);
    setSettings(next);
    settingsRef.current = next;
    // 7 days so a newly added app gets its recent history straight away.
    void load({ refresh: !!opts.refresh, days: 7 });
  }, [load]);

  // Usage Access is re-read from Android on every load (open, return to foreground, refresh), and
  // a revoked permission outranks the last refresh time.
  const fresh = status ? currentFreshness(status.usageAccess, status.lastSyncAt, now) : 'missing';
  const summary = useMemo(() => summarize(records, settings.apps, fresh, now), [records, settings.apps, fresh, now]);

  return {
    phase,
    platform: repo.platform,
    settings,
    status,
    records,
    summary,
    freshness: fresh,
    installed,
    refreshing,
    error,
    now,
    refresh: () => load({ refresh: true, days: 2 }),
    /**
     * The user read the explanation and confirmed exactly these apps, replacing any earlier
     * selection. Usage Access is granted separately. Does nothing for an empty selection.
     */
    enableTracking: (appIds: string[]) => {
      const next = startTracking(settingsRef.current, appIds, Date.now());
      if (next) update(next, { refresh: true });
    },
    disableTracking: () => update({ ...settingsRef.current, trackingEnabled: false, alertsEnabled: false }),
    toggleApp: (appId: string, selected: boolean) => update(toggleApp(settingsRef.current, appId, selected), { refresh: selected }),
    setLimit: (appId: string, minutes: number | null) => update(setAppLimit(settingsRef.current, appId, minutes)),
    setAlertsEnabled: async (on: boolean): Promise<PermissionState | null> => {
      if (!on) { update({ ...settingsRef.current, alertsEnabled: false }); return null; }
      const perm = await repo.requestNotificationPermission();
      if (perm === 'granted') update({ ...settingsRef.current, alertsEnabled: true });
      else void load({ refresh: false });
      return perm;
    },
    setShowAppNames: (on: boolean) => update({ ...settingsRef.current, alertShowAppNames: on }),
    openUsageAccessSettings: () => repo.openUsageAccessSettings(),
    openNotificationSettings: () => repo.openNotificationSettings(),
    deleteHistory: async () => {
      try {
        await repo.clearUsageData();
        setRecords([]);
        setStatus(await repo.getStatus());
      } catch (e) {
        setError(errorText(e));
      }
    },
  };
}

/** Mirrors screen-time settings and Hidden Mode to the native side whenever either changes. */
export function useUsageConfigSync(isLoaded: boolean) {
  const { hiddenMode, hiddenTitle } = usePrivacy();
  // Re-sent when the language changes, so background limit alerts use the app's language.
  const { locale } = useI18n();
  useEffect(() => {
    if (!isLoaded) return;
    const repo = getUsageRepository();
    if (repo.platform !== 'android') return;
    const apply = () => { void repo.applySettings(loadUsageSettings(), { discreet: hiddenMode, discreetTitle: hiddenTitle, locale }).catch(() => {}); };
    apply();
    window.addEventListener(USAGE_SETTINGS_EVENT, apply);
    return () => window.removeEventListener(USAGE_SETTINGS_EVENT, apply);
  }, [isLoaded, hiddenMode, hiddenTitle, locale]);
}
