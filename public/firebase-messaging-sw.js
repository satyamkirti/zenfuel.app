// ZenFuel Service Worker — pass-through only, no caching.
// Firebase push notifications disabled until backend is ready.

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
