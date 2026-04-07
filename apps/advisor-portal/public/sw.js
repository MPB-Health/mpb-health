// ============================================================================
// Service Worker for MPB Health Advisor Portal PWA
// ============================================================================

const CACHE_NAME = 'advisor-portal-v7';
const RUNTIME_CACHE = 'advisor-runtime-v7';
let hasBroadcastedReload = false;

// Files to cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png',
  '/offline.html',
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/rest\/v1\//,  // Supabase REST API
];

// Static assets to cache
const STATIC_CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.json$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.ico$/,
];

// ============================================================================
// Install Event - Cache App Shell
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching app shell');
      // Cache each entry independently so one missing file doesn't fail all.
      const results = await Promise.allSettled(
        APP_SHELL.map((path) => cache.add(path))
      );
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.log('[SW] Failed to cache app-shell entry:', APP_SHELL[i], result.reason);
        }
      });
    })
  );

  // Take control immediately
  self.skipWaiting();
});

// ============================================================================
// Activate Event - Clean Up Old Caches
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  const CURRENT_CACHES = new Set([CACHE_NAME, RUNTIME_CACHE]);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.has(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ============================================================================
// Fetch Event - Serve from Cache or Network
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except for allowed CDNs)
  if (url.origin !== location.origin) {
    // Allow Jitsi and CDN assets
    if (!url.hostname.includes('jit.si') && !url.hostname.includes('cdn')) {
      return;
    }
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip browser extension requests
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// ============================================================================
// Caching Strategies
// ============================================================================

/**
 * Cache-first strategy for static assets.
 * For hashed assets (Vite chunks), a cache miss + network error means
 * the app was redeployed with new hashes — trigger a page reload so
 * the client picks up the new index.html with correct chunk references.
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    refreshCache(request);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    } else if (networkResponse.status === 403 || networkResponse.status === 404) {
      const url = new URL(request.url);
      const isHashedAsset = /\-[A-Za-z0-9_-]{6,}\.\w+$/.test(url.pathname);
      if (isHashedAsset) {
        await handleMissingHashedAsset(url.pathname);
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * If a hashed chunk no longer exists (after deploy), clear caches and force
 * clients to reload exactly once so they fetch the latest index + chunk map.
 */
async function handleMissingHashedAsset(pathname) {
  if (hasBroadcastedReload) return;
  hasBroadcastedReload = true;

  console.log('[SW] Hashed asset missing, notifying clients to reload:', pathname);

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

    // Trigger navigation as a fallback if app-level listener is not mounted.
    if (typeof client.navigate === 'function') {
      try {
        await client.navigate(client.url);
      } catch (_) {
        // Ignore navigation errors; message-based reload still applies.
      }
    }
  }
}

/**
 * Network-first strategy for API requests
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Navigation strategy for HTML pages
 */
async function navigationStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    } else if (networkResponse.status >= 500) {
      // Origin returned 5xx (e.g. 503 from host or transient outage). Prefer cached
      // SPA shell so client-side routes like /tickets still load instead of a bare error.
      const cachedRoute = await caches.match(request);
      const indexResponse = cachedRoute || (await caches.match('/index.html'));
      if (indexResponse) {
        return indexResponse;
      }
      // Last fallback: try root document directly.
      try {
        const rootResponse = await fetch('/');
        if (rootResponse.ok) return rootResponse;
      } catch (_) {
        // ignore
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page');

    // Try cached version of the requested page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to cached index.html (for SPA routing)
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }

    // Last resort: offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network with cache fallback
 */
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Refresh cache in background
 */
async function refreshCache(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we're just refreshing
  }
}

// ============================================================================
// Background Sync
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  }

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncLeads() {
  // Get pending lead updates from IndexedDB and sync
  console.log('[SW] Syncing leads...');
}

async function syncMessages() {
  // Get pending messages from IndexedDB and sync
  console.log('[SW] Syncing messages...');
}

// ============================================================================
// Push Notifications (HIPAA-safe — no PHI in payloads)
// ============================================================================

// Tag-based grouping so multiple notifications of the same type collapse
// into one (e.g., "3 new messages" instead of 3 separate notifications).
const TAG_LABELS = {
  'mpb-chat':       { title: 'New message',       body: 'You have a new chat message' },
  'mpb-ticket':     { title: 'Ticket update',     body: 'A support ticket was updated' },
  'mpb-bulletin':   { title: 'New bulletin',      body: 'A new bulletin has been posted' },
  'mpb-notification': { title: 'Advisor Portal', body: 'You have a new notification' },
};

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Advisor Portal',
    body: 'You have a new notification',
    icon: '/logo.png',
    badge: '/favicon.svg',
    tag: 'mpb-notification',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      // Only accept safe fields — never render user-generated content
      data.title = payload.title || data.title;
      data.body  = payload.body  || data.body;
      data.tag   = payload.tag   || data.tag;
      data.url   = payload.url   || data.url;
    } catch (error) {
      console.log('[SW] Failed to parse push data:', error);
    }
  }

  // Deep-link URL always stays within the portal
  const notificationUrl = data.url.startsWith('/') ? data.url : '/';

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,               // Same tag = replace previous notification
      renotify: true,              // Vibrate even when replacing same tag
      data: { url: notificationUrl },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Build full URL from deep-link path
  const path = event.notification.data?.url || '/';
  const urlToOpen = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window and navigate to the deep link
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Analytics hook — track dismissals if needed
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// ============================================================================
// Message Handler
// ============================================================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const urls = Array.isArray(event.data?.urls) ? event.data.urls : [];
        const results = await Promise.allSettled(
          urls.map((url) => cache.add(url))
        );
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.log('[SW] Failed to cache runtime URL:', urls[i], result.reason);
          }
        });
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service worker loaded');
