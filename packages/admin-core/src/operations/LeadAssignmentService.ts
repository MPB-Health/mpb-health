import { supabase } from '@mpbhealth/database';

export interface AssignableLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  lead_score: number | null;
  assigned_to: string | null;
  assigned_advisor_name: string | null;
  source_page: string | null;
  created_at: string;
}

export interface AdvisorOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LeadAssignmentStats {
  total: number;
  unassigned: number;
  assigned: number;
}

export class LeadAssignmentService {
  async getAll(filters?: { assigned?: 'all' | 'assigned' | 'unassigned'; search?: string; priority?: string }): Promise<AssignableLead[]> {
    let query = supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, pipeline_stage, priority, lead_score, assigned_to, source_page, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filters?.assigned === 'unassigned') query = query.is('assigned_to', null);
    if (filters?.assigned === 'assigned') query = query.not('assigned_to', 'is', null);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.search) query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((d: any) => ({ ...d, assigned_advisor_name: null })) as AssignableLead[];
  }

  async getAdvisors(): Promise<AdvisorOption[]> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name, email')
      .eq('status', 'active')
      .order('last_name', { ascending: true });
    if (error) throw error;
    return (data || []) as AdvisorOption[];
  }

  async assignLead(leadId: string, advisorId: string): Promise<void> {
    const { error } = await supabase
      .from('lead_submissions')
      .update({ assigned_to: advisorId, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) throw error;
  }

  async unassignLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('lead_submissions')
      .update({ assigned_to: null, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) throw error;
  }

  async bulkAssign(leadIds: string[], advisorId: string): Promise<number> {
    const { error, count } = await supabase
      .from('lead_submissions')
      .update({ assigned_to: advisorId, updated_at: new Date().toISOString() })
      .in('id', leadIds);
    if (error) throw error;
    return count || leadIds.length;
  }

  async getStats(): Promise<LeadAssignmentStats> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('id, assigned_to');
    if (error) throw error;
    const all = data || [];
    return {
      total: all.length,
      unassigned: all.filter((d: any) => !d.assigned_to).length,
      assigned: all.filter((d: any) => d.assigned_to).length,
    };
  }
}

export const leadAssignmentService = new LeadAssignmentService();
