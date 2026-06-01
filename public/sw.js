// Service worker disabled — app works fully without it
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  // Clear ALL caches to remove broken cached code
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// No fetch handler — all requests go straight to network
