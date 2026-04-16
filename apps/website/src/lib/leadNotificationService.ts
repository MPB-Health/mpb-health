import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import {
  classifyLeadPriority,
  getQuickPriority,
  LeadPriority,
} from './leadPriorityService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadNotification');

export interface LeadSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size: number | null;
  zip_code?: string | null;
  contact_preference?: string | null;
  primary_concern?: string | null;
  source_page: string | null;
  source_cta: string | null;
  created_at: string;
}

export interface EnhancedLeadSubmission extends LeadSubmission {
  priority: LeadPriority;
  isRepeatLead: boolean;
  repeatCount: number;
  priorityReasons: string[];
}

export type NewLeadCallback = (lead: LeadSubmission) => void;
export type EnhancedLeadCallback = (lead: EnhancedLeadSubmission) => void;

let realtimeChannel: RealtimeChannel | null = null;
let newLeadCallbacks: Array<NewLeadCallback> = [];
let enhancedLeadCallbacks: Array<EnhancedLeadCallback> = [];

/**
 * Subscribe to real-time lead submission updates (basic)
 */
export const subscribeToLeadSubmissions = (
  onNewLead: NewLeadCallback
): RealtimeChannel => {
  // Add callback to list
  newLeadCallbacks.push(onNewLead);

  // If channel already exists, just return it
  if (realtimeChannel) {
    return realtimeChannel;
  }

  // Create new channel
  realtimeChannel = supabase
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
        newLeadCallbacks.forEach(callback => {
          try {
            callback(lead);
          } catch (error) {
            console.error('Lead notification callback error:', error);
          }
        });

        // Process enhanced callbacks with priority classification
        if (enhancedLeadCallbacks.length > 0) {
          try {
            const priority = await classifyLeadPriority({
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

            enhancedLeadCallbacks.forEach(callback => {
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
      log.info('[LeadNotificationService] Subscription status:', status);
    });

  return realtimeChannel;
};

/**
 * Subscribe to real-time lead submissions with priority classification
 */
export const subscribeToEnhancedLeadSubmissions = (
  onNewLead: EnhancedLeadCallback
): RealtimeChannel => {
  enhancedLeadCallbacks.push(onNewLead);

  // Ensure the channel is active
  if (!realtimeChannel) {
    // Create channel with a dummy basic callback
    subscribeToLeadSubmissions(() => {});
    // Remove the dummy callback
    newLeadCallbacks = newLeadCallbacks.filter(cb => cb.toString() !== '() => {}');
  }

  return realtimeChannel!;
};

/**
 * Unsubscribe a specific callback
 */
export const unsubscribeCallback = (callback: NewLeadCallback): void => {
  newLeadCallbacks = newLeadCallbacks.filter(cb => cb !== callback);
  
  // If no more callbacks, unsubscribe from channel
  if (newLeadCallbacks.length === 0 && enhancedLeadCallbacks.length === 0 && realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
};

/**
 * Unsubscribe an enhanced callback
 */
export const unsubscribeEnhancedCallback = (callback: EnhancedLeadCallback): void => {
  enhancedLeadCallbacks = enhancedLeadCallbacks.filter(cb => cb !== callback);
  
  if (newLeadCallbacks.length === 0 && enhancedLeadCallbacks.length === 0 && realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
};

/**
 * Unsubscribe from all real-time updates
 */
export const unsubscribeFromLeadSubmissions = (): void => {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
  newLeadCallbacks = [];
  enhancedLeadCallbacks = [];
};

/**
 * Get recent lead submissions for the notification dropdown
 */
export const getRecentLeads = async (limit: number = 10): Promise<LeadSubmission[]> => {
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('id, first_name, last_name, email, phone, household_size, zip_code, contact_preference, primary_concern, source_page, source_cta, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent leads:', error);
    return [];
  }

  return data || [];
};

/**
 * Get recent leads with priority classification
 */
export const getRecentEnhancedLeads = async (limit: number = 10): Promise<EnhancedLeadSubmission[]> => {
  const leads = await getRecentLeads(limit);

  const enhancedLeads = await Promise.all(
    leads.map(async (lead) => {
      const priority = await classifyLeadPriority({
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
};

/**
 * Get quick priority for a lead (sync, for UI display)
 */
export const getLeadQuickPriority = (lead: LeadSubmission): LeadPriority => {
  return getQuickPriority({
    household_size: lead.household_size,
    contact_preference: lead.contact_preference,
    primary_concern: lead.primary_concern,
  });
};

/**
 * Get lead count for a specific time period
 */
export const getLeadCount = async (hoursBack: number = 24): Promise<number> => {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('lead_submissions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', cutoffTime);

  if (error) {
    console.error('Failed to get lead count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get lead counts by priority for a specific time period
 */
export const getLeadCountsByPriority = async (
  hoursBack: number = 24
): Promise<{ normal: number; high: number; critical: number; total: number }> => {
  const leads = await getRecentEnhancedLeads(100); // Get more leads for accurate counts
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const recentLeads = leads.filter(
    (lead) => new Date(lead.created_at) >= cutoffTime
  );

  const counts = {
    normal: 0,
    high: 0,
    critical: 0,
    total: recentLeads.length,
  };

  recentLeads.forEach((lead) => {
    counts[lead.priority]++;
  });

  return counts;
};

/**
 * Get unread lead count (leads created since last check)
 * Uses localStorage to track last viewed timestamp
 */
const LAST_VIEWED_KEY = 'mpb_leads_last_viewed';

export const getLastViewedTimestamp = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_VIEWED_KEY);
};

export const setLastViewedTimestamp = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
};

export const getUnreadLeadCount = async (): Promise<number> => {
  const lastViewed = getLastViewedTimestamp();
  
  if (!lastViewed) {
    // First time - show leads from last 24 hours
    return getLeadCount(24);
  }

  const { count, error } = await supabase
    .from('lead_submissions')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', lastViewed);

  if (error) {
    console.error('Failed to get unread lead count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Check if a lead is a repeat submission
 */
export const checkIfRepeatLead = async (
  email: string,
  phone: string | null
): Promise<{ isRepeat: boolean; count: number }> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count: emailCount, error: emailError } = await supabase
    .from('lead_submissions')
    .select('id', { count: 'exact', head: true })
    .ilike('email', email)
    .lt('created_at', fiveMinutesAgo);

  if (emailError) {
    console.error('Error checking repeat by email:', emailError);
    return { isRepeat: false, count: 0 };
  }

  let phoneCount = 0;
  if (phone && phone.trim() !== '') {
    const { count, error: phoneError } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .lt('created_at', fiveMinutesAgo);

    if (!phoneError) {
      phoneCount = count || 0;
    }
  }

  const maxCount = Math.max(emailCount || 0, phoneCount);
  return {
    isRepeat: maxCount > 0,
    count: maxCount,
  };
};

/**
 * Format time ago for display
 */
export const formatTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(dateString).toLocaleDateString();
};

/**
 * Acknowledge a lead notification
 */
export const acknowledgeLeadNotification = async (
  leadId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
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
    console.error('Error in acknowledgeLeadNotification:', error);
    return false;
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (daysBack: number = 7) => {
  try {
    const { data, error } = await supabase.rpc('get_lead_notification_stats', {
      days_back: daysBack,
    });

    if (error) {
      console.error('Error fetching notification stats:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    return null;
  }
};
