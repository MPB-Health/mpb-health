import type { SupabaseClient } from '@supabase/supabase-js';
import type { UnifiedNotification } from './notificationCenterTypes';

export class NotificationCenterService {
  private tablesAvailable = true;

  constructor(private supabase: SupabaseClient) {}

  private async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return !!session?.access_token;
  }

  async getNotifications(limit: number = 20): Promise<UnifiedNotification[]> {
    if (!this.tablesAvailable || !(await this.isAuthenticated())) {
      return [];
    }

    const notifications: UnifiedNotification[] = [];

    // 1. Unacknowledged lead notifications
    try {
      const { data: leadNotifs, error } = await this.supabase
        .from('lead_notifications')
        .select('id, lead_id, priority, is_repeat, created_at, acknowledged_at')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (leadNotifs) {
        // Get lead names for these notifications
        const leadIds = leadNotifs.map((n: any) => n.lead_id).filter(Boolean);
        const leadMap: Record<string, { first_name: string; last_name: string }> = {};

        if (leadIds.length > 0) {
          const { data: leads } = await this.supabase
            .from('lead_submissions')
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
    } catch (error: unknown) {
      const pgErr = error instanceof Object ? (error as { code?: string; message?: string }) : null;
      if (pgErr?.code === '42P01' || pgErr?.message?.includes('does not exist')) {
        this.tablesAvailable = false;
        return [];
      }
      console.error('Error fetching lead notifications:', error);
    }

    // 2. Overdue tasks
    try {
      const now = new Date().toISOString();
      const { data: overdueTasks, error } = await this.supabase
        .from('lead_tasks')
        .select('id, title, due_date, lead_id')
        .eq('completed', false)
        .lt('due_date', now)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;

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
    } catch (error: unknown) {
      const pgErr = error instanceof Object ? (error as { code?: string; message?: string }) : null;
      if (pgErr?.code === '42P01' || pgErr?.message?.includes('does not exist')) {
        this.tablesAvailable = false;
        return [];
      }
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
    if (!this.tablesAvailable || !(await this.isAuthenticated())) {
      return 0;
    }

    try {
      let total = 0;

      const { count: leadCount, error: leadError } = await this.supabase
        .from('lead_notifications')
        .select('id', { count: 'exact', head: true })
        .is('acknowledged_at', null);

      if (leadError) {
        if (leadError.code === '42P01' || leadError.message?.includes('does not exist')) {
          this.tablesAvailable = false;
          return 0;
        }
      } else {
        total += leadCount || 0;
      }

      const { count: taskCount, error: taskError } = await this.supabase
        .from('lead_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('completed', false)
        .lt('due_date', new Date().toISOString());

      if (taskError) {
        if (taskError.code === '42P01' || taskError.message?.includes('does not exist')) {
          this.tablesAvailable = false;
          return 0;
        }
      } else {
        total += taskCount || 0;
      }

      return total;
    } catch {
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
