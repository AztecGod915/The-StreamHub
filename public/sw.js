// StreamHub Service Worker — handles push notifications + offline caching

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'New updates on The StreamHub',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image || null,
    data: { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    tag: data.tag || 'streamhub-notification',
    renotify: true,
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '🎬 The StreamHub', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Fetch — network first, no caching (prevents stale code issues)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
