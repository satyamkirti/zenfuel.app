// ─── GA4 PASS-THROUGH — Must be first in this file ───────────────────────────
// Intercepts fetch events BEFORE any other handler.
// GA4 / GTM requests go straight to the network — never cached, never blocked.

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  if (
    url.includes('googletagmanager.com') ||
    url.includes('google-analytics.com') ||
    url.includes('analytics.google.com') ||
    url.includes('/gtag/') ||
    url.includes('gtag.js') ||
    url.includes('?id=G-')
  ) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response('', { status: 200 });
      })
    );
    return;
  }

  // All other requests: do not call respondWith() — browser handles them.
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', function() { self.skipWaiting(); });

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) { return caches.delete(key); }));
      }),
    ])
  );
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        var client = list[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ─── Firebase Cloud Messaging (enable after adding Firebase config) ───────────
// 1. npm install firebase
// 2. Add NEXT_PUBLIC_FIREBASE_* vars to .env.local
// 3. Uncomment below:
//
// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');
// firebase.initializeApp({ apiKey:'...', projectId:'...', messagingSenderId:'...', appId:'...' });
// firebase.messaging().onBackgroundMessage(function(payload) {
//   self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//     icon: '/images/zenfuel-logo.png',
//     data: { url: (payload.data && payload.data.url) || '/' },
//   });
// });
