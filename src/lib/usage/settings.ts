// Screen-time preferences, kept in localStorage like the rest of ZenFuel's settings.
// On Android the same values are mirrored to the native side (see repository.ts) so the
// background refresh and limit alerts can run while the app is closed.

import { getSupportedApp } from './catalog';
import type { NativeUsageConfig, NativeAlertMessages } from './plugin';
import { CATALOGS } from '../../i18n/translate';
import { DEFAULT_LOCALE, isLocale } from '../../i18n/locales';

export const USAGE_SETTINGS_KEY = 'zenfuel_usage_settings';
export const USAGE_SETTINGS_VERSION = 1;
/** Pre-filled limit for a newly selected app. Shown as a default until the user changes it. */
export const DEFAULT_LIMIT_MINUTES = 60;
export const MAX_LIMIT_MINUTES = 24 * 60;
// Fired in this tab when the settings change.
export const USAGE_SETTINGS_EVENT = 'zenfuel:usage-settings';

export interface TrackedAppSetting {
  appId: string;
  /** Daily limit in minutes, or null for no limit. */
  limitMinutes: number | null;
  /** True while the limit is still the pre-filled default. */
  limitIsDefault: boolean;
}

export interface UsageSettings {
  version: typeof USAGE_SETTINGS_VERSION;
  /** The user chose to turn tracking on. Android's Usage Access is checked separately. */
  trackingEnabled: boolean;
  /** When the user agreed to the explanation and turned tracking on (ms). */
  consentedAt: number | null;
  apps: TrackedAppSetting[];
  /** Local notification when a limit is reached. Off until the user turns it on. */
  alertsEnabled: boolean;
  /** Name the app in alerts. Off by default so the lock screen shows neutral text. */
  alertShowAppNames: boolean;
}

export function defaultUsageSettings(): UsageSettings {
  return { version: USAGE_SETTINGS_VERSION, trackingEnabled: false, consentedAt: null, apps: [], alertsEnabled: false, alertShowAppNames: false };
}

export function sanitizeLimit(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(MAX_LIMIT_MINUTES, Math.round(n));
}

/** Accepts anything read from storage and returns valid settings. Unknown apps and duplicates are dropped. */
export function sanitizeUsageSettings(raw: unknown): UsageSettings {
  const base = defaultUsageSettings();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const seen = new Set<string>();
  const apps: TrackedAppSetting[] = [];
  if (Array.isArray(r.apps)) {
    for (const a of r.apps) {
      if (!a || typeof a !== 'object') continue;
      const appId = (a as Record<string, unknown>).appId;
      if (typeof appId !== 'string' || !getSupportedApp(appId) || seen.has(appId)) continue;
      seen.add(appId);
      apps.push({
        appId,
        limitMinutes: sanitizeLimit((a as Record<string, unknown>).limitMinutes),
        limitIsDefault: (a as Record<string, unknown>).limitIsDefault === true,
      });
    }
  }
  return {
    version: USAGE_SETTINGS_VERSION,
    trackingEnabled: r.trackingEnabled === true,
    consentedAt: typeof r.consentedAt === 'number' && Number.isFinite(r.consentedAt) ? r.consentedAt : null,
    apps,
    alertsEnabled: r.alertsEnabled === true,
    alertShowAppNames: r.alertShowAppNames === true,
  };
}

export function loadUsageSettings(): UsageSettings {
  if (typeof window === 'undefined') return defaultUsageSettings();
  try {
    const raw = localStorage.getItem(USAGE_SETTINGS_KEY);
    return raw ? sanitizeUsageSettings(JSON.parse(raw)) : defaultUsageSettings();
  } catch {
    return defaultUsageSettings();
  }
}

export function saveUsageSettings(settings: UsageSettings): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(USAGE_SETTINGS_KEY, JSON.stringify(sanitizeUsageSettings(settings))); } catch {}
  try { window.dispatchEvent(new Event(USAGE_SETTINGS_EVENT)); } catch {}
}

export function toggleApp(settings: UsageSettings, appId: string, selected: boolean): UsageSettings {
  const has = settings.apps.some(a => a.appId === appId);
  if (selected && !has && getSupportedApp(appId)) {
    return { ...settings, apps: [...settings.apps, { appId, limitMinutes: DEFAULT_LIMIT_MINUTES, limitIsDefault: true }] };
  }
  if (!selected && has) return { ...settings, apps: settings.apps.filter(a => a.appId !== appId) };
  return settings;
}

export function setAppLimit(settings: UsageSettings, appId: string, limitMinutes: number | null): UsageSettings {
  const limit = sanitizeLimit(limitMinutes);
  return { ...settings, apps: settings.apps.map(a => (a.appId === appId ? { ...a, limitMinutes: limit, limitIsDefault: false } : a)) };
}

/** Supported app IDs from a selection, without duplicates, in the order given. Unknown IDs are dropped. */
export function normalizeSelection(appIds: readonly unknown[]): string[] {
  const out: string[] = [];
  for (const id of appIds) {
    if (typeof id === 'string' && getSupportedApp(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Makes the tracked apps exactly the given selection: unselected apps are removed, new apps get
 * the default limit, and apps that stay keep their limits. Measured history is not touched.
 */
export function setSelectedApps(settings: UsageSettings, appIds: readonly unknown[]): UsageSettings {
  const previous = new Map(settings.apps.map(a => [a.appId, a]));
  const apps = normalizeSelection(appIds).map(appId =>
    previous.get(appId) ?? { appId, limitMinutes: DEFAULT_LIMIT_MINUTES, limitIsDefault: true });
  return { ...settings, apps };
}

/**
 * The user confirmed the setup screen: tracking turns on for exactly these apps, replacing any
 * earlier selection. Returns null when no valid app was selected (tracking stays as it was).
 */
export function startTracking(settings: UsageSettings, appIds: readonly unknown[], now: number): UsageSettings | null {
  const next = setSelectedApps(settings, appIds);
  if (next.apps.length === 0) return null;
  return { ...next, trackingEnabled: true, consentedAt: now };
}

/**
 * What the Limit alerts control shows. The switch always shows the saved preference, which is what
 * the native side acts on, so it can always be turned off. `blocked`: alerts are on, but Android
 * won't show notifications right now; they resume by themselves once notifications are allowed.
 */
export function limitAlertsState(alertsEnabled: boolean, notifications: string | undefined): { switchOn: boolean; blocked: boolean } {
  return { switchOn: alertsEnabled, blocked: alertsEnabled && notifications !== undefined && notifications !== 'granted' };
}

/**
 * Limit-alert wording for the native side, in `locale`, with its {placeholders} kept for Kotlin
 * to fill in (counts and app names are only known when an alert fires).
 */
export function alertMessages(locale: string): NativeAlertMessages {
  const catalog = (CATALOGS[isLocale(locale) ? locale : DEFAULT_LOCALE] ?? CATALOGS[DEFAULT_LOCALE]) as Record<string, unknown>;
  const s = (key: string) => (typeof catalog[key] === 'string' ? catalog[key] as string : (CATALOGS[DEFAULT_LOCALE] as Record<string, unknown>)[key] as string);
  return {
    title: s('alerts.title'),
    one: s('alerts.one'),
    many: s('alerts.many'),
    namedOne: s('alerts.namedOne'),
    namedMany: s('alerts.namedMany'),
    discreet: s('notify.discreetBody'),
    channel: s('alerts.channel'),
    channelDescription: s('alerts.channelDesc'),
  };
}

/** The configuration sent to the native side. Its app list always equals `settings.apps`. */
export function toNativeConfig(settings: UsageSettings, privacy: { discreet: boolean; discreetTitle: string; locale?: string }): NativeUsageConfig {
  return {
    enabled: settings.trackingEnabled,
    apps: settings.apps.flatMap(t => {
      const app = getSupportedApp(t.appId);
      return app ? [{ id: app.id, label: app.label, packages: app.packages, limitMinutes: t.limitMinutes }] : [];
    }),
    alertsEnabled: settings.alertsEnabled,
    alertShowAppNames: settings.alertShowAppNames,
    discreet: privacy.discreet,
    discreetTitle: privacy.discreetTitle,
    messages: alertMessages(privacy.locale ?? DEFAULT_LOCALE),
  };
}
