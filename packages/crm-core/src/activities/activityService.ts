import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeadActivity, ActivityCreateInput, ActivityType } from './types';

export class ActivityService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get activities for a specific lead
   */
  async getActivities(leadId: string, limit: number = 50): Promise<LeadActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get activities:', error);
        return [];
      }

      return data as LeadActivity[];
    } catch (error) {
      console.error('Get activities error:', error);
      return [];
    }
  }

  /**
   * Get recent activities across all leads
   */
  async getRecentActivities(limit: number = 20): Promise<LeadActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('lead_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recent activities:', error);
        return [];
      }

      return data as LeadActivity[];
    } catch (error) {
      console.error('Get recent activities error:', error);
      return [];
    }
  }

  /**
   * Log an activity for a lead
   */
  async logActivity(
    leadId: string,
    activity: ActivityCreateInput
  ): Promise<{ success: boolean; activityId?: string; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      const { data, error } = await this.supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          ...activity,
          created_by: user?.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update last_contacted_at for contact activities
      if (['call', 'email', 'meeting', 'sms'].includes(activity.activity_type)) {
        await this.supabase
          .from('lead_submissions')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', leadId);
      }

      return { success: true, activityId: data?.id };
    } catch (error) {
      console.error('Log activity error:', error);
      return { success: false, error: 'Failed to log activity' };
    }
  }

  /**
   * Add a note to a lead
   */
  async addNote(
    leadId: string,
    title: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'note',
      title,
      description,
    });
  }

  /**
   * Log a call activity
   */
  async logCall(
    leadId: string,
    outcome: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'call',
      title: `Call: ${outcome}`,
      description: notes,
      metadata: { outcome },
    });
  }

  /**
   * Log an email activity
   */
  async logEmail(
    leadId: string,
    subject: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'email',
      title: `Email: ${subject}`,
      description: notes,
      metadata: { subject },
    });
  }

  /**
   * Log a meeting activity
   */
  async logMeeting(
    leadId: string,
    title: string,
    notes?: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'meeting',
      title: `Meeting: ${title}`,
      description: notes,
      metadata,
    });
  }

  /**
   * Log a stage change
   */
  async logStageChange(
    leadId: string,
    fromStage: string,
    toStage: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'stage_change',
      title: 'Stage Changed',
      description: `Stage changed from "${fromStage}" to "${toStage}"`,
      metadata: { from: fromStage, to: toStage },
    });
  }

  /**
   * Log an assignment change
   */
  async logAssignment(
    leadId: string,
    assignedTo: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logActivity(leadId, {
      activity_type: 'assignment',
      title: 'Lead Assigned',
      description: 'Lead assigned to new team member',
      metadata: { assigned_to: assignedTo },
    });
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('lead_activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete activity error:', error);
      return { success: false, error: 'Failed to delete activity' };
    }
  }

  /**
   * Bulk log activities (End of Day form)
   */
  async logBulkActivities(
    entries: Array<{
      lead_id: string;
      activity_type: ActivityType;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<{ success: number; failed: number }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    let success = 0;
    let failed = 0;

    const contactTypes: ActivityType[] = ['call', 'email', 'meeting', 'sms', 'linkedin_message', 'live_chat'];

    for (const entry of entries) {
      const { error } = await this.supabase.from('lead_activities').insert({
        lead_id: entry.lead_id,
        activity_type: entry.activity_type,
        title: entry.title,
        description: entry.description,
        metadata: entry.metadata || {},
        created_by: user?.id,
      });

      if (error) {
        failed++;
        continue;
      }
      success++;

      if (contactTypes.includes(entry.activity_type)) {
        await this.supabase
          .from('lead_submissions')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', entry.lead_id);
      }
    }

    return { success, failed };
  }
}

// Factory function
export function createActivityService(supabase: SupabaseClient): ActivityService {
  return new ActivityService(supabase);
}
