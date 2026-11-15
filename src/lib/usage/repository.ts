// The boundary between the screen-time UI and wherever measured usage comes from.
//
// - Android app: the ZenUsage native plugin (UsageStatsManager), with records in an on-device
//   SQLite database owned by the plugin.
// - Website and any other platform: unsupported. Nothing is measured and nothing is simulated.
//
// A future iOS implementation (Screen Time / Family Controls) would be another implementation
// of this interface.

import { Capacitor, PermissionState } from '@capacitor/core';
import { SUPPORTED_APPS } from './catalog';
import { DailyUsageRecord, parseRecords } from './records';
import { UsageSettings, toNativeConfig } from './settings';
import { ZenUsage, NativeSyncResult, UsageAccessState } from './plugin';

export type UsagePlatform = 'android' | 'unsupported';

export interface UsageStatusSnapshot {
  usageAccess: UsageAccessState;
  notifications: PermissionState;
  lastSyncAt: number | null;
  lastSyncResult: NativeSyncResult | null;
  firstDay: string | null;
}

export interface UsageRepository {
  platform: UsagePlatform;
  getStatus(): Promise<UsageStatusSnapshot>;
  openUsageAccessSettings(): Promise<boolean>;
  openNotificationSettings(): Promise<boolean>;
  requestNotificationPermission(): Promise<PermissionState>;
  /** Supported app IDs with at least one package installed. */
  getInstalledAppIds(): Promise<Set<string>>;
  /** Mirrors settings to the native side, which schedules or cancels background refresh. */
  applySettings(settings: UsageSettings, privacy: { discreet: boolean; discreetTitle: string; locale?: string }): Promise<void>;
  refresh(days: number): Promise<{ result: NativeSyncResult; lastSyncAt: number | null }>;
  getDailyUsage(fromDay: string, toDay: string): Promise<DailyUsageRecord[]>;
  clearUsageData(): Promise<void>;
}

const unsupported = (): never => { throw new Error('Automatic usage tracking is only available in the ZenFuel Android app.'); };

const UnsupportedRepository: UsageRepository = {
  platform: 'unsupported',
  getStatus: async () => unsupported(),
  openUsageAccessSettings: async () => false,
  openNotificationSettings: async () => false,
  requestNotificationPermission: async () => 'denied',
  getInstalledAppIds: async () => new Set(),
  applySettings: async () => {},
  refresh: async () => unsupported(),
  getDailyUsage: async () => [],
  clearUsageData: async () => {},
};

const AndroidRepository: UsageRepository = {
  platform: 'android',
  async getStatus() {
    const s = await ZenUsage.getStatus();
    return {
      usageAccess: s.usageAccess === 'granted' ? 'granted' : 'denied',
      notifications: s.notifications,
      lastSyncAt: typeof s.lastSyncAt === 'number' && s.lastSyncAt > 0 ? s.lastSyncAt : null,
      lastSyncResult: s.lastSyncResult ?? null,
      firstDay: s.firstDay ?? null,
    };
  },
  async openUsageAccessSettings() {
    return (await ZenUsage.openUsageAccessSettings()).opened;
  },
  async openNotificationSettings() {
    return (await ZenUsage.openNotificationSettings()).opened;
  },
  async requestNotificationPermission() {
    return (await ZenUsage.requestPermissions({ permissions: ['notifications'] })).notifications;
  },
  async getInstalledAppIds() {
    const packages = SUPPORTED_APPS.flatMap(a => a.packages);
    const { installed } = await ZenUsage.getInstalledPackages({ packages });
    const set = new Set(Array.isArray(installed) ? installed : []);
    return new Set(SUPPORTED_APPS.filter(a => a.packages.some(p => set.has(p))).map(a => a.id));
  },
  async applySettings(settings, privacy) {
    // privacy.locale: the interface language for limit-alert wording.
    // Replaces the whole native configuration, so a removed app stops being measured.
    await ZenUsage.configure(toNativeConfig(settings, privacy));
  },
  async refresh(days) {
    return ZenUsage.refresh({ days: Math.max(1, Math.min(7, Math.round(days))) });
  },
  async getDailyUsage(fromDay, toDay) {
    const { records } = await ZenUsage.getDailyUsage({ fromDay, toDay });
    return parseRecords(records);
  },
  async clearUsageData() {
    await ZenUsage.clearUsageData();
  },
};

export function getUsagePlatform(): UsagePlatform {
  if (typeof window === 'undefined') return 'unsupported';
  try {
    return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('ZenUsage') ? 'android' : 'unsupported';
  } catch {
    return 'unsupported';
  }
}

export function getUsageRepository(): UsageRepository {
  return getUsagePlatform() === 'android' ? AndroidRepository : UnsupportedRepository;
}
