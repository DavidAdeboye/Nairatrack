// NairaTrack service worker — offline-first for an installed PWA
const CACHE = 'nairatrack-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for app shell, network-first for any external/API calls (e.g. Groq)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          // Cache new same-origin GET responses for future offline use
          if (event.request.method === 'GET' && res.ok) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
  // For cross-origin (fonts, CDN scripts, Groq API): let the browser handle it normally
});
