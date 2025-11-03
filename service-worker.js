// SmartScores PWA Service Worker — v3.0
const CACHE_NAME = "smartscores-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/data-entry.html",
  "/recorded-scores.html",
  "/averages-insights.html",
  "/set-targets.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon.ico",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-First strategy
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Auto-Update + Prompt Client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) =>
      client.postMessage({ type: "NEW_VERSION_AVAILABLE" })
    );
  });
});
