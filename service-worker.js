// === SmartScores Service Worker v3.0 ===
const CACHE_NAME = "smartscores-cache-v3.1";
const ASSETS = [
  "./",
  "./index.html",
  "./data-entry.html",
  "./recorded-scores.html", 
  "./ai-insights.html",
  "./averages.html",
  "./trends.html",
  "./set-targets.html",
  "./login.html",
  "./style.css",
  "./app.js",
  "./auth.js",
  "./manifest.json",
  "./favicon.ico",
  "./icon-192x192.png",
  "./icon-512x512.png"
];

// ===== INSTALL =====
self.addEventListener("install", (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// ===== ACTIVATE =====  
self.addEventListener("activate", (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ===== FETCH =====
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip non-HTTP requests (like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Add to cache for future
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving fallback', error);
            
            // For navigation requests, serve the app shell
            if (event.request.destination === 'document') {
              return caches.match("./index.html");
            }
            
            // For image requests, serve fallback icon
            if (event.request.destination === 'image') {
              return caches.match("./icon-192x192.png");
            }
            
            // For CSS requests, serve cached CSS
            if (event.request.destination === 'style') {
              return caches.match("./style.css");
            }
            
            // For script requests, serve cached app.js as fallback
            if (event.request.destination === 'script') {
              return caches.match("./app.js");
            }
            
            // For other failures, return error response
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// ===== BACKGROUND SYNC (Optional Enhancement) =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // You could implement background data sync here
    // For example: Sync records to cloud storage when online
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('Background sync completed');
      })
    );
  }
});

// ===== PUSH NOTIFICATIONS (Optional Enhancement) =====  
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'SmartScores Notification',
    icon: './icon-192x192.png',
    badge: './icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'dismiss', 
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SmartScores', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || './')
    );
  } else if (event.action === 'dismiss') {
    // Notification dismissed, do nothing
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || './')
    );
  }
});

// ===== MESSAGE HANDLING =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ===== PERIODIC SYNC (Advanced Feature) =====
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-update') {
    console.log('Service Worker: Periodic sync triggered');
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Example: Check for updates to cached files
  const cache = await caches.open(CACHE_NAME);
  const requests = ASSETS.map(asset => new Request(asset));
  
  try {
    const responses = await Promise.all(
      requests.map(request => fetch(request))
    );
    
    await Promise.all(
      responses.map((response, i) => {
        if (response.status === 200) {
          return cache.put(requests[i], response);
        }
      })
    );
    
    console.log('Service Worker: Content updated successfully');
  } catch (error) {
    console.log('Service Worker: Content update failed', error);
  }
}
