import { supabase } from '@mpbhealth/database';
import type { AssignedLeadView, LeadDetail } from './types';

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  priority: string | null;
  last_activity_at: string | null;
  created_at: string;
  crm_pipeline_stages: { name: string; color: string }[] | null;
}

interface LeadDetailRow extends LeadRow {
  secondary_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  date_of_birth: string | null;
  medicare_number: string | null;
  source: string | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  tags: string[] | null;
  updated_at: string;
  assigned_advisor: { first_name: string; last_name: string }[] | null;
}

export class AdvisorLeadService {
  async getAssignedLeads(userId: string): Promise<AssignedLeadView[]> {
    const { data: leads, error } = await supabase
      .from('lead_submissions')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        priority,
        last_activity_at,
        created_at,
        pipeline_stage_id,
        crm_pipeline_stages (
          name,
          color
        )
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned leads:', error);
      return [];
    }

    return (leads || []).map((lead: LeadRow) => ({
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      pipeline_stage: lead.crm_pipeline_stages?.[0]?.name || null,
      pipeline_stage_color: lead.crm_pipeline_stages?.[0]?.color || null,
      priority: lead.priority,
      last_activity_at: lead.last_activity_at,
      created_at: lead.created_at,
    }));
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

  async getLead(leadId: string): Promise<LeadDetail | null> {
    const { data: lead, error } = await supabase
      .from('lead_submissions')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        secondary_phone,
        address,
        city,
        state,
        zip,
        date_of_birth,
        medicare_number,
        priority,
        source,
        assigned_to,
        last_contacted_at,
        last_activity_at,
        next_follow_up_at,
        notes,
        tags,
        created_at,
        updated_at,
        pipeline_stage_id,
        crm_pipeline_stages (
          name,
          color
        ),
        assigned_advisor:advisor_profiles!lead_submissions_assigned_to_fkey (
          first_name,
          last_name
        )
      `)
      .eq('id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching lead:', error);
      throw error;
    }

    const row = lead as LeadDetailRow;
    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      secondary_phone: row.secondary_phone,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      date_of_birth: row.date_of_birth,
      medicare_number: row.medicare_number,
      pipeline_stage: row.crm_pipeline_stages?.[0]?.name || null,
      pipeline_stage_color: row.crm_pipeline_stages?.[0]?.color || null,
      priority: row.priority,
      source: row.source,
      assigned_to: row.assigned_to,
      assigned_advisor_name: row.assigned_advisor?.length
        ? `${row.assigned_advisor[0].first_name} ${row.assigned_advisor[0].last_name}`
        : null,
      last_contacted_at: row.last_contacted_at,
      last_activity_at: row.last_activity_at,
      next_follow_up_at: row.next_follow_up_at,
      notes: row.notes,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const advisorLeadService = new AdvisorLeadService();
