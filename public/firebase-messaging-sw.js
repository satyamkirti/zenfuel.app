// ZenFuel Service Worker v4 — pure network pass-through, zero caching.
// next-pwa NOT used. No workbox. No Firebase. No interception of any request.
// GA4 / GTM / all external URLs go straight to the network.

self.addEventListener('fetch', function(event) {
  // Pass every request straight to the network — no caching, no interception.
  event.respondWith(fetch(event.request));
});

self.addEventListener('install', function() { self.skipWaiting(); });

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }),
    ])
  );
});
