// ============================================================================
// Notification Ticker Service
// Real-time activity feed for CRM changes across all apps
// ============================================================================

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  TickerItem,
  TickerEventType,
  TickerPriority,
  TickerFilter,
  TickerStats,
  TickerSubscriptionCallback,
} from './tickerTypes';
import { TICKER_EVENT_CONFIG } from './tickerTypes';

export class TickerService {
  private channels: RealtimeChannel[] = [];
  private callbacks: Set<TickerSubscriptionCallback> = new Set();
  private localCache: TickerItem[] = [];
  private maxCacheSize = 100;

  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Subscribe to real-time ticker events
   */
  subscribeToTicker(callback: TickerSubscriptionCallback): () => void {
    this.callbacks.add(callback);

    // If this is the first subscriber, set up channels
    if (this.callbacks.size === 1) {
      this.setupRealtimeChannels();
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.cleanup();
      }
    };
  }

  /**
   * Set up real-time channels for all relevant tables
   */
  private setupRealtimeChannels(): void {
    // Lead submissions channel
    const leadsChannel = this.supabase
      .channel('ticker_leads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_submissions' },
        (payload) => this.handleLeadInsert(payload.new as any)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lead_submissions' },
        (payload) => this.handleLeadUpdate(payload.new as any, payload.old as any)
      )
      .subscribe();
    this.channels.push(leadsChannel);

    // Tasks channel
    const tasksChannel = this.supabase
      .channel('ticker_tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_tasks' },
        (payload) => this.handleTaskInsert(payload.new as any)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lead_tasks' },
        (payload) => this.handleTaskUpdate(payload.new as any, payload.old as any)
      )
      .subscribe();
    this.channels.push(tasksChannel);

    // Activities channel
    const activitiesChannel = this.supabase
      .channel('ticker_activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_activities' },
        (payload) => this.handleActivityInsert(payload.new as any)
      )
      .subscribe();
    this.channels.push(activitiesChannel);

    // Calendar events channel
    const calendarChannel = this.supabase
      .channel('ticker_calendar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calendar_events' },
        (payload) => this.handleCalendarInsert(payload.new as any)
      )
      .subscribe();
    this.channels.push(calendarChannel);

    // CRM Deals channel (if table exists)
    const dealsChannel = this.supabase
      .channel('ticker_deals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_deals' },
        (payload) => this.handleDealInsert(payload.new as any)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crm_deals' },
        (payload) => this.handleDealUpdate(payload.new as any, payload.old as any)
      )
      .subscribe();
    this.channels.push(dealsChannel);

    // CRM Contacts channel
    const contactsChannel = this.supabase
      .channel('ticker_contacts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_contacts' },
        (payload) => this.handleContactInsert(payload.new as any)
      )
      .subscribe();
    this.channels.push(contactsChannel);

    // CRM Accounts channel
    const accountsChannel = this.supabase
      .channel('ticker_accounts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_accounts' },
        (payload) => this.handleAccountInsert(payload.new as any)
      )
      .subscribe();
    this.channels.push(accountsChannel);
  }

  /**
   * Clean up all channels
   */
  cleanup(): void {
    for (const channel of this.channels) {
      this.supabase.removeChannel(channel);
    }
    this.channels = [];
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  private handleLeadInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'lead_created',
      priority: this.determinePriority(data),
      title: 'New Lead',
      message: `${data.first_name || ''} ${data.last_name || ''} submitted a request`.trim(),
      entityId: data.id,
      entityType: 'lead',
      metadata: { email: data.email, phone: data.phone },
    });
    this.emitItem(item);
  }

  private handleLeadUpdate(newData: any, oldData: any): void {
    // Check for stage change
    if (newData.pipeline_stage !== oldData.pipeline_stage) {
      const item = this.createTickerItem({
        type: 'lead_stage_changed',
        priority: 'normal',
        title: 'Lead Stage Changed',
        message: `${newData.first_name || ''} ${newData.last_name || ''} moved to ${newData.pipeline_stage || 'new stage'}`.trim(),
        entityId: newData.id,
        entityType: 'lead',
        metadata: {
          fromStage: oldData.pipeline_stage,
          toStage: newData.pipeline_stage,
        },
      });
      this.emitItem(item);
    } else {
      const item = this.createTickerItem({
        type: 'lead_updated',
        priority: 'low',
        title: 'Lead Updated',
        message: `${newData.first_name || ''} ${newData.last_name || ''} record updated`.trim(),
        entityId: newData.id,
        entityType: 'lead',
      });
      this.emitItem(item);
    }
  }

  private handleTaskInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'task_created',
      priority: data.priority === 'high' ? 'high' : 'normal',
      title: 'New Task',
      message: data.title || 'Task created',
      entityId: data.id,
      entityType: 'task',
      metadata: { dueDate: data.due_date },
    });
    this.emitItem(item);
  }

  private handleTaskUpdate(newData: any, oldData: any): void {
    if (newData.completed && !oldData.completed) {
      const item = this.createTickerItem({
        type: 'task_completed',
        priority: 'normal',
        title: 'Task Completed',
        message: newData.title || 'Task marked complete',
        entityId: newData.id,
        entityType: 'task',
      });
      this.emitItem(item);
    }
  }

  private handleActivityInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'activity_logged',
      priority: 'low',
      title: 'Activity Logged',
      message: `${data.activity_type || 'Activity'}: ${data.description || ''}`.trim(),
      entityId: data.id,
      entityType: 'activity',
      metadata: { activityType: data.activity_type },
    });
    this.emitItem(item);
  }

  private handleCalendarInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'meeting_scheduled',
      priority: 'normal',
      title: 'Meeting Scheduled',
      message: data.title || 'New calendar event',
      entityId: data.id,
      entityType: 'calendar_event',
      metadata: { startTime: data.start_time },
    });
    this.emitItem(item);
  }

  private handleDealInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'deal_created',
      priority: 'high',
      title: 'New Deal',
      message: `${data.name || 'Deal'} - $${(data.amount || 0).toLocaleString()}`,
      entityId: data.id,
      entityType: 'deal',
      metadata: { amount: data.amount, stage: data.stage },
    });
    this.emitItem(item);
  }

  private handleDealUpdate(newData: any, oldData: any): void {
    if (newData.stage === 'won' && oldData.stage !== 'won') {
      const item = this.createTickerItem({
        type: 'deal_won',
        priority: 'urgent',
        title: 'Deal Won!',
        message: `${newData.name || 'Deal'} closed for $${(newData.amount || 0).toLocaleString()}`,
        entityId: newData.id,
        entityType: 'deal',
        metadata: { amount: newData.amount },
      });
      this.emitItem(item);
    } else if (newData.stage === 'lost' && oldData.stage !== 'lost') {
      const item = this.createTickerItem({
        type: 'deal_lost',
        priority: 'high',
        title: 'Deal Lost',
        message: `${newData.name || 'Deal'} - $${(newData.amount || 0).toLocaleString()}`,
        entityId: newData.id,
        entityType: 'deal',
        metadata: { amount: newData.amount, lostReason: newData.lost_reason },
      });
      this.emitItem(item);
    }
  }

  private handleContactInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'contact_created',
      priority: 'normal',
      title: 'New Contact',
      message: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Contact added',
      entityId: data.id,
      entityType: 'contact',
    });
    this.emitItem(item);
  }

  private handleAccountInsert(data: any): void {
    const item = this.createTickerItem({
      type: 'account_created',
      priority: 'normal',
      title: 'New Account',
      message: data.name || 'Account created',
      entityId: data.id,
      entityType: 'account',
    });
    this.emitItem(item);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createTickerItem(params: {
    type: TickerEventType;
    priority: TickerPriority;
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
    userId?: string;
    userName?: string;
    metadata?: Record<string, unknown>;
  }): TickerItem {
    const config = TICKER_EVENT_CONFIG[params.type];
    return {
      id: `${params.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      priority: params.priority,
      title: params.title,
      message: params.message,
      icon: config.icon,
      color: config.color,
      entityId: params.entityId,
      entityType: params.entityType,
      userId: params.userId,
      userName: params.userName,
      timestamp: new Date().toISOString(),
      read: false,
      metadata: params.metadata,
    };
  }

  private determinePriority(leadData: any): TickerPriority {
    // High value indicators
    if (leadData.is_vip || leadData.priority === 'high') return 'urgent';
    if (leadData.coverage_type === 'family' || leadData.coverage_type === 'group') return 'high';
    return 'normal';
  }

  private emitItem(item: TickerItem): void {
    // Add to cache
    this.localCache.unshift(item);
    if (this.localCache.length > this.maxCacheSize) {
      this.localCache.pop();
    }

    // Notify all subscribers
    for (const callback of this.callbacks) {
      try {
        callback(item);
      } catch (error) {
        console.error('[TickerService] Error in callback:', error);
      }
    }
  }

  // ============================================================================
  // Data Fetching Methods
  // ============================================================================

  /**
   * Get recent ticker items (from cache and database)
   */
  async getRecentItems(filter?: TickerFilter): Promise<TickerItem[]> {
    const limit = filter?.limit || 50;
    const items: TickerItem[] = [];

    try {
      // Fetch recent lead notifications
      const { data: leads } = await this.supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, pipeline_stage, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (leads) {
        for (const lead of leads) {
          items.push(this.createTickerItem({
            type: 'lead_created',
            priority: 'normal',
            title: 'New Lead',
            message: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
            entityId: lead.id,
            entityType: 'lead',
          }));
        }
      }

      // Fetch recent tasks
      const { data: tasks } = await this.supabase
        .from('lead_tasks')
        .select('id, title, completed, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (tasks) {
        for (const task of tasks) {
          items.push(this.createTickerItem({
            type: task.completed ? 'task_completed' : 'task_created',
            priority: 'normal',
            title: task.completed ? 'Task Completed' : 'New Task',
            message: task.title,
            entityId: task.id,
            entityType: 'task',
          }));
        }
      }

      // Fetch overdue tasks as alerts
      const now = new Date().toISOString();
      const { data: overdue } = await this.supabase
        .from('lead_tasks')
        .select('id, title, due_date')
        .eq('completed', false)
        .lt('due_date', now)
        .order('due_date', { ascending: true })
        .limit(5);

      if (overdue) {
        for (const task of overdue) {
          items.push(this.createTickerItem({
            type: 'task_overdue',
            priority: 'high',
            title: 'Overdue Task',
            message: task.title,
            entityId: task.id,
            entityType: 'task',
            metadata: { dueDate: task.due_date },
          }));
        }
      }

      // Fetch upcoming events
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: events } = await this.supabase
        .from('calendar_events')
        .select('id, title, start_time')
        .gte('start_time', now)
        .lte('start_time', tomorrow)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(5);

      if (events) {
        for (const event of events) {
          items.push(this.createTickerItem({
            type: 'meeting_scheduled',
            priority: 'normal',
            title: 'Upcoming',
            message: `${event.title} at ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            entityId: event.id,
            entityType: 'calendar_event',
          }));
        }
      }

    } catch (error) {
      console.error('[TickerService] Error fetching recent items:', error);
    }

    // Merge with cache and sort by timestamp
    const allItems = [...this.localCache, ...items];
    const uniqueItems = Array.from(
      new Map(allItems.map((item) => [item.id, item])).values()
    );

    // Apply filters
    let filtered = uniqueItems;
    if (filter?.types?.length) {
      filtered = filtered.filter((item) => filter.types!.includes(item.type));
    }
    if (filter?.priorities?.length) {
      filtered = filtered.filter((item) => filter.priorities!.includes(item.priority));
    }
    if (filter?.unreadOnly) {
      filtered = filtered.filter((item) => !item.read);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered.slice(0, limit);
  }

  /**
   * Get ticker statistics
   */
  async getStats(): Promise<TickerStats> {
    const items = await this.getRecentItems({ limit: 100 });

    const stats: TickerStats = {
      total: items.length,
      unread: items.filter((i) => !i.read).length,
      byType: {} as Record<TickerEventType, number>,
      byPriority: {} as Record<TickerPriority, number>,
    };

    for (const item of items) {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;
    }

    return stats;
  }

  /**
   * Create a custom alert/notification
   */
  pushAlert(title: string, message: string, priority: TickerPriority = 'normal'): void {
    const item = this.createTickerItem({
      type: 'alert',
      priority,
      title,
      message,
    });
    this.emitItem(item);
  }

  /**
   * Create a system notification
   */
  pushSystemMessage(message: string): void {
    const item = this.createTickerItem({
      type: 'system',
      priority: 'low',
      title: 'System',
      message,
    });
    this.emitItem(item);
  }

  /**
   * Get cached items (for instant display)
   */
  getCachedItems(): TickerItem[] {
    return [...this.localCache];
  }
}

export function createTickerService(supabase: SupabaseClient): TickerService {
  return new TickerService(supabase);
}
