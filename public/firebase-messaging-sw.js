// ZenFuel Service Worker v3 — GA4 bypass only
// Firebase push notifications are disabled until backend + login is built.
// Re-enable Firebase after Supabase auth is integrated.

// ── Fetch handler ─────────────────────────────────────────────────────────────
// Pass ALL external (non-zenfuel.app) requests straight to the network.
// This is the only thing this SW does right now, and it prevents the
// SW from ever blocking Google Analytics, GTM, or any third-party script.

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // External request → go straight to network, no caching, no interception
  if (!url.includes('zenfuel.app') && !url.includes('localhost')) {
    event.respondWith(
      fetch(event.request, { mode: 'no-cors' })
        .catch(function() { return new Response(''); })
    );
    return;
  }

  // Same-origin requests → do not call respondWith(), browser handles normally
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Wipe every old cache so the previous broken SW leaves no trace
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }),
    ])
  );
});
