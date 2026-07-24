/**
 * Minimal Staff Hub service worker.
 * Satisfies Chromium installability. Network-first for navigations and assets.
 * Does not cache API / auth / PHI responses.
 */
const CACHE_VERSION = 1;
const SHELL_CACHE = `staff-hub-shell-v${CACHE_VERSION}`;

const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith('staff-hub-') && key !== SHELL_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApiOrAuth(url) {
  return (
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/functions/v1/') ||
    url.hostname.includes('supabase')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never touch cross-origin API / auth / edge traffic.
  if (url.origin !== self.location.origin || isApiOrAuth(url)) {
    return;
  }

  // Navigations: network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          if (fresh.ok) {
            cache.put('/index.html', fresh.clone());
          }
          return fresh;
        } catch {
          return (
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Same-origin static: network-first, cache as fallback (icons / manifest only).
  if (SHELL_URLS.includes(url.pathname) || url.pathname.match(/\.(?:png|svg|ico|json)$/)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return (await caches.match(request)) || Response.error();
        }
      })(),
    );
  }
});
