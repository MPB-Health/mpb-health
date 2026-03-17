import React from 'react';

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Failed to fetch',
  'Loading chunk',
  'ChunkLoadError',
  'ERR_CACHE_READ_FAILURE',
  'CACHE_READ_FAILURE',
  'dynamically imported module',
  'error loading dynamically imported module',
];

function isChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERNS.some((p) => msg.includes(p));
}

const RELOAD_KEY = 'crm_chunk_reload_ts';

function shouldAttemptReload(): boolean {
  try {
    const last = sessionStorage.getItem(RELOAD_KEY);
    if (!last) return true;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed > 30000; // Only once per 30s
  } catch {
    return true;
  }
}

function markReloadAttempted(): void {
  try {
    sessionStorage.setItem(RELOAD_KEY, Date.now().toString());
  } catch {
    /* ignore */
  }
}

function clearCachesAndReload(): void {
  markReloadAttempted();
  if ('caches' in window && window.caches) {
    window.caches.keys().then((names) => {
      Promise.all(names.map((n) => window.caches!.delete(n))).finally(() => {
        window.location.reload();
      });
    }).catch(() => window.location.reload());
  } else {
    window.location.reload();
  }
}

/**
 * Lazy load with retry and auto-reload on chunk/cache errors.
 * Handles ERR_CACHE_READ_FAILURE, stale chunks after deploy, etc.
 */
export function lazyRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await importer();
      } catch (error) {
        if (!isChunkError(error)) throw error;

        console.warn(
          `[lazyRetry] Chunk load failed (attempt ${attempt + 1}/2).`,
          error instanceof Error ? error.message : error
        );

        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        if (shouldAttemptReload()) {
          console.warn('[lazyRetry] Auto-recovering: clearing cache and reloading...');
          clearCachesAndReload();
          return new Promise(() => {});
        }

        throw error;
      }
    }
    throw new Error('Chunk load failed');
  });
}
