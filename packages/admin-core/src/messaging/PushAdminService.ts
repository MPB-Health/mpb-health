import { supabase } from '@mpbhealth/database';

export interface PushDevice {
  id: string;
  user_id: string;
  endpoint: string;
  created_at: string;
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PushAdminStats {
  total_devices: number;
  total_notifications: number;
  unread_notifications: number;
  notifications_today: number;
}

export class PushAdminService {
  async getDevices(limit = 100): Promise<PushDevice[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getNotificationEvents(filters?: {
    event_type?: string;
    user_id?: string;
    limit?: number;
  }): Promise<NotificationEvent[]> {
    let query = supabase
      .from('notification_events')
      .select('id, user_id, event_type, title, body, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50);

    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async broadcastNotification(params: {
    title: string;
    body: string;
    event_type: string;
    action_url?: string;
  }): Promise<void> {
    const { error } = await supabase.functions.invoke('notification-service', {
      body: {
        action: 'create_event',
        title: params.title,
        body: params.body,
        event_type: params.event_type,
        action_url: params.action_url,
      },
    });
    if (error) throw error;
  }

  async getStats(): Promise<PushAdminStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [devices, totalNotifs, unread, todayNotifs] = await Promise.all([
      supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('notification_events').select('id', { count: 'exact', head: true }),
      supabase.from('notification_events').select('id', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('notification_events').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);

    return {
      total_devices: devices.count || 0,
      total_notifications: totalNotifs.count || 0,
      unread_notifications: unread.count || 0,
      notifications_today: todayNotifs.count || 0,
    };
  }
}

export const pushAdminService = new PushAdminService();
