// ============================================================================
// Notification Service — User notifications management
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Notification,
  CreateNotificationInput,
  NotificationSummary,
  NotificationPreferencesOverride,
  UpdatePreferencesOverrideInput,
  NotificationCategory,
} from './types';

export class NotificationService {
  private _notificationChannel: RealtimeChannel | null = null;
  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      category?: NotificationCategory;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });

    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    } else {
      // Exclude 'support' category — ticket notifications now flow exclusively
      // through notification_events (Activity tab). Legacy support entries in
      // this table came from the deprecated ticket-webhook-receiver.
      query = query.neq('category', 'support');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[NotificationService] Failed to get notifications:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[NotificationService] Failed to get unread count:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Get notification summary
   */
  async getNotificationSummary(userId: string): Promise<NotificationSummary> {
    const notifications = await this.getNotifications(userId, { unreadOnly: true, limit: 100 });

    const byCategory: Record<string, number> = {};
    let hasUrgent = false;

    notifications.forEach((n) => {
      const cat = n.category || 'system';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      if (n.priority === 'urgent') hasUrgent = true;
    });

    return {
      total_unread: notifications.length,
      by_category: byCategory,
      has_urgent: hasUrgent,
    };
  }

  /**
   * Create a notification
   */
  async createNotification(
    orgId: string,
    input: CreateNotificationInput
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        org_id: orgId,
        user_id: input.user_id,
        title: input.title,
        body: input.body,
        icon: input.icon,
        action_url: input.action_url,
        action_label: input.action_label,
        priority: input.priority || 'normal',
        category: input.category,
        channels: input.channels || ['in_app'],
        scheduled_for: input.scheduled_for,
        expires_at: input.expires_at,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[NotificationService] Failed to create notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    orgId: string,
    userIds: string[],
    notification: Omit<CreateNotificationInput, 'user_id'>
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      org_id: orgId,
      user_id: userId,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      action_url: notification.action_url,
      action_label: notification.action_label,
      priority: notification.priority || 'normal',
      category: notification.category,
      channels: notification.channels || ['in_app'],
      metadata: notification.metadata || {},
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      console.error('[NotificationService] Failed to create bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds?: string[]): Promise<number> {
    const { data, error } = await supabase.rpc('mark_notifications_read', {
      p_user_id: userId,
      p_notification_ids: notificationIds || null,
    });

    if (error) {
      console.error('[NotificationService] Failed to mark as read:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Mark a single notification as read
   */
  async markOneAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[NotificationService] Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[NotificationService] Failed to dismiss notification:', error);
      throw error;
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_dismissed', false);

    if (error) {
      console.error('[NotificationService] Failed to dismiss all:', error);
      throw error;
    }
  }

  // =========================================================================
  // PREFERENCES OVERRIDES
  // =========================================================================

  /**
   * Get user's notification preferences overrides
   */
  async getPreferencesOverrides(
    userId: string,
    orgId: string
  ): Promise<NotificationPreferencesOverride[]> {
    const { data, error } = await supabase
      .from('notification_preferences_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId);

    if (error) {
      console.error('[NotificationService] Failed to get overrides:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update preferences override for a category
   */
  async updatePreferencesOverride(
    userId: string,
    orgId: string,
    input: UpdatePreferencesOverrideInput
  ): Promise<NotificationPreferencesOverride> {
    const { data, error } = await supabase
      .from('notification_preferences_overrides')
      .upsert({
        user_id: userId,
        org_id: orgId,
        category: input.category,
        in_app_enabled: input.in_app_enabled,
        email_enabled: input.email_enabled,
        sms_enabled: input.sms_enabled,
        push_enabled: input.push_enabled,
        min_priority: input.min_priority,
      })
      .select()
      .single();

    if (error) {
      console.error('[NotificationService] Failed to update override:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // REALTIME SUBSCRIPTIONS
  // =========================================================================

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    if (this._notificationChannel) {
      supabase.removeChannel(this._notificationChannel);
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          if (notification.category === 'support') return;
          callback(notification);
        }
      )
      .subscribe();

    this._notificationChannel = channel;
    return channel;
  }

  /**
   * Unsubscribe from real-time notifications
   */
  unsubscribeFromNotifications(_userId: string) {
    if (this._notificationChannel) {
      supabase.removeChannel(this._notificationChannel);
      this._notificationChannel = null;
    }
  }
}

export const notificationService = new NotificationService();
