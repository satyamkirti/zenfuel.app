// TypeScript side of the ZenUsage Capacitor plugin
// (android/app/src/main/java/app/zenfuel/usage/UsagePlugin.kt).

import { registerPlugin, PermissionState } from '@capacitor/core';

export type UsageAccessState = 'granted' | 'denied';

export interface NativeUsageStatus {
  usageAccess: UsageAccessState;
  /** Android 13+ asks for this at runtime; older versions report 'granted'. */
  notifications: PermissionState;
  trackingEnabled: boolean;
  /** Last successful refresh (ms), or null. */
  lastSyncAt: number | null;
  lastSyncResult: NativeSyncResult | null;
  /** Earliest day kept on the device (YYYY-MM-DD), or null. */
  firstDay: string | null;
}

export type NativeSyncResult = 'ok' | 'permission-missing' | 'disabled' | 'no-apps' | 'error';

export interface NativeAppConfig {
  id: string;
  label: string;
  packages: string[];
  limitMinutes: number | null;
}

export interface NativeUsageConfig {
  enabled: boolean;
  apps: NativeAppConfig[];
  alertsEnabled: boolean;
  alertShowAppNames: boolean;
  /** Hidden Mode: alerts use neutral wording and this title. */
  discreet: boolean;
  discreetTitle: string;
  /**
   * Limit-alert wording in the person's chosen app language (not the phone's), so background
   * alerts match the app. Placeholders: {count}, {app}, {apps}. Missing → English on the native side.
   */
  messages?: NativeAlertMessages;
}

export interface NativeAlertMessages {
  title: string;
  one: string;
  many: string;
  namedOne: string;
  namedMany: string;
  discreet: string;
  channel: string;
  channelDescription: string;
}

export interface ZenUsagePlugin {
  getStatus(): Promise<NativeUsageStatus>;
  /** Opens Android's Usage Access screen. Returns false if no settings screen could be opened. */
  openUsageAccessSettings(): Promise<{ opened: boolean }>;
  openNotificationSettings(): Promise<{ opened: boolean }>;
  /** Which of the given packages are installed. Only packages declared in the manifest are visible. */
  getInstalledPackages(options: { packages: string[] }): Promise<{ installed: string[] }>;
  configure(config: NativeUsageConfig): Promise<void>;
  /** Recomputes the last `days` local days (1–7) from Android's usage events. */
  refresh(options: { days: number }): Promise<{ result: NativeSyncResult; lastSyncAt: number | null }>;
  getDailyUsage(options: { fromDay: string; toDay: string }): Promise<{ records: unknown[] }>;
  clearUsageData(): Promise<void>;
  checkPermissions(): Promise<{ notifications: PermissionState }>;
  requestPermissions(options?: { permissions: 'notifications'[] }): Promise<{ notifications: PermissionState }>;
}

export const ZenUsage = registerPlugin<ZenUsagePlugin>('ZenUsage');
