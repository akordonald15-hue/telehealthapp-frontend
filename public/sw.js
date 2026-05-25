const STATIC_CACHE = "caretekk-static-v1";
const RUNTIME_CACHE = "caretekk-runtime-v1";
const IMAGE_CACHE = "caretekk-images-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/icon-maskable-512.png",
  "/pwa/apple-touch-icon.png",
  "/Logo/newlogo.png",
];

const PRIVATE_PAGE_PREFIXES = [
  "/dashboard",
  "/appointments",
  "/messages",
  "/home-care",
  "/nurse",
  "/payments",
  "/records",
  "/profile",
  "/referrals",
  "/triage",
  "/care-plan",
  "/audit",
  "/provider-ledger",
];

const PRIVATE_API_PREFIXES = [
  "/api/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isPrivatePath(pathname) {
  return PRIVATE_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPrivateApi(pathname) {
  return PRIVATE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) {
        return fallback;
      }
    }

    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const response = await fetchPromise;
  return response || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (!isSameOrigin(url)) {
    if (request.destination === "image" || request.destination === "font") {
      event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    }
    return;
  }

  if (isPrivateApi(url.pathname)) {
    event.respondWith(fetch(new Request(request, { cache: "no-store" })));
    return;
  }

  if (request.mode === "navigate") {
    if (isPrivatePath(url.pathname)) {
      event.respondWith(
        fetch(new Request(request, { cache: "no-store" })).catch(async () => {
          const fallback = await caches.match(OFFLINE_URL);
          return fallback || Response.error();
        }),
      );
      return;
    }

    event.respondWith(networkFirst(request, RUNTIME_CACHE, OFFLINE_URL));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa/") ||
    url.pathname.startsWith("/Logo/") ||
    url.pathname.startsWith("/img/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});
