import { supabase } from '@mpbhealth/database';

export interface CRMSummary {
  total_leads: number;
  new_today: number;
  leads_by_stage: { stage: string; count: number; color: string }[];
  conversion_rate: number;
  pending_tasks: number;
}

export interface CRMLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  pipeline_stage_id: string | null;
  stage_name?: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMLeadDetail extends CRMLead {
  notes: string | null;
  metadata: Record<string, unknown> | null;
  activities: CRMActivity[];
  tasks: CRMTask[];
}

export interface CRMActivity {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
}

export interface CRMTask {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface CRMLeadFilters {
  status?: string;
  stage_id?: string;
  search?: string;
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

export class CRMBridgeService {
  async getCRMSummary(): Promise<CRMSummary> {
    const [totalLeads, newToday, stageData, convertedCount, pendingTasks] = await Promise.all([
      this.getTotalLeads(),
      this.getNewLeadsToday(),
      this.getLeadsByStage(),
      this.getConvertedCount(),
      this.getPendingTaskCount(),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;

    return {
      total_leads: totalLeads,
      new_today: newToday,
      leads_by_stage: stageData,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      pending_tasks: pendingTasks,
    };
  }

  private async getTotalLeads(): Promise<number> {
    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true });
    return count || 0;
  }

  private async getNewLeadsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    return count || 0;
  }

  private async getLeadsByStage(): Promise<{ stage: string; count: number; color: string }[]> {
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, color')
      .order('display_order', { ascending: true });

    if (!stages || stages.length === 0) return [];

    const results: { stage: string; count: number; color: string }[] = [];

    for (const stage of stages) {
      const { count } = await supabase
        .from('zoho_lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('pipeline_stage_id', stage.id);
      results.push({
        stage: stage.name,
        count: count || 0,
        color: stage.color || '#6B7280',
      });
    }

    return results;
  }

  private async getConvertedCount(): Promise<number> {
    // Find the "closed won" or final stage
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id')
      .eq('is_won_stage', true)
      .limit(1);

    if (!stages || stages.length === 0) {
      // Fallback: count leads marked as converted
      const { count } = await supabase
        .from('zoho_lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'converted');
      return count || 0;
    }

    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_stage_id', stages[0].id);
    return count || 0;
  }

  private async getPendingTaskCount(): Promise<number> {
    const { count } = await supabase
      .from('lead_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('completed', false);
    return count || 0;
  }

  // ── Lead management ─────────────────────────────────────────────────────────

  async getLeads(filters?: CRMLeadFilters): Promise<{ data: CRMLead[]; count: number }> {
    let query = supabase
      .from('zoho_lead_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.stage_id) {
      query = query.eq('pipeline_stage_id', filters.stage_id);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
      );
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data || []) as CRMLead[], count: count || 0 };
  }

  async getLead(leadId: string): Promise<CRMLeadDetail | null> {
    const { data, error } = await supabase
      .from('zoho_lead_submissions')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const [activities, tasks] = await Promise.all([
      supabase
        .from('lead_activities')
        .select('id, type, description, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('lead_tasks')
        .select('id, title, completed, due_date, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    return {
      ...(data as CRMLead),
      notes: data.notes || null,
      metadata: data.metadata || null,
      activities: (activities.data || []) as CRMActivity[],
      tasks: (tasks.data || []) as CRMTask[],
    };
  }

  async getPipelineStages(): Promise<{ id: string; name: string; color: string; display_order: number }[]> {
    const { data, error } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, color, display_order')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateLeadStage(leadId: string, stageId: string): Promise<void> {
    const { error } = await supabase
      .from('zoho_lead_submissions')
      .update({ pipeline_stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;
  }

  async getRevenueMetrics(): Promise<{
    total_invoiced: number;
    total_paid: number;
    outstanding: number;
    this_month: number;
  }> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [allInvoices, thisMonthInvoices] = await Promise.all([
      supabase.from('crm_invoices').select('total_amount, amount_paid, status'),
      supabase.from('crm_invoices').select('total_amount').gte('created_at', monthStart.toISOString()),
    ]);

    const invoices = allInvoices.data || [];
    const total_invoiced = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
    const total_paid = invoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
    const this_month = (thisMonthInvoices.data || []).reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

    return {
      total_invoiced: Math.round(total_invoiced * 100) / 100,
      total_paid: Math.round(total_paid * 100) / 100,
      outstanding: Math.round((total_invoiced - total_paid) * 100) / 100,
      this_month: Math.round(this_month * 100) / 100,
    };
  }
}

export const crmBridgeService = new CRMBridgeService();
