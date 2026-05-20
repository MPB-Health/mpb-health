import { supabase } from '@mpbhealth/database';
import type {
  AssignedLeadView,
  AdvisorLeadUpdateInput,
  CreateLeadTaskInput,
  LeadActivity,
  LeadDetail,
  LeadTask,
  LogLeadActivityInput,
} from './types';

const LEAD_LIST_SELECT = `
  id,
  first_name,
  last_name,
  email,
  phone,
  priority,
  lead_score,
  lead_source,
  state,
  pipeline_stage,
  last_activity_at,
  next_followup_at,
  created_at,
  pipeline_stage_id,
  crm_pipeline_stages (
    name,
    color
  )
`;

const LEAD_DETAIL_SELECT = `
  id,
  first_name,
  last_name,
  email,
  phone,
  zip_code,
  city,
  state,
  priority,
  lead_score,
  lead_source,
  plan_type,
  primary_concern,
  household_size,
  assigned_to,
  last_contacted_at,
  last_activity_at,
  next_followup_at,
  tags,
  pipeline_stage,
  created_at,
  updated_at,
  pipeline_stage_id,
  crm_pipeline_stages (
    name,
    color
  )
`;

interface LeadListRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  priority: string | null;
  lead_score: number | null;
  lead_source: string | null;
  state: string | null;
  pipeline_stage: string | null;
  last_activity_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  crm_pipeline_stages: { name: string; color: string } | { name: string; color: string }[] | null;
}

interface LeadDetailRow extends LeadListRow {
  zip_code: string | null;
  city: string | null;
  plan_type: string | null;
  primary_concern: string | null;
  household_size: number | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  tags: string[] | null;
  updated_at: string | null;
}

function stageFromRow(row: { pipeline_stage?: string | null; crm_pipeline_stages?: LeadListRow['crm_pipeline_stages'] }): {
  name: string | null;
  color: string | null;
} {
  const stages = row.crm_pipeline_stages;
  const stage = Array.isArray(stages) ? stages[0] : stages;
  return {
    name: row.pipeline_stage || stage?.name || null,
    color: stage?.color || null,
  };
}

function mapListRow(lead: LeadListRow): AssignedLeadView {
  const stage = stageFromRow(lead);
  return {
    id: lead.id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    pipeline_stage: stage.name,
    pipeline_stage_color: stage.color,
    priority: lead.priority,
    lead_score: lead.lead_score,
    lead_source: lead.lead_source,
    state: lead.state,
    last_activity_at: lead.last_activity_at,
    next_followup_at: lead.next_followup_at,
    created_at: lead.created_at,
  };
}

export class AdvisorLeadService {
  async getAssignedLeads(userId: string): Promise<AssignedLeadView[]> {
    const { data: leads, error } = await supabase
      .from('lead_submissions')
      .select(LEAD_LIST_SELECT)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned leads:', error);
      return [];
    }

    return (leads || []).map((lead) => mapListRow(lead as LeadListRow));
  }

  async getAssignedLeadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId);

    if (error) {
      console.error('Error fetching assigned lead count:', error);
      return 0;
    }

    return count || 0;
  }

  async getLead(leadId: string, userId?: string): Promise<LeadDetail | null> {
    let query = supabase.from('lead_submissions').select(LEAD_DETAIL_SELECT).eq('id', leadId);
    if (userId) {
      query = query.eq('assigned_to', userId);
    }

    const { data: lead, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching lead:', error);
      throw error;
    }

    const row = lead as LeadDetailRow;
    const stage = stageFromRow(row);

    let assignedAdvisorName: string | null = null;
    if (row.assigned_to) {
      const { data: advisor } = await supabase
        .from('advisor_profiles')
        .select('first_name, last_name')
        .eq('id', row.assigned_to)
        .maybeSingle();
      if (advisor) {
        assignedAdvisorName = `${advisor.first_name} ${advisor.last_name}`.trim();
      }
    }

    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      zip_code: row.zip_code,
      city: row.city,
      state: row.state,
      pipeline_stage: stage.name,
      pipeline_stage_color: stage.color,
      priority: row.priority,
      lead_score: row.lead_score,
      lead_source: row.lead_source,
      plan_type: row.plan_type,
      primary_concern: row.primary_concern,
      household_size: row.household_size,
      assigned_to: row.assigned_to,
      assigned_advisor_name: assignedAdvisorName,
      last_contacted_at: row.last_contacted_at,
      last_activity_at: row.last_activity_at,
      next_followup_at: row.next_followup_at,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updateLead(leadId: string, updates: AdvisorLeadUpdateInput): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('lead_submissions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_activity_at: updates.last_activity_at ?? new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async markContacted(leadId: string): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    return this.updateLead(leadId, {
      last_contacted_at: now,
      last_activity_at: now,
    });
  }

  async getLeadActivities(leadId: string, limit = 50): Promise<LeadActivity[]> {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('id, lead_id, activity_type, title, description, created_by, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching lead activities:', error);
      return [];
    }

    return (data || []) as LeadActivity[];
  }

  async logActivity(
    leadId: string,
    input: LogLeadActivityInput,
    userId: string,
  ): Promise<{ success: boolean; activityId?: string; error?: string }> {
    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: input.activity_type,
        title: input.title,
        description: input.description ?? null,
        org_id: input.org_id ?? null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const contactTypes = ['call', 'email', 'meeting', 'sms'];
    if (contactTypes.includes(input.activity_type)) {
      await this.markContacted(leadId);
    } else {
      await supabase
        .from('lead_submissions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);
    }

    return { success: true, activityId: data?.id };
  }

  async getLeadTasks(leadId: string, includeCompleted = false): Promise<LeadTask[]> {
    let query = supabase
      .from('lead_tasks')
      .select(
        'id, lead_id, title, description, task_type, due_date, priority, completed, completed_at, assigned_to, created_at',
      )
      .eq('lead_id', leadId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (!includeCompleted) {
      query = query.eq('completed', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching lead tasks:', error);
      return [];
    }

    return (data || []) as LeadTask[];
  }

  async createLeadTask(
    input: CreateLeadTaskInput,
    userId: string,
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    const { data, error } = await supabase
      .from('lead_tasks')
      .insert({
        lead_id: input.lead_id,
        title: input.title,
        description: input.description ?? null,
        task_type: input.task_type ?? 'follow_up',
        due_date: input.due_date ?? null,
        priority: input.priority ?? 'medium',
        assigned_to: input.assigned_to ?? userId,
        org_id: input.org_id ?? null,
        created_by: userId,
        completed: false,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (input.due_date) {
      await supabase
        .from('lead_submissions')
        .update({ next_followup_at: input.due_date })
        .eq('id', input.lead_id);
    }

    await this.logActivity(
      input.lead_id,
      {
        activity_type: 'task_created',
        title: 'Task created',
        description: input.title,
        org_id: input.org_id,
      },
      userId,
    );

    return { success: true, taskId: data?.id };
  }

  async completeLeadTask(taskId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { data: task, error: fetchError } = await supabase
      .from('lead_tasks')
      .select('id, lead_id, title')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: fetchError?.message ?? 'Task not found' };
    }

    const { error } = await supabase
      .from('lead_tasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      return { success: false, error: error.message };
    }

    await this.logActivity(
      task.lead_id,
      {
        activity_type: 'task_completed',
        title: 'Task completed',
        description: task.title,
      },
      userId,
    );

    return { success: true };
  }
}

export const advisorLeadService = new AdvisorLeadService();
