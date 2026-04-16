const CACHE = 'kinger-v2';
const ASSETS = [
  './index.html',
  './assets.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache what we can, ignore failures for external resources
      return Promise.allSettled(ASSETS.map(a => c.add(a)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Cache successful responses for app assets
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const url = e.request.url;
          if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
