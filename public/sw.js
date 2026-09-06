/* Football Bubbles service worker: offline app shell + static asset cache. */
const VERSION = "fb-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const OFFLINE_URL = "/";

const PRECACHE = ["/", "/manifest.json", "/pwa-192.png", "/pwa-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    /\.(js|css|woff2?|png|jpg|jpeg|svg|webp|ico|json)$/.test(url.pathname) &&
    !url.pathname.startsWith("/_serverFn") &&
    !url.pathname.startsWith("/api/")
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache server functions or API traffic (live match data must stay fresh).
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put(OFFLINE_URL, response.clone()).catch(() => {});
          return response;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSETS);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return cached ?? Response.error();
      }
    })(),
  );
});
