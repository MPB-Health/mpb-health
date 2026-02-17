import { supabase } from './supabase';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('PushNotification');

// ============================================================================
// Types
// ============================================================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  vibrate?: number[];
}

export type NotificationType = 
  | 'new_lead'
  | 'hot_lead'
  | 'task_due'
  | 'task_overdue'
  | 'lead_activity'
  | 'stage_change'
  | 'mention';

// ============================================================================
// Push Notification Service
// ============================================================================

class PushNotificationService {
  private vapidPublicKey: string;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    // VAPID public key should be set in environment
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  // --------------------------------------------------------------------------
  // Service Worker Registration
  // --------------------------------------------------------------------------

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Register service worker and get push subscription
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // Register the service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });

      log.info('Service Worker registered:', this.swRegistration);
      return this.swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
        });
      }

      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Save subscription to database
      await this.saveSubscription(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription();
      }
      return true;
    } catch (error) {
      console.error('Push unsubscribe failed:', error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Subscription Storage
  // --------------------------------------------------------------------------

  /**
   * Save push subscription to user preferences
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        push_enabled: true,
        push_subscription: subscription,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  /**
   * Remove push subscription from user preferences
   */
  private async removeSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notification_preferences')
      .update({
        push_enabled: false,
        push_subscription: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  /**
   * Get user's push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('push_subscription')
      .eq('user_id', user.id)
      .single();

    if (error || !data?.push_subscription) {
      return null;
    }

    return data.push_subscription as PushSubscription;
  }

  // --------------------------------------------------------------------------
  // Local Notifications (In-browser)
  // --------------------------------------------------------------------------

  /**
   * Show a local notification (doesn't require push subscription)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) return;

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') return;
    }

    if (this.swRegistration) {
      // Use service worker for better reliability
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/assets/mpb-logo.png',
        badge: payload.badge || '/assets/mpb-badge.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        vibrate: payload.vibrate,
        ...(payload.actions ? { actions: payload.actions } : {}),
      } as NotificationOptions);
    } else {
      // Fallback to basic notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/assets/mpb-logo.png',
        tag: payload.tag,
        data: payload.data,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Notification Helpers
  // --------------------------------------------------------------------------

  /**
   * Send new lead notification
   */
  async notifyNewLead(lead: {
    id: string;
    first_name: string;
    last_name: string;
    priority: string;
    source?: string;
  }): Promise<void> {
    const isHot = lead.priority === 'high' || lead.priority === 'urgent';
    
    await this.showLocalNotification({
      title: isHot ? '🔥 Hot Lead!' : '🎯 New Lead',
      body: `${lead.first_name} ${lead.last_name}${lead.source ? ` from ${lead.source}` : ''}`,
      tag: `lead-${lead.id}`,
      data: {
        type: isHot ? 'hot_lead' : 'new_lead',
        leadId: lead.id,
        url: `/admin/crm/leads/${lead.id}`,
      },
      requireInteraction: isHot,
      actions: [
        { action: 'view', title: 'View Lead' },
        { action: 'call', title: 'Call Now' },
      ],
      vibrate: isHot ? [200, 100, 200, 100, 200] : [200, 100, 200],
    });
  }

  /**
   * Send task due notification
   */
  async notifyTaskDue(task: {
    id: string;
    title: string;
    lead_id: string;
    due_date: string;
    is_overdue?: boolean;
  }): Promise<void> {
    await this.showLocalNotification({
      title: task.is_overdue ? '⚠️ Overdue Task' : '⏰ Task Due',
      body: task.title,
      tag: `task-${task.id}`,
      data: {
        type: task.is_overdue ? 'task_overdue' : 'task_due',
        taskId: task.id,
        leadId: task.lead_id,
        url: `/admin/crm/leads/${task.lead_id}`,
      },
      requireInteraction: task.is_overdue,
      actions: [
        { action: 'complete', title: 'Mark Complete' },
        { action: 'view', title: 'View' },
      ],
    });
  }

  /**
   * Send stage change notification
   */
  async notifyStageChange(lead: {
    id: string;
    first_name: string;
    last_name: string;
    old_stage: string;
    new_stage: string;
  }): Promise<void> {
    const isPositive = ['qualified', 'proposal', 'negotiation', 'won'].includes(lead.new_stage);
    
    await this.showLocalNotification({
      title: isPositive ? '📈 Lead Progress' : '📊 Stage Update',
      body: `${lead.first_name} ${lead.last_name}: ${lead.old_stage} → ${lead.new_stage}`,
      tag: `stage-${lead.id}`,
      data: {
        type: 'stage_change',
        leadId: lead.id,
        url: `/admin/crm/leads/${lead.id}`,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Notification Preferences
  // --------------------------------------------------------------------------

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<{
    push_enabled: boolean;
    push_new_leads: boolean;
    push_hot_leads: boolean;
    push_task_due: boolean;
    push_lead_activity: boolean;
  } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('push_enabled, push_new_leads, push_hot_leads, push_task_due, push_lead_activity')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Return defaults if no preferences exist
      return {
        push_enabled: false,
        push_new_leads: true,
        push_hot_leads: true,
        push_task_due: true,
        push_lead_activity: false,
      };
    }

    return data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: {
    push_enabled?: boolean;
    push_new_leads?: boolean;
    push_hot_leads?: boolean;
    push_task_due?: boolean;
    push_lead_activity?: boolean;
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return !error;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();

// ============================================================================
// Service Worker Code (to be placed in public/sw-push.js)
// ============================================================================
export const SERVICE_WORKER_CODE = `
// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/assets/mpb-logo.png',
    badge: data.badge || '/assets/mpb-badge.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MPB Health', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/admin/crm';

  if (data.url) {
    url = data.url;
  } else if (data.leadId) {
    url = '/admin/crm/leads/' + data.leadId;
  }

  if (event.action === 'view') {
    url = data.url || '/admin/crm';
  } else if (event.action === 'call' && data.phone) {
    url = 'tel:' + data.phone;
  } else if (event.action === 'complete' && data.taskId) {
    // Could trigger task completion via fetch
    url = data.url || '/admin/crm';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', data: data });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  // Track notification dismissal if needed
  // Note: This is in service worker code string, so we can't use logger here
  // Keeping console.log as it's inside a template string
});
`;

