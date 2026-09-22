/* KatherBox Progressive Web App Service Worker
   - Full offline app shell caching (HTML, JS, CSS, SVG, Web Fonts)
   - Network-first with Cache-fallback for product catalog & plant care guides
   - Cache-first with stale-while-revalidate for static assets & images
   - Immediate activation via skipWaiting and clients.claim
*/

const CACHE_NAME = "katherbox-pwa-v2";
const RUNTIME_CACHE = "katherbox-runtime-v2";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/icons.svg",
  "/manifest.webmanifest",
];

// URLs that should have offline fallback cache (catalog, categories, care guides)
const CACHEABLE_API_PATHS = [
  "/api/products",
  "/api/categories",
  "/api/care-schedule",
  "/api/care-calendar",
  "/api/blog",
  "/api/iot/plants",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW] Precache failed:", err))
  );
});

self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests or non-HTTP protocols
  if (req.method !== "GET" || !url.protocol.startsWith("http")) return;

  // 1. Navigation requests (HTML pages): Network-first -> Cache-fallback to /index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match("/index.html");
        })
    );
    return;
  }

  // 2. Read-only API caching: Network-first, fallback to cached data if offline
  const isCacheableApi = CACHEABLE_API_PATHS.some((path) =>
    url.pathname.startsWith(path)
  );

  if (isCacheableApi) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              error: "offline",
              message: "Offline mode: showing previously cached botanical data.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
    return;
  }

  // 3. Static assets (JS, CSS, SVGs, Fonts, Images): Cache-first with background revalidation
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in the background
          fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches
                  .open(RUNTIME_CACHE)
                  .then((c) => c.put(req, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // Default fetch for other requests
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});