/* Service Worker for GameFlex — caching engine
   - Pre-caches the minimal app shell (only files that actually exist)
   - Cache-first + background revalidate for images and hashed build assets
   - Network-first for navigations
   - Never caches API, auth or realtime traffic
*/
const VERSION = "v4";
const CACHE_NAME = `gameflex-static-${VERSION}`;
const MEDIA_CACHE = `gameflex-media-${VERSION}`;
const RUNTIME_CACHE = `gameflex-runtime-${VERSION}`;
const CURRENT_CACHES = [CACHE_NAME, MEDIA_CACHE, RUNTIME_CACHE];

// Only list assets that are guaranteed to exist. A single 404 makes
// cache.addAll() reject, which would abort install and disable all caching.
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/favicon.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Add individually so one failure can't abort the whole install.
      Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"))
  );
}

function isImageRequest(request, url) {
  return (
    request.destination === "image" || /\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$/i.test(url.pathname)
  );
}

// Immutable, content-hashed build output from Vite.
function isBuildAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_build/");
}

function isFont(request, url) {
  return request.destination === "font" || /\.(woff2?|ttf|otf)$/i.test(url.pathname);
}

// Anything that is user-specific, authenticated or live must never be cached.
function isNeverCacheable(url) {
  return (
    // Dev-server module graph: caching these serves stale JS and blanks the page.
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@fs") ||
    url.pathname.startsWith("/@id") ||
    url.pathname.startsWith("/@tanstack-start") ||
    url.pathname.startsWith("/node_modules/") ||
    url.searchParams.has("t") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_serverFn/") ||
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/storage/v1/object/sign") ||
    url.pathname.includes("/functions/v1/") ||
    url.pathname.includes("/realtime/") ||
    url.protocol === "ws:" ||
    url.protocol === "wss:"
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      // Only cache complete, successful responses. Opaque/partial ones poison the cache.
      if (response.ok && response.type !== "opaque" && response.status !== 206) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  // Serve cache instantly, refresh in the background.
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Let live/authenticated traffic go straight to the network, untouched.
  if (isNeverCacheable(url)) return;

  // Content-hashed build output is immutable: cache-first, never revalidate.
  if (isBuildAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (isImageRequest(request, url) || isFont(request, url)) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/")),
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
