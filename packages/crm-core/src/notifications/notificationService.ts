import type { SupabaseClient, RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import type {
  LeadSubmission,
  EnhancedLeadSubmission,
  NewLeadCallback,
  EnhancedLeadCallback,
  LeadCountsByPriority,
} from './types';
import type { NotificationPriority } from '../priority/types';
import { createClientLogger } from '@mpbhealth/utils';
import { PriorityService } from '../priority/priorityService';

const log = createClientLogger('NotificationService');

export class NotificationService {
  private realtimeChannel: RealtimeChannel | null = null;
  private newLeadCallbacks: Array<NewLeadCallback> = [];
  private enhancedLeadCallbacks: Array<EnhancedLeadCallback> = [];
  private priorityService: PriorityService;

  constructor(private supabase: SupabaseClient) {
    this.priorityService = new PriorityService(supabase);
  }

  /**
   * Subscribe to real-time lead submission updates.
   * Callbacks may fire in rapid succession; UI layers that trigger heavy work
   * (full dashboard refetch, etc.) should debounce/coalesce — see CRM `CRMProvider`.
   */
  subscribeToLeadSubmissions(onNewLead: NewLeadCallback): RealtimeChannel {
    this.newLeadCallbacks.push(onNewLead);

    if (this.realtimeChannel) {
      return this.realtimeChannel;
    }

    this.realtimeChannel = this.supabase
      .channel('lead_submissions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_submissions',
        },
        async (payload: RealtimePostgresInsertPayload<LeadSubmission>) => {
          const lead = payload.new;

          // Notify basic callbacks
          this.newLeadCallbacks.forEach((callback) => {
            try {
              callback(lead);
            } catch (error) {
              console.error('Lead notification callback error:', error);
            }
          });

          // Process enhanced callbacks with priority classification
          if (this.enhancedLeadCallbacks.length > 0) {
            try {
              const priority = await this.priorityService.classifyLeadPriority({
                id: lead.id,
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                phone: lead.phone,
                household_size: lead.household_size,
                zip_code: lead.zip_code,
                contact_preference: lead.contact_preference,
                primary_concern: lead.primary_concern,
                source_cta: lead.source_cta,
                created_at: lead.created_at,
              });

              const enhancedLead: EnhancedLeadSubmission = {
                ...lead,
                priority: priority.priority,
                isRepeatLead: priority.isRepeatLead,
                repeatCount: priority.repeatCount,
                priorityReasons: priority.reasons,
              };

              this.enhancedLeadCallbacks.forEach((callback) => {
                try {
                  callback(enhancedLead);
                } catch (error) {
                  console.error('Enhanced lead notification callback error:', error);
                }
              });
            } catch (error) {
              console.error('Error classifying lead priority:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        log.info('[NotificationService] Subscription status:', status);
      });

    return this.realtimeChannel;
  }

  /**
   * Subscribe to real-time lead submissions with priority classification
   */
  subscribeToEnhancedLeadSubmissions(onNewLead: EnhancedLeadCallback): RealtimeChannel {
    this.enhancedLeadCallbacks.push(onNewLead);

    if (!this.realtimeChannel) {
      this.subscribeToLeadSubmissions(() => {});
      this.newLeadCallbacks = this.newLeadCallbacks.filter(
        (cb) => cb.toString() !== '() => {}'
      );
    }

    return this.realtimeChannel!;
  }

  /**
   * Unsubscribe a specific callback
   */
  unsubscribeCallback(callback: NewLeadCallback): void {
    this.newLeadCallbacks = this.newLeadCallbacks.filter((cb) => cb !== callback);

    if (this.newLeadCallbacks.length === 0 && this.enhancedLeadCallbacks.length === 0) {
      this.cleanup();
    }
  }

  /**
   * Unsubscribe an enhanced callback
   */
  unsubscribeEnhancedCallback(callback: EnhancedLeadCallback): void {
    this.enhancedLeadCallbacks = this.enhancedLeadCallbacks.filter((cb) => cb !== callback);

    if (this.newLeadCallbacks.length === 0 && this.enhancedLeadCallbacks.length === 0) {
      this.cleanup();
    }
  }

  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribeAll(): void {
    this.cleanup();
    this.newLeadCallbacks = [];
    this.enhancedLeadCallbacks = [];
  }

  /**
   * Get recent lead submissions
   */
  async getRecentLeads(limit: number = 10): Promise<LeadSubmission[]> {
    const { data, error } = await this.supabase
      .from('lead_submissions')
      .select(
        'id, first_name, last_name, email, phone, household_size, zip_code, contact_preference, primary_concern, source_page, source_cta, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent leads:', error);
      return [];
    }

    return (data || []) as any;
  }

  /**
   * Get recent leads with priority classification
   */
  async getRecentEnhancedLeads(limit: number = 10): Promise<EnhancedLeadSubmission[]> {
    const leads = await this.getRecentLeads(limit);

    const enhancedLeads = await Promise.all(
      leads.map(async (lead) => {
        const priority = await this.priorityService.classifyLeadPriority({
          id: lead.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          household_size: lead.household_size,
          zip_code: lead.zip_code,
          contact_preference: lead.contact_preference,
          primary_concern: lead.primary_concern,
          source_cta: lead.source_cta,
          created_at: lead.created_at,
        });

        return {
          ...lead,
          priority: priority.priority,
          isRepeatLead: priority.isRepeatLead,
          repeatCount: priority.repeatCount,
          priorityReasons: priority.reasons,
        };
      })
    );

    return enhancedLeads;
  }

  /**
   * Get quick priority for a lead (sync, for UI display)
   */
  getLeadQuickPriority(lead: LeadSubmission): NotificationPriority {
    return this.priorityService.getQuickPriority({
      household_size: lead.household_size,
      contact_preference: lead.contact_preference,
      primary_concern: lead.primary_concern,
    });
  }

  /**
   * Get lead count for a specific time period
   */
  async getLeadCount(hoursBack: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);

    if (error) {
      console.error('Failed to get lead count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get lead counts by priority for a specific time period
   */
  async getLeadCountsByPriority(hoursBack: number = 24): Promise<LeadCountsByPriority> {
    const leads = await this.getRecentEnhancedLeads(100);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const recentLeads = leads.filter(
      (lead) => new Date(lead.created_at) >= cutoffTime
    );

    const counts: LeadCountsByPriority = {
      normal: 0,
      high: 0,
      critical: 0,
      total: recentLeads.length,
    };

    recentLeads.forEach((lead) => {
      counts[lead.priority]++;
    });

    return counts;
  }

  /**
   * Acknowledge a lead notification
   */
  async acknowledgeNotification(leadId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('lead_notifications')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
        })
        .eq('lead_id', leadId)
        .is('acknowledged_at', null);

      if (error) {
        console.error('Error acknowledging notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in acknowledgeNotification:', error);
      return false;
    }
  }

  /**
   * Cleanup realtime channel
   */
  private cleanup(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(dateString).toLocaleDateString();
}

// Factory function
export function createNotificationService(supabase: SupabaseClient): NotificationService {
  return new NotificationService(supabase);
}
