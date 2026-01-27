import type { SupabaseClient } from '@supabase/supabase-js';
import type { UnifiedNotification } from './notificationCenterTypes';

export class NotificationCenterService {
  constructor(private supabase: SupabaseClient) {}

  async getNotifications(limit: number = 20): Promise<UnifiedNotification[]> {
    const notifications: UnifiedNotification[] = [];

    // 1. Unacknowledged lead notifications
    try {
      const { data: leadNotifs } = await this.supabase
        .from('lead_notifications')
        .select('id, lead_id, priority, is_repeat, created_at, acknowledged_at')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (leadNotifs) {
        // Get lead names for these notifications
        const leadIds = leadNotifs.map((n: any) => n.lead_id).filter(Boolean);
        const leadMap: Record<string, { first_name: string; last_name: string }> = {};

        if (leadIds.length > 0) {
          const { data: leads } = await this.supabase
            .from('zoho_lead_submissions')
            .select('id, first_name, last_name')
            .in('id', leadIds);
          if (leads) {
            for (const lead of leads) {
              leadMap[lead.id] = { first_name: lead.first_name, last_name: lead.last_name };
            }
          }
        }

        for (const n of leadNotifs) {
          const lead = leadMap[n.lead_id];
          notifications.push({
            id: `lead-${n.id}`,
            type: 'lead',
            title: lead
              ? `New Lead: ${lead.first_name} ${lead.last_name}`
              : 'New Lead Submission',
            body: n.is_repeat ? 'Repeat lead' : null,
            priority: n.priority || 'normal',
            lead_id: n.lead_id,
            created_at: n.created_at,
            read: false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching lead notifications:', error);
    }

    // 2. Overdue tasks
    try {
      const now = new Date().toISOString();
      const { data: overdueTasks } = await this.supabase
        .from('lead_tasks')
        .select('id, title, due_date, lead_id')
        .eq('completed', false)
        .lt('due_date', now)
        .order('due_date', { ascending: true })
        .limit(10);

      if (overdueTasks) {
        for (const task of overdueTasks) {
          notifications.push({
            id: `task-${task.id}`,
            type: 'task',
            title: `Overdue: ${task.title}`,
            body: `Due ${new Date(task.due_date).toLocaleDateString()}`,
            priority: 'high',
            lead_id: task.lead_id,
            created_at: task.due_date,
            read: false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
    }

    // 3. Upcoming calendar events (next 24h)
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: events } = await this.supabase
        .from('calendar_events')
        .select('id, title, start_time, lead_id')
        .gte('start_time', now.toISOString())
        .lte('start_time', tomorrow.toISOString())
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(5);

      if (events) {
        for (const event of events) {
          notifications.push({
            id: `event-${event.id}`,
            type: 'event',
            title: event.title,
            body: `At ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            priority: 'normal',
            lead_id: event.lead_id,
            created_at: event.start_time,
            read: true, // Events are informational
          });
        }
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return notifications.slice(0, limit);
  }

  async getUnreadCount(): Promise<number> {
    try {
      // Count unacknowledged lead notifications
      const { count: leadCount } = await this.supabase
        .from('lead_notifications')
        .select('id', { count: 'exact', head: true })
        .is('acknowledged_at', null);

      // Count overdue tasks
      const { count: taskCount } = await this.supabase
        .from('lead_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('completed', false)
        .lt('due_date', new Date().toISOString());

      return (leadCount || 0) + (taskCount || 0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Only lead notifications can be acknowledged
      if (notificationId.startsWith('lead-')) {
        const dbId = notificationId.replace('lead-', '');
        const { data: { user } } = await this.supabase.auth.getUser();
        await this.supabase
          .from('lead_notifications')
          .update({
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: user?.id,
          })
          .eq('id', dbId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      await this.supabase
        .from('lead_notifications')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
        })
        .is('acknowledged_at', null);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
}

export function createNotificationCenterService(supabase: SupabaseClient): NotificationCenterService {
  return new NotificationCenterService(supabase);
}
