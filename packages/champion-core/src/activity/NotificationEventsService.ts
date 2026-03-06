import { supabase } from '@mpbhealth/database';

// ============================================================================
// Types
// ============================================================================

export type NotificationEventType =
  | 'chat_message'
  | 'chat_mention'
  | 'chat_dm'
  | 'ticket_reply'
  | 'ticket_status_change'
  | 'bulletin_published'
  | 'email_sent'
  | 'email_delivered'
  | 'email_opened'
  | 'system_alert';

export interface NotificationEvent {
  id: string;
  user_id: string;
  org_id: string;
  event_type: NotificationEventType;
  title: string;
  body: string | null;
  action_url: string | null;
  source_type: string | null;
  source_id: string | null;
  actor_id: string | null;
  actor_name?: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationEventsListOptions {
  unreadOnly?: boolean;
  eventType?: NotificationEventType;
  limit?: number;
  offset?: number;
}

// ============================================================================
// NotificationEventsService
// ============================================================================

export class NotificationEventsService {
  // =========================================================================
  // READ
  // =========================================================================

  async getEvents(
    userId: string,
    options: NotificationEventsListOptions = {},
  ): Promise<NotificationEvent[]> {
    const { unreadOnly = false, eventType, limit = 30, offset = 0 } = options;

    let query = supabase
      .from('notification_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[NotificationEventsService] Failed to fetch events:', error);
      throw error;
    }

    return data || [];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[NotificationEventsService] Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }

  // =========================================================================
  // WRITE
  // =========================================================================

  async markAsRead(userId: string, eventIds?: string[]): Promise<void> {
    let query = supabase
      .from('notification_events')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (eventIds && eventIds.length > 0) {
      query = query.in('id', eventIds);
    } else {
      query = query.eq('is_read', false);
    }

    const { error } = await query;

    if (error) {
      console.error('[NotificationEventsService] Failed to mark as read:', error);
      throw error;
    }
  }

  async markAllRead(userId: string): Promise<void> {
    return this.markAsRead(userId);
  }

  // =========================================================================
  // REALTIME
  // =========================================================================

  private _eventChannels = new Map<string, ReturnType<typeof supabase.channel>>();

  subscribeToEvents(
    userId: string,
    callback: (event: NotificationEvent) => void,
  ) {
    // Remove any existing subscription for this user to prevent duplicates
    const existing = this._eventChannels.get(userId);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(`notification-events-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as NotificationEvent);
        },
      )
      .subscribe();

    this._eventChannels.set(userId, channel);
    return channel;
  }

  unsubscribeFromEvents(userId: string) {
    const channel = this._eventChannels.get(userId);
    if (channel) {
      supabase.removeChannel(channel);
      this._eventChannels.delete(userId);
    }
  }
}

export const notificationEventsService = new NotificationEventsService();
