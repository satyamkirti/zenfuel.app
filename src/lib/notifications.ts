/**
 * Reminder notifications for ZenFuel.
 *
 * What works today (no backend):
 * - Reminders are scheduled with timers while ZenFuel is open in a tab or an installed
 *   app window. Nothing is delivered while the app is closed.
 * - Notifications are shown through a small service worker (public/sw.js) where the browser
 *   requires one (Chrome on Android), otherwise with the Notification API.
 * - Preferences are stored in localStorage.
 *
 * Planned, not built: background push through Firebase Cloud Messaging (notes at the end).
 */

export interface NotificationPrefs {
  enabled: boolean;
  morningEnabled: boolean;
  morningTime: string;        // "HH:MM"
  eveningEnabled: boolean;
  eveningTime: string;        // "HH:MM"
  vulnerableEnabled: boolean;
  vulnerableTime: string;     // "HH:MM"
  userName: string;
  fcmToken?: string;
}

export const PREFS_KEY = 'zenfuel_notification_prefs';
// Fired in this tab after preferences change, so the scheduler can reschedule.
export const PREFS_CHANGED_EVENT = 'zenfuel:notification-prefs';

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  morningEnabled: true,
  morningTime: '08:00',
  eveningEnabled: true,
  eveningTime: '21:00',
  vulnerableEnabled: false,
  vulnerableTime: '21:00',
  userName: '',
};

export function getDefaultNotificationPrefs(): NotificationPrefs {
  return { ...DEFAULT_PREFS };
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPrefs(updates: Partial<NotificationPrefs>): void {
  const current = getNotificationPrefs();
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...updates })); } catch {}
  try { window.dispatchEvent(new Event(PREFS_CHANGED_EVENT)); } catch {}
}

// ── Support and permission ────────────────────────────────────────────────────

export type NotificationSupport = 'supported' | 'install-required' | 'unsupported';

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if ('Notification' in window) return 'supported';
  // iPhone and iPad only offer notifications to web apps added to the Home Screen.
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 'install-required' : 'unsupported';
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function getPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ── Service worker ────────────────────────────────────────────────────────────

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

/** Registers public/sw.js (display only — no caching). Safe to call repeatedly. */
export function registerNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve(null);
  if (!registration) {
    registration = navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => null);
  }
  return registration;
}

// ── Show notification ─────────────────────────────────────────────────────────

/** Shows a notification. Returns false if the browser refused or could not show it. */
export async function showNotification(title: string, body: string, tag?: string): Promise<boolean> {
  if (getPermissionStatus() !== 'granted') return false;
  const options: NotificationOptions = { body, icon: '/images/zenfuel-icon-192.png', tag };

  const reg = await registerNotificationWorker();
  if (reg) {
    try {
      // Wait briefly for the worker to activate on first use.
      const ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
      ]);
      await (ready ?? reg).showNotification(title, options);
      return true;
    } catch {}
  }
  try {
    // Browsers without a usable worker. Throws on Android, which requires the worker.
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

// ── In-session scheduler ──────────────────────────────────────────────────────

export type ReminderKind = 'morning' | 'evening' | 'vulnerable';

export interface ReminderContext {
  detoxScore: number;
  streakDays: number;
  /** Hidden Mode: neutral wording that mentions no habits, scores or app name. */
  discreet: boolean;
  discreetTitle: string;
}

let scheduledTimers: ReturnType<typeof setTimeout>[] = [];

export function clearScheduledNotifications(): void {
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];
}

/** Milliseconds until the clock next shows HH:MM (today if still ahead, otherwise tomorrow). */
export function msUntil(time: string, from = new Date()): number | null {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const target = new Date(from);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= from.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - from.getTime();
}

export function buildReminder(kind: ReminderKind, prefs: NotificationPrefs, ctx: ReminderContext): { title: string; body: string } {
  if (ctx.discreet) return { title: ctx.discreetTitle, body: 'You have a reminder.' };
  const name = prefs.userName ? ` ${prefs.userName}` : '';
  if (kind === 'morning') {
    return {
      title: ctx.streakDays > 0 ? `Day ${ctx.streakDays} of your reset 🌅` : 'Good morning 🌅',
      body: `Quick check-in${name} — how are you starting today?`,
    };
  }
  if (kind === 'evening') {
    const label = ctx.detoxScore >= 70 ? 'Strong day 💪' : ctx.detoxScore >= 40 ? 'Decent day 🙂' : 'Tough day — tomorrow is fresh ✨';
    return { title: `Your ZenFuel score today: ${ctx.detoxScore}/100`, body: label };
  }
  return { title: 'Your high-risk window 🧠', body: 'This is when triggers usually hit. Stay aware.' };
}

/**
 * Schedules the enabled reminders while the app stays open. Each reminder reschedules
 * itself for the next day after it fires. `getContext` is read when a reminder fires, so
 * the message uses the current score and Hidden Mode setting.
 */
export function scheduleInSessionNotifications(prefs: NotificationPrefs, getContext: () => ReminderContext): void {
  clearScheduledNotifications();
  if (!prefs.enabled || getPermissionStatus() !== 'granted') return;

  const plan = (kind: ReminderKind, time: string) => {
    const ms = msUntil(time);
    if (ms === null) return;
    scheduledTimers.push(setTimeout(() => {
      const { title, body } = buildReminder(kind, prefs, getContext());
      void showNotification(title, body, `zenfuel-${kind}`);
      plan(kind, time);
    }, ms));
  };

  if (prefs.morningEnabled) plan('morning', prefs.morningTime);
  if (prefs.eveningEnabled) plan('evening', prefs.eveningTime);
  if (prefs.vulnerableEnabled) plan('vulnerable', prefs.vulnerableTime);
}

// ── FCM setup (planned — uncomment after adding Firebase config) ─────────────
//
// 1. Create a Firebase project at console.firebase.google.com
// 2. Add Web App → copy config → paste into .env.local:
//
//    NEXT_PUBLIC_FIREBASE_API_KEY=...
//    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
//    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
//    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
//    NEXT_PUBLIC_FIREBASE_APP_ID=...
//    NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
//
// 3. Uncomment the block below and run: npm install firebase
//
// export async function initFCM(): Promise<string | null> {
//   const { initializeApp, getApps } = await import('firebase/app');
//   const { getMessaging, getToken } = await import('firebase/messaging');
//
//   const app = getApps().length
//     ? getApps()[0]
//     : initializeApp({
//         apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//         authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//         projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//         messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//         appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//       });
//
//   const messaging = getMessaging(app);
//   const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
//   saveNotificationPrefs({ fcmToken: token });
//   return token;
// }
//
// Cloud Function template (Firebase Functions):
// exports.sendScheduledNotifications = functions.pubsub
//   .schedule('every 1 hours').onRun(async () => {
//     const users = await db.collection('notification_prefs').get();
//     const now = new Date();
//     users.forEach(async (doc) => {
//       const prefs = doc.data();
//       // Check if now matches morningTime / eveningTime / vulnerableTime
//       // Send via admin.messaging().send({ token: prefs.fcmToken, notification: {...} })
//     });
//   });
