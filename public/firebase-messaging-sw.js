/**
 * Firebase Cloud Messaging Service Worker
 *
 * This file must live at /public/firebase-messaging-sw.js so it is
 * served from the root scope (/).
 *
 * How to activate:
 *   1. Add your Firebase config to .env.local (see src/lib/notifications.ts)
 *   2. Run: npm install firebase
 *   3. Uncomment the importScripts block below
 *
 * Until then, this file still registers a working service worker that:
 *   - Handles notification clicks (opens the app)
 *   - Enables PWA install + background notification API
 */

// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');
//
// firebase.initializeApp({
//   apiKey: '...',
//   authDomain: '...',
//   projectId: '...',
//   messagingSenderId: '...',
//   appId: '...',
// });
//
// const messaging = firebase.messaging();
//
// messaging.onBackgroundMessage((payload) => {
//   self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//     icon: '/images/zenfuel-logo.png',
//     badge: '/images/zenfuel-logo.png',
//     data: { url: payload.data?.url || '/' },
//   });
// });

// Handle notification click → open / focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Activate immediately without waiting for other tabs to close
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Explicit pass-through: this SW does NOT intercept any network requests.
// Without this handler the browser falls through to the network anyway,
// but declaring it explicitly prevents browser extensions from assuming
// the SW might be caching/blocking third-party scripts like Google Analytics.
self.addEventListener('fetch', (event) => {
  // Return without calling event.respondWith() → browser fetches normally.
  // External requests (googletagmanager.com, etc.) are NOT intercepted.
});
