// Teacher Mean Score Tracker - Service Worker
const CACHE_NAME = "teacher-mean-score-tracker-v1.0";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./about.html",
  "./manifest.json",
  "./favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install event: cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, then update
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() =>
          caches.match("./index.html")
        )
      );
    })
  );
});
