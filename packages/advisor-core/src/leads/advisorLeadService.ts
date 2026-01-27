import { supabase } from '@mpbhealth/database';
import type { AssignedLeadView } from './types';

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
}

export const advisorLeadService = new AdvisorLeadService();
