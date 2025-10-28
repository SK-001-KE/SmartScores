// service-worker.js — SmartScores v2.0 (Updated)

// 1. CRITICAL: INCREMENT THE CACHE NAME to force a refresh of all assets
const CACHE_NAME = "smartscores-v2.1"; 

const urlsToCache = [
  "index.html",
  "about.html",
  "app.js",
  "favicon.png",
  "manifest.json",
  
  // 2. REQUIRED: Add the external PDF libraries used in index.html for offline support
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js"
];

self.addEventListener("install", e => {
  console.log('[Service Worker] Installing new version...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    // Cache-First strategy
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

self.addEventListener("activate", e => {
  console.log('[Service Worker] Clearing old caches...');
  e.waitUntil(
    // Delete all caches that don't match the new CACHE_NAME (v2.1)
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});
