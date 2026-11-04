// Self-unregistering no-op Service Worker.
// Any browser that still holds the OLD cache-first worker loads this on its
// next navigation, which deletes every cache bucket and unregisters —
// permanently retiring the PWA cache layer.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
