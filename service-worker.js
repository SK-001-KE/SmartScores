// service-worker.js — SmartScores v2.0

const CACHE_NAME = "smartscores-v2.0";
const urlsToCache = [
  "index.html",
  "about.html",
  "app.js",
  "favicon.png",
  "manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// Install - caching files
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - serve cached files if offline
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

// Activate - clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});
