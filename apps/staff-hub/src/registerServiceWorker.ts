/** Register the Staff Hub service worker in production only. */

export function registerStaffHubServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[Staff Hub] Service worker registration failed', err);
    });
  });
}
