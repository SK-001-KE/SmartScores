// SmartScores Service Worker – v2.9.5
const CACHE_NAME = 'smartscores-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/data-entry.html',
  '/recorded-scores.html',
  '/averages-insights.html',
  '/set-targets.html',
  '/app.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
  // External libs (optional – will be cached on first load)
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install – cache everything
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate – delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
  self.clients.claim();
});

// Fetch – serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).then(netResp => {
      // Cache new responses (except Chrome-extension requests)
      if (!e.request.url.startsWith('chrome-extension://')) {
        const clone = netResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return netResp;
    }))
  );
});
