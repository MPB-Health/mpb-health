// ============================================================================
// Service Worker for MPB Health Advisor Portal PWA
// ============================================================================

const CACHE_NAME = 'advisor-portal-v3';
const RUNTIME_CACHE = 'advisor-runtime-v3';
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
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL).catch((error) => {
        console.log('[SW] Failed to cache some app shell files:', error);
        // Continue even if some files fail to cache
        return Promise.resolve();
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
// Push Notifications
// ============================================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Advisor Portal',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.log('[SW] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
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
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
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
