// ============================================================================
// PWA Hook — Progressive Web App functionality
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  needsUpdate: boolean;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    needsUpdate: false,
  });
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('pwa-dismissed-until');
    return stored ? parseInt(stored, 10) : null;
  });

  // Check if running as standalone PWA
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    // Check if already installed via localStorage flag
    const wasInstalled = localStorage.getItem('pwa-installed') === 'true';

    setState((prev) => ({
      ...prev,
      isStandalone,
      isIOS,
      isAndroid,
      isInstalled: isStandalone || wasInstalled,
    }));
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      setState((prev) => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for service worker updates and listen for reload signals
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RELOAD_PAGE') {
        console.log('[PWA] Stale assets detected, reloading...');
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, needsUpdate: true }));
            }
          });
        }
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Install the PWA
  const install = useCallback(async () => {
    if (!installPrompt) {
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstallPrompt(null);
        localStorage.setItem('pwa-installed', 'true');
        setState((prev) => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [installPrompt]);

  // Dismiss the install prompt for a period
  const dismissPrompt = useCallback((days: number = 7) => {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    setDismissedUntil(until);
    localStorage.setItem('pwa-dismissed-until', until.toString());
  }, []);

  // Check if prompt should be shown
  const shouldShowPrompt = useCallback(() => {
    if (!state.isInstallable || state.isInstalled || state.isStandalone) {
      return false;
    }

    if (dismissedUntil && Date.now() < dismissedUntil) {
      return false;
    }

    return true;
  }, [state, dismissedUntil]);

  // Update the app (reload with new service worker)
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });

      // Reload after a short delay
      setTimeout(() => window.location.reload(), 1000);
    }
  }, []);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, []);

  // Get iOS install instructions
  const getIOSInstructions = useCallback(() => {
    return [
      'Tap the Share button in Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to install the app',
    ];
  }, []);

  return {
    ...state,
    install,
    dismissPrompt,
    shouldShowPrompt,
    updateApp,
    clearCache,
    getIOSInstructions,
  };
}

export default usePWA;
