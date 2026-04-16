// ============================================================================
// Activity Service — Activity feed and logging
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  Activity,
  ActivityFeedItem,
  ActivityFeedParams,
  LogActivityInput,
  ActivityType,
  ActivitySubscription,
} from './types';

// Activity type configuration for display
export const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: string; color: string; verb: string }
> = {
  // Lead activities
  lead_created: { icon: '👤', color: 'blue', verb: 'created' },
  lead_updated: { icon: '✏️', color: 'gray', verb: 'updated' },
  lead_assigned: { icon: '👋', color: 'purple', verb: 'assigned' },
  lead_status_changed: { icon: '🔄', color: 'yellow', verb: 'changed status of' },
  lead_converted: { icon: '🎉', color: 'green', verb: 'converted' },
  lead_lost: { icon: '❌', color: 'red', verb: 'marked as lost' },

  // Message activities
  message_sent: { icon: '📤', color: 'blue', verb: 'sent message to' },
  message_received: { icon: '📥', color: 'green', verb: 'received message from' },
  message_opened: { icon: '👁️', color: 'gray', verb: 'opened' },

  // Task activities
  task_created: { icon: '📝', color: 'blue', verb: 'created task' },
  task_completed: { icon: '✅', color: 'green', verb: 'completed task' },
  task_overdue: { icon: '⚠️', color: 'red', verb: 'has overdue task' },
  task_assigned: { icon: '📋', color: 'purple', verb: 'assigned task to' },

  // Compliance activities
  compliance_completed: { icon: '🛡️', color: 'green', verb: 'completed compliance' },
  compliance_due: { icon: '📅', color: 'yellow', verb: 'has compliance due' },
  compliance_violation: { icon: '🚨', color: 'red', verb: 'compliance violation' },

  // Meeting activities
  meeting_scheduled: { icon: '📆', color: 'blue', verb: 'scheduled meeting' },
  meeting_started: { icon: '🎥', color: 'green', verb: 'started meeting' },
  meeting_completed: { icon: '✅', color: 'green', verb: 'completed meeting' },
  meeting_cancelled: { icon: '❌', color: 'red', verb: 'cancelled meeting' },

  // Sequence activities
  sequence_enrolled: { icon: '🔄', color: 'purple', verb: 'enrolled in sequence' },
  sequence_completed: { icon: '🏁', color: 'green', verb: 'completed sequence' },
  sequence_paused: { icon: '⏸️', color: 'yellow', verb: 'paused sequence' },

  // Team activities
  member_joined: { icon: '🎊', color: 'green', verb: 'joined the team' },
  member_left: { icon: '👋', color: 'gray', verb: 'left the team' },
  member_role_changed: { icon: '🔑', color: 'purple', verb: 'role changed' },

  // System activities
  goal_achieved: { icon: '🏆', color: 'gold', verb: 'achieved goal' },
  milestone_reached: { icon: '🎯', color: 'blue', verb: 'reached milestone' },
  system_alert: { icon: '⚡', color: 'yellow', verb: 'system alert' },
};

export class ActivityService {
  // =========================================================================
  // ACTIVITY LOGGING
  // =========================================================================

  /**
   * Log an activity
   */
  async logActivity(
    orgId: string,
    actorId: string,
    input: LogActivityInput
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_activity', {
      p_org_id: orgId,
      p_actor_id: actorId,
      p_activity_type: input.activity_type,
      p_title: input.title,
      p_description: input.description || null,
      p_lead_id: input.lead_id || null,
      p_metadata: input.metadata || {},
      p_notify_users: input.notify_users || [],
    });

    if (error) {
      console.error('[ActivityService] Failed to log activity:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create activity directly (without RPC)
   */
  async createActivity(
    orgId: string,
    actorId: string,
    input: LogActivityInput
  ): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        org_id: orgId,
        actor_id: actorId,
        activity_type: input.activity_type,
        title: input.title,
        description: input.description,
        lead_id: input.lead_id,
        contact_id: input.contact_id,
        conversation_id: input.conversation_id,
        task_id: input.task_id,
        metadata: input.metadata || {},
      })
      .select('id, org_id, actor_id, actor_type, activity_type, title, description, lead_id, contact_id, conversation_id, task_id, metadata, is_public, visible_to, created_at')
      .single();

    if (error) {
      console.error('[ActivityService] Failed to create activity:', error);
      throw error;
    }

    return data as any;
  }

  // =========================================================================
  // ACTIVITY FEED
  // =========================================================================

  /**
   * Get activity feed
   */
  async getActivityFeed(
    orgId: string,
    params: ActivityFeedParams = {}
  ): Promise<ActivityFeedItem[]> {
    const { data, error } = await supabase.rpc('get_activity_feed', {
      p_org_id: orgId,
      p_user_id: params.user_id || null,
      p_lead_id: params.lead_id || null,
      p_activity_types: params.activity_types || null,
      p_limit: params.limit || 50,
      p_offset: params.offset || 0,
    });

    if (error) {
      console.error('[ActivityService] Failed to get activity feed:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get activities for a specific lead
   */
  async getLeadActivities(
    orgId: string,
    leadId: string,
    limit: number = 20
  ): Promise<ActivityFeedItem[]> {
    return this.getActivityFeed(orgId, { lead_id: leadId, limit });
  }

  /**
   * Get activities by a specific user
   */
  async getUserActivities(
    orgId: string,
    userId: string,
    limit: number = 20
  ): Promise<ActivityFeedItem[]> {
    return this.getActivityFeed(orgId, { user_id: userId, limit });
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(
    orgId: string,
    types: ActivityType[],
    limit: number = 50
  ): Promise<ActivityFeedItem[]> {
    return this.getActivityFeed(orgId, { activity_types: types, limit });
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  /**
   * Subscribe to entity activities
   */
  async subscribeToEntity(
    userId: string,
    orgId: string,
    entityType: 'lead' | 'conversation' | 'sequence',
    entityId: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('subscribe_to_entity', {
      p_user_id: userId,
      p_org_id: orgId,
      p_entity_type: entityType,
      p_entity_id: entityId,
    });

    if (error) {
      console.error('[ActivityService] Failed to subscribe:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Unsubscribe from entity
   */
  async unsubscribeFromEntity(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('activity_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) {
      console.error('[ActivityService] Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Get user's subscriptions
   */
  async getSubscriptions(userId: string): Promise<ActivitySubscription[]> {
    const { data, error } = await supabase
      .from('activity_subscriptions')
      .select('id, user_id, org_id, entity_type, entity_id, notify_on_activity, notify_channels, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ActivityService] Failed to get subscriptions:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Check if user is subscribed to entity
   */
  async isSubscribed(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('activity_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ActivityService] Failed to check subscription:', error);
      throw error;
    }

    return !!data;
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Get activity configuration
   */
  getActivityConfig(type: ActivityType) {
    return ACTIVITY_CONFIG[type];
  }

  /**
   * Get all activity types
   */
  getActivityTypes(): ActivityType[] {
    return Object.keys(ACTIVITY_CONFIG) as ActivityType[];
  }

  /**
   * Group activities by date
   */
  groupActivitiesByDate(activities: ActivityFeedItem[]): Record<string, ActivityFeedItem[]> {
    return activities.reduce(
      (groups, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(activity);
        return groups;
      },
      {} as Record<string, ActivityFeedItem[]>
    );
  }
}

export const activityService = new ActivityService();
