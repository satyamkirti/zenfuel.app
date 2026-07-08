/**
 * ZenFuel — Firebase Cloud Messaging Service Worker
 *
 * To enable background push notifications:
 *   1. Add Firebase config to .env.local (see src/lib/notifications.ts)
 *   2. Run: npm install firebase
 *   3. Uncomment the importScripts + firebase.initializeApp block below
 */

// ─── Firebase (disabled until configured) ────────────────────────────────────
// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');
// firebase.initializeApp({ apiKey:'...', projectId:'...', messagingSenderId:'...', appId:'...' });
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((payload) => {
//   self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//     icon: '/images/zenfuel-logo.png',
//     data: { url: payload.data?.url || '/' },
//   });
// });

// ─── Fetch handler ────────────────────────────────────────────────────────────
// IMPORTANT: This must be declared before install/activate.
// For any analytics or external script URL → explicitly fetch from network.
// For all other requests → do NOT call respondWith() so the browser handles them.

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Always let Google Analytics and Tag Manager through to the network
  if (
    url.includes('googletagmanager.com') ||
    url.includes('google-analytics.com') ||
    url.includes('analytics.google.com') ||
    url.includes('/gtag/') ||
    url.includes('ga.js') ||
    url.includes('/collect')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // All other requests: fall through to browser (no SW interception, no caching)
  // Do NOT call event.respondWith() here — this is intentional.
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      clients.claim(),
      // Clear any old cached responses so we don't serve stale assets
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
    ])
  );
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
