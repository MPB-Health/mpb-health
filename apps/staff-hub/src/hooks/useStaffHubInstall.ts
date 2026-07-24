import { useCallback, useEffect, useState } from 'react';

const OFFER_KEY = 'staff-hub-offer-install';
const INSTALLED_KEY = 'staff-hub-pwa-installed';
const DISMISS_KEY = 'staff-hub-pwa-dismissed-until';
const SNOOZE_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function readDismissedUntil(): number | null {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function useStaffHubInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneDisplay();
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const macSafari =
      /macintosh/.test(ua) && /safari/.test(ua) && !/chrome|chromium|edg|android/.test(ua);
    const wasInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';

    setIsStandalone(standalone);
    setIsInstalled(standalone || wasInstalled);
    setIsIOS(ios);
    setIsMacSafari(macSafari);
    setDismissedUntil(readDismissedUntil());
  }, []);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      const until = readDismissedUntil();
      const standalone = isStandaloneDisplay();
      const wasInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';
      if (wasInstalled || standalone || (until && Date.now() < until)) {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      localStorage.setItem(INSTALLED_KEY, 'true');
      sessionStorage.removeItem(OFFER_KEY);
      setIsInstalled(true);
      setModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isSnoozed = Boolean(dismissedUntil && Date.now() < dismissedUntil);
  const canNativeInstall = Boolean(deferredPrompt);
  const needsManualInstall = isIOS || isMacSafari;
  const canOfferInstall = !isStandalone && !isInstalled && !isSnoozed && (canNativeInstall || needsManualInstall);

  const openModal = useCallback(() => {
    if (isStandalone || isInstalled) return;
    setModalOpen(true);
  }, [isStandalone, isInstalled]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    sessionStorage.removeItem(OFFER_KEY);
  }, []);

  const dismiss = useCallback(
    (days: number = SNOOZE_DAYS) => {
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
      setDismissedUntil(until);
      sessionStorage.removeItem(OFFER_KEY);
      setModalOpen(false);
    },
    [],
  );

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, 'true');
        setIsInstalled(true);
        sessionStorage.removeItem(OFFER_KEY);
        setModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[Staff Hub] Install prompt failed', err);
      return false;
    }
  }, [deferredPrompt]);

  // Post-login offer: session flag set on Login success.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(OFFER_KEY) !== '1') return;
    if (isStandalone || isInstalled || isSnoozed) {
      sessionStorage.removeItem(OFFER_KEY);
      return;
    }

    // Wait briefly so beforeinstallprompt can fire after navigation.
    const timer = window.setTimeout(() => {
      if (canNativeInstall || needsManualInstall) {
        setModalOpen(true);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [canNativeInstall, needsManualInstall, isStandalone, isInstalled, isSnoozed]);

  // If the deferred prompt arrives after the timer, still open when offer flag is set.
  useEffect(() => {
    if (sessionStorage.getItem(OFFER_KEY) !== '1') return;
    if (isStandalone || isInstalled || isSnoozed) return;
    if (canNativeInstall || needsManualInstall) {
      setModalOpen(true);
    }
  }, [canNativeInstall, needsManualInstall, isStandalone, isInstalled, isSnoozed]);

  const manualSteps = isIOS
    ? [
        'Tap Share in Safari',
        'Choose Add to Home Screen',
        'Tap Add to install Staff Hub',
      ]
    : isMacSafari
      ? [
          'Open the File menu in Safari',
          'Choose Add to Dock (or Add to Home Screen)',
          'Open Staff Hub from the Dock like an app',
        ]
      : [
          'Use your browser Install app menu',
          'Or pin Staff Hub from Chrome settings',
          'Open it from your apps list next time',
        ];

  return {
    modalOpen,
    openModal,
    closeModal,
    dismiss,
    install,
    canOfferInstall,
    canNativeInstall,
    needsManualInstall,
    isStandalone,
    isInstalled,
    isIOS,
    isMacSafari,
    manualSteps,
  };
}

export const STAFF_HUB_OFFER_INSTALL_KEY = OFFER_KEY;
