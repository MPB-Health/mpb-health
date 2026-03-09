import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export function PWAInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isOnline,
    needsUpdate,
    install,
    dismissPrompt,
    shouldShowPrompt,
    updateApp,
    getIOSInstructions,
  } = usePWA();

  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Show install banner after a delay
  useEffect(() => {
    if (shouldShowPrompt()) {
      const timer = setTimeout(() => setShowBanner(true), 30000); // 30 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  // Show update banner
  useEffect(() => {
    if (needsUpdate) {
      setShowUpdateBanner(true);
    }
  }, [needsUpdate]);

  // Show offline banner
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      setShowOfflineBanner(false);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    dismissPrompt(7); // Dismiss for 7 days
  };

  const handleUpdate = () => {
    updateApp();
    setShowUpdateBanner(false);
  };

  // Offline Banner
  if (showOfflineBanner && isStandalone) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 px-4 py-2 lg:ml-72">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You&apos;re offline. Some features may be unavailable.</span>
        </div>
      </div>
    );
  }

  // Update Banner
  if (showUpdateBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-primary-600 text-white px-4 py-3 lg:ml-72">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm font-medium">A new version is available!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-white text-primary-600 rounded-lg text-sm font-semibold hover:bg-primary-50"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="p-1.5 hover:bg-primary-500 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Install Guide
  if (showIOSGuide && isIOS) {
    const steps = getIOSInstructions();
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 lg:items-center">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden animate-slide-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Install Advisor Portal
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Install this app on your iPhone for the best experience.
            </p>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{step}</p>
                    {index === 0 && (
                      <div className="mt-2 flex items-center gap-2 text-neutral-500">
                        <Share className="w-5 h-5" />
                        <span className="text-xs">Share icon in Safari</span>
                      </div>
                    )}
                    {index === 1 && (
                      <div className="mt-2 flex items-center gap-2 text-neutral-500">
                        <Plus className="w-5 h-5" />
                        <span className="text-xs">Add to Home Screen option</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => {
                setShowIOSGuide(false);
                dismissPrompt(30);
              }}
              className="w-full py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Install Banner
  if (!showBanner || isInstalled || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] lg:bottom-4 lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Install Advisor Portal
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Add to your home screen for quick access and offline features.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            {isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>How to Install</span>
              </button>
            ) : (
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
