import { supabase } from '@mpbhealth/database';
import type { AssignedLeadView, LeadDetail } from './types';

export class AdvisorLeadService {
  async getAssignedLeads(userId: string): Promise<AssignedLeadView[]> {
    const { data: leads, error } = await supabase
      .from('zoho_lead_submissions')
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

    return (leads || []).map((lead: any) => ({
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      pipeline_stage: lead.crm_pipeline_stages?.name || null,
      pipeline_stage_color: lead.crm_pipeline_stages?.color || null,
      priority: lead.priority,
      last_activity_at: lead.last_activity_at,
      created_at: lead.created_at,
    }));
  }

  async getAssignedLeadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('zoho_lead_submissions')
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
      .from('zoho_lead_submissions')
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
        assigned_advisor:advisor_profiles!zoho_lead_submissions_assigned_to_fkey (
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

    return {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      secondary_phone: lead.secondary_phone,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      date_of_birth: lead.date_of_birth,
      medicare_number: lead.medicare_number,
      pipeline_stage: (lead.crm_pipeline_stages as any)?.name || null,
      pipeline_stage_color: (lead.crm_pipeline_stages as any)?.color || null,
      priority: lead.priority,
      source: lead.source,
      assigned_to: lead.assigned_to,
      assigned_advisor_name: lead.assigned_advisor
        ? `${(lead.assigned_advisor as any).first_name} ${(lead.assigned_advisor as any).last_name}`
        : null,
      last_contacted_at: lead.last_contacted_at,
      last_activity_at: lead.last_activity_at,
      next_follow_up_at: lead.next_follow_up_at,
      notes: lead.notes,
      tags: lead.tags || [],
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    };
  }
}

export const advisorLeadService = new AdvisorLeadService();
