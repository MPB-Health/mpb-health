// ============================================================================
// Service Worker for MPB Health Advisor Portal PWA
// ============================================================================

const CACHE_VERSION = 11;
const CACHE_NAME = `advisor-portal-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `advisor-runtime-v${CACHE_VERSION}`;
const MAX_RUNTIME_ENTRIES = 200;
let hasBroadcastedReload = false;
let fetchCount = 0;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/assets/MPB-Health-No-background.png',
  '/offline.html',
];

const API_CACHE_PATTERNS = [
  /\/rest\/v1\//,
];

const STATIC_ASSET_RE = /\.(?:js|css|json|woff2?|ttf|eot|svg|png|jpe?g|webp|ico)$/;

// Vite stamps hashed filenames like /assets/index-B3x7k2f.js — these are
// immutable and never need background refresh.
const HASHED_ASSET_RE = /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.\w+$/;

// Catch any stray unhandled rejections so they never surface in DevTools.
self.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns true only for responses that are safe to store in CacheStorage.
 * Rejects opaque (cross-origin no-cors), error, redirect, and consumed bodies.
 */
function isCacheable(response) {
  if (!response) return false;
  if (response.type === 'opaque' || response.type === 'error') return false;
  if (response.redirected) return false;
  if (!response.ok) return false;
  if (response.bodyUsed) return false;
  return true;
}

function isValidCachedResponse(response) {
  if (!response) return false;
  if (response.status === 0 && response.type !== 'opaque') return false;
  if (response.status >= 400) return false;
  if (response.bodyUsed) return false;
  return true;
}

/**
 * Safely write a response to a named cache. Pre-validates the response so
 * Cache.put() never receives something it would reject, and wraps in
 * try/catch as a final safety net.
 */
async function safeCachePut(cacheName, request, response) {
  if (!isCacheable(response)) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (_) {
    // Non-critical — the live response was already returned to the page.
  }
}

/**
 * Evict oldest entries from a cache when it exceeds maxEntries.
 * Called periodically (not on every request) to avoid perf overhead.
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const excess = keys.length - maxEntries;
      await Promise.allSettled(
        keys.slice(0, excess).map((key) => cache.delete(key))
      );
    }
  } catch (_) {
    // Best-effort
  }
}

// ============================================================================
// Install Event
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        APP_SHELL.map((path) => cache.add(path))
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.log('[SW] App-shell miss:', APP_SHELL[i]);
        }
      });
    })
  );

  self.skipWaiting();
});

// ============================================================================
// Activate Event — purge every cache that isn't the current version
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  const keep = new Set([CACHE_NAME, RUNTIME_CACHE]);

  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => !keep.has(n)).map((n) => {
          console.log('[SW] Purging old cache:', n);
          return caches.delete(n);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ============================================================================
// Fetch Event
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ---- Only handle same-origin GET requests over http(s) ----
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // Periodically trim the runtime cache to prevent unbounded growth
  if (++fetchCount % 50 === 0) {
    trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
  }

  // API → network-first
  if (API_CACHE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Navigation → network-first with SPA fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Static assets → cache-first
  if (STATIC_ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Everything else → network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// ============================================================================
// Caching Strategies
// ============================================================================

async function cacheFirstStrategy(request) {
  // 1. Try the cache
  try {
    const cached = await caches.match(request);
    if (cached) {
      if (isValidCachedResponse(cached)) {
        // Hashed Vite assets are immutable — skip background refresh
        if (!HASHED_ASSET_RE.test(request.url)) {
          refreshCache(request);
        }
        return cached;
      }
      // Corrupt — evict from both caches
      await evictEntry(request);
    }
  } catch (_) {
    // Cache storage error — fall through to network
  }

  // 2. Network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      safeCachePut(RUNTIME_CACHE, request, networkResponse.clone());
    } else if (networkResponse.status === 403 || networkResponse.status === 404) {
      if (HASHED_ASSET_RE.test(request.url)) {
        await handleMissingHashedAsset(new URL(request.url).pathname);
      }
    }

    return networkResponse;
  } catch (_) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      safeCachePut(RUNTIME_CACHE, request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    try {
      const cached = await caches.match(request);
      if (cached && isValidCachedResponse(cached)) return cached;
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      safeCachePut(CACHE_NAME, request, networkResponse.clone());
    } else if (networkResponse.status >= 500) {
      const fallback = await spaFallback(request);
      if (fallback) return fallback;
    }

    return networkResponse;
  } catch (_) {
    const fallback = await spaFallback(request);
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      safeCachePut(RUNTIME_CACHE, request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    try {
      const cached = await caches.match(request);
      if (cached && isValidCachedResponse(cached)) return cached;
    } catch (_) { /* ignore */ }
    return new Response('Offline', { status: 503 });
  }
}

// ============================================================================
// Support functions
// ============================================================================

async function spaFallback(request) {
  try {
    const cached = await caches.match(request);
    if (cached && isValidCachedResponse(cached)) return cached;

    const index = await caches.match('/index.html');
    if (index && isValidCachedResponse(index)) return index;

    const offline = await caches.match('/offline.html');
    if (offline && isValidCachedResponse(offline)) return offline;
  } catch (_) { /* ignore */ }
  return null;
}

async function refreshCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await safeCachePut(RUNTIME_CACHE, request, response.clone());
    }
  } catch (_) {
    // Best-effort background refresh
  }
}

async function evictEntry(request) {
  try {
    const [runtime, app] = await Promise.all([
      caches.open(RUNTIME_CACHE),
      caches.open(CACHE_NAME),
    ]);
    await Promise.allSettled([runtime.delete(request), app.delete(request)]);
  } catch (_) { /* ignore */ }
}

async function handleMissingHashedAsset(pathname) {
  if (hasBroadcastedReload) return;
  hasBroadcastedReload = true;

  console.log('[SW] Hashed asset missing — clearing caches:', pathname);

  await Promise.allSettled([
    caches.delete(CACHE_NAME),
    caches.delete(RUNTIME_CACHE),
  ]);

  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    client.postMessage({ type: 'RELOAD_PAGE', reason: 'missing_hashed_asset', pathname });
    try { await client.navigate(client.url); } catch (_) { /* ignore */ }
  }
}

// ============================================================================
// Background Sync
// ============================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') event.waitUntil(syncLeads());
  if (event.tag === 'sync-messages') event.waitUntil(syncMessages());
});

async function syncLeads() { console.log('[SW] Syncing leads...'); }
async function syncMessages() { console.log('[SW] Syncing messages...'); }

// ============================================================================
// Push Notifications (HIPAA-safe — no PHI in payloads)
// ============================================================================

const TAG_LABELS = {
  'mpb-chat':         { title: 'New message',     body: 'You have a new chat message' },
  'mpb-ticket':       { title: 'Ticket update',   body: 'A support ticket was updated' },
  'mpb-bulletin':     { title: 'New bulletin',     body: 'A new bulletin has been posted' },
  'mpb-notification': { title: 'Advisor Portal',  body: 'You have a new notification' },
};

self.addEventListener('push', (event) => {
  let data = {
    title: 'Advisor Portal',
    body: 'You have a new notification',
    icon: '/assets/MPB-Health-No-background.png',
    badge: '/favicon.svg',
    tag: 'mpb-notification',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body  = payload.body  || data.body;
      data.tag   = payload.tag   || data.tag;
      data.url   = payload.url   || data.url;
    } catch (_) { /* ignore malformed push */ }
  }

  const notificationUrl = data.url.startsWith('/') ? data.url : '/';

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      data: { url: notificationUrl },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const path = event.notification.data?.url || '/';
  const urlToOpen = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', () => {});

// ============================================================================
// Message Handler
// ============================================================================
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const urls = Array.isArray(event.data?.urls) ? event.data.urls : [];
        const results = await Promise.allSettled(urls.map((u) => cache.add(u)));
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.log('[SW] Cache URL failed:', urls[i]);
          }
        });
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.map((n) => caches.delete(n)))
      )
    );
  }
});

console.log('[SW] Service worker loaded');
