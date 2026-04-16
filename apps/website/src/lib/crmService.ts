import { supabase } from './supabase';

// ============================================================================
// Types — canonical definitions live in @mpbhealth/crm-core.
// Re-exported here so existing import paths continue to work.
// ============================================================================

export type {
  Lead,
  LeadFilters,
  PipelineStage,
  CRMDashboardStats,
} from '@mpbhealth/crm-core';

export type {
  LeadActivity,
} from '@mpbhealth/crm-core';

import type { Lead, LeadFilters, PipelineStage, CRMDashboardStats } from '@mpbhealth/crm-core';
import type { LeadActivity } from '@mpbhealth/crm-core';

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  task_type: 'follow_up' | 'call' | 'email' | 'meeting' | 'other';
  due_date: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface BulkUpdateResult {
  success: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// CRM Service Class
// ============================================================================

class CRMService {
  // --------------------------------------------------------------------------
  // Dashboard Stats
  // --------------------------------------------------------------------------

  async getDashboardStats(): Promise<CRMDashboardStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_crm_dashboard_stats');

      if (error) {
        console.error('Failed to get CRM dashboard stats:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as CRMDashboardStats;
      }

      return null;
    } catch (error) {
      console.error('CRM dashboard stats error:', error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Pipeline Stages
  // --------------------------------------------------------------------------

  async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('id, name, display_name, color, icon, sort_order, is_active, is_won_stage, is_lost_stage')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get pipeline stages:', error);
        return this.getDefaultPipelineStages();
      }

      return data || this.getDefaultPipelineStages();
    } catch (error) {
      console.error('Pipeline stages error:', error);
      return this.getDefaultPipelineStages();
    }
  }

  private getDefaultPipelineStages(): PipelineStage[] {
    return [
      { id: '1', name: 'new', display_name: 'New', color: '#3B82F6', sort_order: 1, is_active: true, is_won_stage: false, is_lost_stage: false },
      { id: '2', name: 'contacted', display_name: 'Contacted', color: '#8B5CF6', sort_order: 2, is_active: true, is_won_stage: false, is_lost_stage: false },
      { id: '3', name: 'qualified', display_name: 'Qualified', color: '#10B981', sort_order: 3, is_active: true, is_won_stage: false, is_lost_stage: false },
      { id: '4', name: 'proposal', display_name: 'Proposal', color: '#F59E0B', sort_order: 4, is_active: true, is_won_stage: false, is_lost_stage: false },
      { id: '5', name: 'negotiation', display_name: 'Negotiation', color: '#EC4899', sort_order: 5, is_active: true, is_won_stage: false, is_lost_stage: false },
      { id: '6', name: 'won', display_name: 'Won', color: '#22C55E', sort_order: 6, is_active: true, is_won_stage: true, is_lost_stage: false },
      { id: '7', name: 'lost', display_name: 'Lost', color: '#EF4444', sort_order: 7, is_active: true, is_won_stage: false, is_lost_stage: true },
    ];
  }

  // --------------------------------------------------------------------------
  // Lead CRUD Operations
  // --------------------------------------------------------------------------

  async getLeads(
    filters: LeadFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ leads: Lead[]; total: number }> {
    try {
      let query = supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, household_size, zip_code, current_insurance, monthly_premium, coverage_preference, primary_concern, contact_preference, pipeline_stage, priority, assigned_to, lead_score, tags, source_cta, source_page, utm_source, utm_medium, utm_campaign, created_at, updated_at, stage_changed_at, last_contacted_at, next_followup_at, converted_at, lost_reason, form_data, plan_type, carrier_id, tobacco_status, group_type, original_effective_date, premium_amount, subsidy_amount, member_responsibility, state, city', { count: 'exact' });

      // Apply filters
      if (filters.stage) {
        query = query.eq('pipeline_stage', filters.stage);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get leads:', error);
        return { leads: [], total: 0 };
      }

      return { leads: data as unknown as Lead[], total: count || 0 };
    } catch (error) {
      console.error('Get leads error:', error);
      return { leads: [], total: 0 };
    }
  }

  async getLeadsByStage(): Promise<Record<string, Lead[]>> {
    try {
      const { data, error } = await supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, household_size, zip_code, current_insurance, monthly_premium, coverage_preference, primary_concern, contact_preference, pipeline_stage, priority, assigned_to, lead_score, tags, source_cta, source_page, utm_source, utm_medium, utm_campaign, created_at, updated_at, stage_changed_at, last_contacted_at, next_followup_at, converted_at, lost_reason, form_data, plan_type, carrier_id, tobacco_status, group_type, original_effective_date, premium_amount, subsidy_amount, member_responsibility, state, city')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get leads by stage:', error);
        return {};
      }

      const grouped: Record<string, Lead[]> = {};
      for (const lead of data || []) {
        const stage = lead.pipeline_stage || 'new';
        if (!grouped[stage]) {
          grouped[stage] = [];
        }
        grouped[stage].push(lead as Lead);
      }

      return grouped;
    } catch (error) {
      console.error('Get leads by stage error:', error);
      return {};
    }
  }

  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, household_size, zip_code, current_insurance, monthly_premium, coverage_preference, primary_concern, contact_preference, pipeline_stage, priority, assigned_to, lead_score, tags, source_cta, source_page, utm_source, utm_medium, utm_campaign, created_at, updated_at, stage_changed_at, last_contacted_at, next_followup_at, converted_at, lost_reason, form_data, plan_type, carrier_id, tobacco_status, group_type, original_effective_date, premium_amount, subsidy_amount, member_responsibility, state, city')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get lead:', error);
        return null;
      }

      return data as unknown as Lead;
    } catch (error) {
      console.error('Get lead error:', error);
      return null;
    }
  }

  async updateLead(
    id: string,
    updates: Partial<Lead>,
    logActivity: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await supabase
        .from('lead_submissions')
        .select('pipeline_stage, assigned_to, priority')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('lead_submissions')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity for significant changes
      if (logActivity && currentLead) {
        if (updates.pipeline_stage && updates.pipeline_stage !== currentLead.pipeline_stage) {
          await this.logActivity(id, {
            activity_type: 'status_change',
            title: 'Stage Changed',
            description: `Stage changed from "${currentLead.pipeline_stage}" to "${updates.pipeline_stage}"`,
            metadata: { from: currentLead.pipeline_stage, to: updates.pipeline_stage },
          });
        }

        if (updates.assigned_to && updates.assigned_to !== currentLead.assigned_to) {
          await this.logActivity(id, {
            activity_type: 'assignment',
            title: 'Lead Assigned',
            description: `Lead assigned to new team member`,
            metadata: { assigned_to: updates.assigned_to },
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Update lead error:', error);
      return { success: false, error: 'Failed to update lead' };
    }
  }

  async updateLeadStage(
    id: string,
    stage: string,
    lostReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const updates: Partial<Lead> = { pipeline_stage: stage };
    if (lostReason) {
      updates.lost_reason = lostReason;
    }
    return this.updateLead(id, updates);
  }

  async assignLead(
    leadId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateLead(leadId, { assigned_to: userId });
  }

  async bulkUpdateLeads(
    leadIds: string[],
    updates: Partial<Lead>
  ): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = { success: 0, failed: 0, errors: [] };

    for (const id of leadIds) {
      const updateResult = await this.updateLead(id, updates, false);
      if (updateResult.success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push(`Lead ${id}: ${updateResult.error}`);
      }
    }

    return result;
  }

  async addTagsToLead(
    leadId: string,
    tags: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await supabase
        .from('lead_submissions')
        .select('tags')
        .eq('id', leadId)
        .single();

      const existingTags = currentLead?.tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];

      return this.updateLead(leadId, { tags: newTags }, false);
    } catch (error) {
      console.error('Add tags error:', error);
      return { success: false, error: 'Failed to add tags' };
    }
  }

  async removeTagFromLead(
    leadId: string,
    tag: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await supabase
        .from('lead_submissions')
        .select('tags')
        .eq('id', leadId)
        .single();

      const existingTags = currentLead?.tags || [];
      const newTags = existingTags.filter((t: string) => t !== tag);

      return this.updateLead(leadId, { tags: newTags }, false);
    } catch (error) {
      console.error('Remove tag error:', error);
      return { success: false, error: 'Failed to remove tag' };
    }
  }

  // --------------------------------------------------------------------------
  // Activity Logging
  // --------------------------------------------------------------------------

  async getActivities(
    leadId: string,
    limit: number = 50
  ): Promise<LeadActivity[]> {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('id, lead_id, activity_type, title, description, metadata, created_by, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get activities:', error);
        return [];
      }

      return data as unknown as LeadActivity[];
    } catch (error) {
      console.error('Get activities error:', error);
      return [];
    }
  }

  async logActivity(
    leadId: string,
    activity: Omit<LeadActivity, 'id' | 'lead_id' | 'created_at'>
  ): Promise<{ success: boolean; activityId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
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
      if (['call', 'email', 'meeting'].includes(activity.activity_type)) {
        await supabase
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

  // --------------------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------------------

  async getTasks(
    leadId?: string,
    includeCompleted: boolean = false
  ): Promise<LeadTask[]> {
    try {
      let query = supabase
        .from('lead_tasks')
        .select('id, lead_id, title, description, task_type, due_date, due_time, priority, completed, completed_at, completed_by, assigned_to, created_by, created_at, updated_at')
        .order('due_date', { ascending: true });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      if (!includeCompleted) {
        query = query.eq('completed', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get tasks:', error);
        return [];
      }

      return data as unknown as LeadTask[];
    } catch (error) {
      console.error('Get tasks error:', error);
      return [];
    }
  }

  async getOverdueTasks(): Promise<LeadTask[]> {
    try {
      const { data, error } = await supabase
        .from('lead_tasks')
        .select('id, lead_id, title, description, task_type, due_date, due_time, priority, completed, completed_at, completed_by, assigned_to, created_by, created_at, updated_at')
        .eq('completed', false)
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Failed to get overdue tasks:', error);
        return [];
      }

      return data as unknown as LeadTask[];
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      return [];
    }
  }

  async getTasksDueToday(): Promise<LeadTask[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('lead_tasks')
        .select('id, lead_id, title, description, task_type, due_date, due_time, priority, completed, completed_at, completed_by, assigned_to, created_by, created_at, updated_at')
        .eq('completed', false)
        .gte('due_date', startOfDay)
        .lt('due_date', endOfDay)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Failed to get tasks due today:', error);
        return [];
      }

      return data as unknown as LeadTask[];
    } catch (error) {
      console.error('Get tasks due today error:', error);
      return [];
    }
  }

  async createTask(
    task: Omit<LeadTask, 'id' | 'created_at' | 'updated_at' | 'completed' | 'completed_at' | 'completed_by'>
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lead_tasks')
        .insert({
          ...task,
          created_by: user?.id,
          completed: false,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logActivity(task.lead_id, {
        activity_type: 'task_created',
        title: 'Task Created',
        description: task.title,
        metadata: { task_id: data?.id, due_date: task.due_date },
      });

      // Update next followup date on lead
      await supabase
        .from('lead_submissions')
        .update({ next_followup_at: task.due_date })
        .eq('id', task.lead_id);

      return { success: true, taskId: data?.id };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: 'Failed to create task' };
    }
  }

  async completeTask(
    taskId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: task, error: fetchError } = await supabase
        .from('lead_tasks')
        .select('id, lead_id, title, description, task_type, due_date, due_time, priority, completed, completed_at, completed_by, assigned_to, created_by, created_at, updated_at')
        .eq('id', taskId)
        .single();

      if (fetchError || !task) {
        return { success: false, error: 'Task not found' };
      }

      const { error } = await supabase
        .from('lead_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logActivity(task.lead_id, {
        activity_type: 'task_completed',
        title: 'Task Completed',
        description: task.title,
        metadata: { task_id: taskId },
      });

      return { success: true };
    } catch (error) {
      console.error('Complete task error:', error);
      return { success: false, error: 'Failed to complete task' };
    }
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('lead_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: 'Failed to delete task' };
    }
  }

  // --------------------------------------------------------------------------
  // Recent Activity Feed
  // --------------------------------------------------------------------------

  async getRecentActivities(limit: number = 20): Promise<LeadActivity[]> {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('id, lead_id, activity_type, title, description, metadata, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recent activities:', error);
        return [];
      }

      return data as unknown as LeadActivity[];
    } catch (error) {
      console.error('Get recent activities error:', error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Export Utilities
  // --------------------------------------------------------------------------

  async getLeadsForExport(
    leadIds?: string[],
    filters?: LeadFilters
  ): Promise<Lead[]> {
    try {
      let query = supabase.from('lead_submissions').select('id, first_name, last_name, email, phone, household_size, zip_code, current_insurance, monthly_premium, coverage_preference, primary_concern, contact_preference, pipeline_stage, priority, assigned_to, lead_score, tags, source_cta, source_page, utm_source, utm_medium, utm_campaign, created_at, updated_at, stage_changed_at, last_contacted_at, next_followup_at, converted_at, lost_reason, form_data, plan_type, carrier_id, tobacco_status, group_type, original_effective_date, premium_amount, subsidy_amount, member_responsibility, state, city');

      if (leadIds && leadIds.length > 0) {
        query = query.in('id', leadIds);
      } else if (filters) {
        if (filters.stage) {
          query = query.eq('pipeline_stage', filters.stage);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.assignedTo) {
          query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get leads for export:', error);
        return [];
      }

      return data as unknown as Lead[];
    } catch (error) {
      console.error('Get leads for export error:', error);
      return [];
    }
  }

  generateCSV(leads: Lead[], columns?: string[]): string {
    const defaultColumns = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'zip_code',
      'pipeline_stage',
      'priority',
      'lead_score',
      'source_cta',
      'created_at',
      'tags',
    ];

    const selectedColumns = columns || defaultColumns;

    const headers = selectedColumns.map((col) => 
      col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );

    const rows = leads.map((lead) =>
      selectedColumns.map((col) => {
        const value = lead[col as keyof Lead];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
    );

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  downloadCSV(leads: Lead[], filename: string = 'leads_export.csv', columns?: string[]): void {
    const csv = this.generateCSV(leads, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}

export const crmService = new CRMService();
