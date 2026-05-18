importScripts('https://cdn.webpushr.com/sw-v2.js');

const CACHE_NAME = 'absen-pwa-v5.5';
const urlsToCache = [
  '/absen/',
  '/absen/index.html',
  '/absen/style.css',
  '/absen/app.js',
  '/absen/manifest.json',
  '/absen/logo.png',
  '/absen/webpushr-sw.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation of new Service Worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Gunakan cache-busting saat instalasi awal untuk melewati HTTP cache browser
        return Promise.all(
          urlsToCache.map(url => {
            const separator = url.includes('?') ? '&' : '?';
            return fetch(`${url}${separator}cb=${Date.now()}`, { cache: 'no-store' })
              .then(res => {
                if (res.status === 200) {
                  return caches.open(CACHE_NAME).then(cache => cache.put(url, res));
                }
              })
              .catch(err => console.error('Gagal mencache:', url, err));
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  // Hanya proses GET requests (hindari intercept POST ke API Google Apps Script)
  if (event.request.method !== 'GET') return;

  // Cek apakah request untuk static assets aplikasi kita
  const isStaticAsset = urlsToCache.some(url => event.request.url.includes(url));

  if (isStaticAsset) {
    // STRATEGI: NETWORK FIRST (Coba ambil dari server dulu, jika sukses update cache, jika gagal/offline pakai Cache)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Jika offline, ambil dari Cache
          return caches.match(event.request);
        })
    );
  } else {
    // Untuk file di luar static assets (seperti Google Drive Foto / external assets)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
    );
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Claim all tabs immediately
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});
