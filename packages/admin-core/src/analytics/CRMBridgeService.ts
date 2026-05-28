import { supabase } from '@mpbhealth/database';
import type {
  Lead as CRMCoreLead,
  PipelineStage,
  Contact,
} from '@mpbhealth/crm-core';

// Re-export canonical types from crm-core for consumers that only depend on admin-core
export type { PipelineStage, Contact as CRMCoreContact } from '@mpbhealth/crm-core';

export interface CRMSummary {
  total_leads: number;
  new_today: number;
  leads_by_stage: { stage: string; count: number; color: string }[];
  conversion_rate: number;
  pending_tasks: number;
}

/**
 * Admin projection of a CRM lead row from `lead_submissions`.
 * For the canonical CRM Lead type with domain fields (plan_type, carrier_id, etc.),
 * import `Lead` from `@mpbhealth/crm-core`.
 */
export interface CRMLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  lead_source: string | null;
  pipeline_stage: string | null;
  stage_name?: string;
  plan_type?: string | null;
  assigned_to: string | null;
  tags?: string[] | null;
  lead_score?: number | null;
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
  title: string | null;
  description: string | null;
  created_at: string;
}

export interface CRMTask {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: string | null;
  created_at: string;
}

export interface CRMLeadFilters {
  status?: string;
  stage_id?: string;
  search?: string;
  assigned_to?: string;
  plan_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * @deprecated Use `Contact` from `@mpbhealth/crm-core` for the canonical CRM contact type.
 * This bridge-specific alias is kept for backward compatibility.
 */
export interface CRMContact {
  id: string;
  org_id: string;
  account_id: string | null;
  salutation: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  department: string | null;
  lead_source: string | null;
  converted_from_lead_id: string | null;
  converted_at: string | null;
  tags: string[];
  description: string | null;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConvertLeadInput {
  salutation?: string;
  title?: string;
  department?: string;
  mobile?: string;
  account_id?: string;
  tags?: string[];
  description?: string;
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
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true });
    return count || 0;
  }

  private async getNewLeadsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    return count || 0;
  }

  private async getLeadsByStage(): Promise<{ stage: string; count: number; color: string }[]> {
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, color')
      .order('sort_order', { ascending: true });

    if (!stages || stages.length === 0) return [];

    const results: { stage: string; count: number; color: string }[] = [];

    for (const stage of stages) {
      const { count } = await supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('pipeline_stage', stage.id);
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
      // Fallback: count leads with a converted_at timestamp
      const { count } = await supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .not('converted_at', 'is', null);
      return count || 0;
    }

    const { count } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_stage', stages[0].id);
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
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, lead_source, pipeline_stage, plan_type, assigned_to, tags, lead_score, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('pipeline_stage', filters.status);
    }
    if (filters?.stage_id) {
      query = query.eq('pipeline_stage', filters.stage_id);
    }
    if (filters?.plan_type) {
      query = query.eq('plan_type', filters.plan_type);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
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
    return { data: (data || []) as unknown as CRMLead[], count: count || 0 };
  }

  async getLead(leadId: string): Promise<CRMLeadDetail | null> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, lead_source, pipeline_stage, plan_type, assigned_to, tags, lead_score, primary_concern, zip_code, city, state, created_at, updated_at')
      .eq('id', leadId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const [activities, tasks] = await Promise.all([
      supabase
        .from('lead_activities')
        .select('id, activity_type, title, description, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('lead_tasks')
        .select('id, title, completed, due_date, priority, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const raw = data as Record<string, unknown>;
    return {
      ...(data as unknown as CRMLead),
      notes: (raw.notes as string) ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? null,
      activities: (activities.data || []) as unknown as CRMActivity[],
      tasks: (tasks.data || []) as unknown as CRMTask[],
    };
  }

  async getPipelineStages(): Promise<{ id: string; name: string; color: string; sort_order: number }[]> {
    const { data, error } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, color, sort_order')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  }

  async updateLeadStage(leadId: string, stageId: string): Promise<void> {
    const { error } = await supabase
      .from('lead_submissions')
      .update({ pipeline_stage: stageId, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;
  }

  // ── Lead-to-Contact conversion ─────────────────────────────────────────────

  async isLeadConverted(leadId: string): Promise<{ converted: boolean; contactId?: string }> {
    const { data } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('converted_from_lead_id', leadId)
      .limit(1);

    if (data && data.length > 0) {
      return { converted: true, contactId: data[0].id };
    }
    return { converted: false };
  }

  async convertLeadToContact(
    leadId: string,
    extras?: ConvertLeadInput,
  ): Promise<CRMContact> {
    // 1. Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, lead_source, pipeline_stage, plan_type, assigned_to, tags, lead_score, primary_concern, zip_code, city, state, utm_source, created_at, updated_at')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) throw new Error('Lead not found');

    // 2. Check not already converted
    const { converted } = await this.isLeadConverted(leadId);
    if (converted) throw new Error('Lead has already been converted to a contact');

    // 3. Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // 4. Default org (MPB Health)
    const ORG_ID = '00000000-0000-4000-a000-000000000001';

    // 5. Create the contact
    const now = new Date().toISOString();
    const { data: contact, error: insertError } = await supabase
      .from('crm_contacts')
      .insert({
        org_id: ORG_ID,
        first_name: lead.first_name || 'Unknown',
        last_name: lead.last_name || 'Unknown',
        email: lead.email || null,
        phone: lead.phone || null,
        mobile: extras?.mobile || null,
        salutation: extras?.salutation || null,
        title: extras?.title || null,
        department: extras?.department || null,
        lead_source: lead.lead_source || lead.utm_source || null,
        converted_from_lead_id: leadId,
        converted_at: now,
        account_id: extras?.account_id || null,
        tags: extras?.tags || [],
        description: extras?.description || null,
        owner_id: lead.assigned_to || authUser.id,
        created_by: authUser.id,
      })
      .select('id, org_id, account_id, salutation, first_name, last_name, email, phone, mobile, title, department, lead_source, converted_from_lead_id, converted_at, tags, description, owner_id, created_by, created_at, updated_at')
      .single();

    if (insertError) throw insertError;

    // 6. Update the lead status to converted + move to won stage
    const { data: wonStage } = await supabase
      .from('crm_pipeline_stages')
      .select('id')
      .eq('is_won_stage', true)
      .limit(1);

    const leadUpdate: Record<string, unknown> = {
      pipeline_stage: 'closed_won',
      converted_at: now,
      updated_at: now,
    };
    if (wonStage && wonStage.length > 0) {
      leadUpdate.pipeline_stage = wonStage[0].id;
    }

    await supabase
      .from('lead_submissions')
      .update(leadUpdate)
      .eq('id', leadId);

    // 7. Log the conversion activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      activity_type: 'status_change',
      description: `Lead converted to contact (${contact.id})`,
      created_by: authUser.id,
    });

    return contact as CRMContact;
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
