// === SmartScores Service Worker v2.9.18 ===

const CACHE_NAME = "smartscores-cache-v2.9.18";
const ASSETS = [
  "/",                  // root
  "/index.html",
  "/data-entry.html",
  "/recorded-scores.html",
  "/averages-insights.html",
  "/set-targets.html",
  "/style.css",
  "/app.js",
  "/auth.js",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Install SW and cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate SW and clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Fetch from cache first, fallback to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => caches.match("/index.html"))
      );
    })
  );
});
