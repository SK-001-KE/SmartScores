// service-worker.js — SmartScores v2.0 Service Worker

const CACHE_NAME = 'smartscores-v2';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/data-entry.html',
  '/recorded-scores.html',
  '/summary-insights.html',
  '/app.js',
  '/styles.css',
  '/favicon.png',
  '/logo.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Install event — Cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
});

// Activate event — Clear old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event — Serve cached files
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file if available, otherwise fetch it from network
      return cachedResponse || fetch(event.request);
    })
  );
});
