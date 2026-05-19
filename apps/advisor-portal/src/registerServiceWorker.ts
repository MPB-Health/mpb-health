/**
 * PWA service worker — production only by default so Vite dev is never
 * controlled by a stale SW (a common source of “only refresh fixes it”).
 *
 * To test PWA on localhost: `localStorage.setItem('advisor-pwa-dev', '1')` then reload.
 */

const RELOAD_GUARD_KEY = 'advisor-sw-controller-reload';

declare global {
  interface Window {
    __advisorSwBootstrapDone?: boolean;
  }
}

function shouldRegisterInDev(): boolean {
  try {
    return localStorage.getItem('advisor-pwa-dev') === '1';
  } catch {
    return false;
  }
}

export async function unregisterAllServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* ignore */
  }
}

export function registerAdvisorServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  void navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      if (import.meta.env.DEV) {
        console.log('[PWA] Service Worker registered:', reg.scope);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    })
    .catch((error: unknown) => {
      console.warn('[PWA] Service Worker registration failed:', error);
    });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    try {
      const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
      if (Date.now() - last < 5000) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    if (!(window as Window & { __swReloading?: boolean }).__swReloading) {
      (window as Window & { __swReloading?: boolean }).__swReloading = true;
      window.location.reload();
    }
  });
}

export function setupServiceWorker(): void {
  if (typeof window === 'undefined') return;
  // Persist on window so Vite HMR never re-runs unregister / duplicate load listeners.
  if (window.__advisorSwBootstrapDone) return;
  window.__advisorSwBootstrapDone = true;

  const inDev = import.meta.env.DEV;

  if (inDev && !shouldRegisterInDev()) {
    void unregisterAllServiceWorkers();
    console.info(
      '[PWA] Dev: service worker disabled — URLs are loaded directly (no SW cache). ' +
        'To test PWA here: localStorage.setItem("advisor-pwa-dev","1") then reload.',
    );
    return;
  }

  window.addEventListener('load', () => {
    registerAdvisorServiceWorker();
  });
}

/** PWA / push code should only wait on `serviceWorker.ready` when we expect a worker to register. */
export function advisorServiceWorkerEnabled(): boolean {
  if (import.meta.env.PROD) return true;
  if (!import.meta.env.DEV) return false;
  return shouldRegisterInDev();
}
