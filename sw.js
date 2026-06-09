const CACHE_NAME = 'dar-el-banna-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'menu.json',
  'resources/logo.png',
  'resources/logo.ico',
  'resources/icon-192.png',
  'resources/icon-512.png'
];

// Install Service Worker and cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch requests with a hybrid strategy: Stale-While-Revalidate for cached core assets,
// Cache-First with dynamic caching for images and external styles
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignore non-HTTP/HTTPS requests (like chrome-extension://, mailto:, tel:)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Handle requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate: serve cached version, update cache in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch failures (e.g. offline)
          });
        return cachedResponse;
      }

      // If not cached, fetch from network and dynamically cache if it meets requirements
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache local assets, unsplash images, FontAwesome, Google Fonts
          const shouldCache = 
            requestUrl.origin === self.location.origin || 
            event.request.url.includes('unsplash.com') ||
            event.request.url.includes('cdnjs.cloudflare.com') ||
            event.request.url.includes('fonts.googleapis.com') ||
            event.request.url.includes('fonts.gstatic.com');

          if (shouldCache && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch((err) => {
          // If offline and request is page navigation, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          console.error('[Service Worker] Fetch failed:', err);
        });
    })
  );
});
