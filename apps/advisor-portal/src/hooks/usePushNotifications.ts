import { useState, useEffect, useCallback } from 'react';
import { pushService } from '@mpbhealth/advisor-core';
import type { PushSettings } from '@mpbhealth/advisor-core';

// ============================================================================
// usePushNotifications — push opt-in, permission, settings
// ============================================================================

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<PushSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Check browser support
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check current subscription state
  useEffect(() => {
    async function checkSubscription() {
      try {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        // Silent fail
      }
    }

    checkSubscription();
  }, []);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await pushService.getSettings();
        setSettings(s);
      } catch {
        // Silent fail — user may not have settings row yet
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) throw new Error('Push notifications not supported');

    // Request notification permission
    const perm = await Notification.requestPermission();
    setPermission(perm);

    if (perm !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get VAPID public key from push-service
    const vapidPublicKey = await pushService.getVapidPublicKey();

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe with PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Extract keys
    const p256dh = arrayBufferToBase64Url(subscription.getKey('p256dh')!);
    const authKey = arrayBufferToBase64Url(subscription.getKey('auth')!);

    // Register with our push-service edge function
    await pushService.registerDevice({
      endpoint: subscription.endpoint,
      p256dh,
      auth_key: authKey,
      user_agent: navigator.userAgent,
    });

    // Enable push in settings
    await pushService.updateSettings({ push_enabled: true });

    setIsSubscribed(true);
    setSettings((prev) => prev ? { ...prev, push_enabled: true } : prev);
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unregister from our push-service
        await pushService.unregisterDevice(subscription.endpoint);
        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      // Disable push in settings
      await pushService.updateSettings({ push_enabled: false });

      setIsSubscribed(false);
      setSettings((prev) => prev ? { ...prev, push_enabled: false } : prev);
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe failed:', err);
    }
  }, []);

  // Update individual push settings
  const updateSettings = useCallback(async (updates: Partial<PushSettings>) => {
    await pushService.updateSettings(updates);
    setSettings((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    settings,
    loading,
    subscribe,
    unsubscribe,
    updateSettings,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
