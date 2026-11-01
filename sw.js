/* Mente Confusa — offline + atualização automática.
   HTML: rede primeiro (para pegar versões novas), cache como reserva.
   Estáticos: cache primeiro com revalidação em segundo plano. */
const CACHE = 'mente-confusa-v9';
const ASSETS = [
  './',
  './index.html',
  './css/style.css?v=11',
  './js/intro.js?v=8',
  './js/data.js?v=8',
  './js/core.js?v=8',
  './js/game.js?v=9',
  './vendor/mqtt.min.js',
  './manifest.webmanifest',
  './icons/icon-192.png?v=6',
  './icons/icon-512.png?v=6',
  './icons/icon-maskable-512.png?v=6',
  './video/intro.mp4?v=7',
  './video/intro-poster.jpg?v=7',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isDoc = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isDoc) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((hit) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
