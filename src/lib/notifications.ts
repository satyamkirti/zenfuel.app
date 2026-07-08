/**
 * Notification service for ZenFuel.
 *
 * Architecture:
 * - Browser Notification API for in-tab + installed-PWA banners (no backend needed)
 * - Firebase Cloud Messaging for background push (requires Firebase config + backend)
 * - localStorage for user preferences
 * - setTimeout-based in-session scheduler (fires while app is open)
 *
 * To enable background push after closing the app:
 *   1. Add Firebase project config to .env.local (see bottom of file)
 *   2. Uncomment the FCM block in initFCM()
 *   3. Deploy a Cloud Function (template at the bottom) to send at scheduled times
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

const PREFS_KEY = 'zenfuel_notification_prefs';

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
}

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function getPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ── Show notification ─────────────────────────────────────────────────────────

export async function showNotification(
  title: string,
  body: string,
  tag?: string
): Promise<void> {
  if (getPermissionStatus() !== 'granted') return;

  // Use plain Notification API (service worker removed)
  new Notification(title, { body, icon: '/images/zenfuel-logo.png', tag });
}

// ── In-session scheduler ──────────────────────────────────────────────────────
// Fires while the app tab is open. For background push, wire up FCM (below).

let scheduledTimers: ReturnType<typeof setTimeout>[] = [];

export function scheduleInSessionNotifications(
  prefs: NotificationPrefs,
  detoxScore: number,
  streakDays: number
): void {
  // Clear any previous timers
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];

  if (!prefs.enabled || getPermissionStatus() !== 'granted') return;

  const schedule = (time: string, title: string, body: string) => {
    const [h, m] = time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const ms = target.getTime() - Date.now();
    if (ms > 0 && ms < 86_400_000) {
      scheduledTimers.push(setTimeout(() => showNotification(title, body), ms));
    }
  };

  const name = prefs.userName ? ` ${prefs.userName}` : '';

  if (prefs.morningEnabled) {
    const streak = streakDays > 0 ? `Day ${streakDays} of your reset 🌅` : 'Good morning 🌅';
    schedule(prefs.morningTime, streak, `Quick check-in${name} — how are you starting today?`);
  }

  if (prefs.eveningEnabled) {
    const label = detoxScore >= 70 ? 'Strong day 💪' : detoxScore >= 40 ? 'Decent day 🙂' : 'Tough day — tomorrow is fresh ✨';
    schedule(prefs.eveningTime, `Your ZenFuel score today: ${detoxScore}/100`, label);
  }

  if (prefs.vulnerableEnabled) {
    schedule(prefs.vulnerableTime, 'Your high-risk window 🧠', 'This is when triggers usually hit. Stay aware.');
  }
}

// registerServiceWorker() removed — service worker disabled until
// Firebase backend is configured. Re-add when Supabase + FCM are wired up.

// ── FCM setup (uncomment after adding Firebase config) ───────────────────────
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
