// ZenFuel notification worker.
// Some browsers (Chrome on Android) only show notifications through a service worker.
// This worker exists only for that: it has no fetch handler, so it never caches or
// intercepts a network request, and it receives no push messages.

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Tapping a reminder focuses an open ZenFuel window, or opens one.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
