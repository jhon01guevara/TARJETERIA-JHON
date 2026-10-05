// Service worker de Tarjetería Jhon — cachea la app para que abra sin internet.
const CACHE = 'tj-panel-v3';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './catalogo_default.zip'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // El documento principal: cache-first, para que abra offline al instante
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
  // Librerías externas (jsPDF, Chart.js, Google Fonts): network-first, cae a cache si no hay internet
  e.respondWith(
    fetch(e.request).then(res => {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
