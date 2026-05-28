import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Lead,
  LeadFilters,
  LeadCreateInput,
  LeadUpdateInput,
  BulkUpdateResult,
} from './leadTypes';
import { sanitizeSearchInput } from '../utils/sanitize';

/** Columns for list/detail fetches (PostgREST select) */
export const LEAD_ROW_SELECT = `
  id, org_id, first_name, last_name, email, phone, household_size, zip_code, city, state, contact_preference, primary_concern, source_page, source_cta, created_at, updated_at,
  pipeline_stage, priority, plan_type, assigned_to, lead_score, tags, lead_source, next_followup_at, last_contacted_at, last_touched_at, last_activity_at, stage_changed_at,
  workflow_subsection, linkedin_workflow_status, do_not_contact,
  opt_out_reason, opt_out_phrase, opt_out_detected_at,
  carrier:insurance_carriers!lead_submissions_carrier_id_fkey(id, name, carrier_type)
`;

export class LeadService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get leads with optional filters and pagination
   */
  async getLeads(
    filters: LeadFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ leads: Lead[]; total: number }> {
    try {
      let query = this.supabase
        .from('lead_submissions')
        .select(LEAD_ROW_SELECT, { count: 'exact' });

      if (filters.stage) {
        query = query.eq('pipeline_stage', filters.stage);
      }
      if (filters.workflowSubsection) {
        query = query.eq('workflow_subsection', filters.workflowSubsection);
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
        const safe = sanitizeSearchInput(filters.search);
        query = query.or(
          `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.planType) {
        query = query.eq('plan_type', filters.planType);
      }
      if (filters.carrierId) {
        query = query.eq('carrier_id', filters.carrierId);
      }
      if (filters.tobaccoStatus) {
        query = query.eq('tobacco_status', filters.tobaccoStatus);
      }
      if (filters.groupType) {
        query = query.eq('group_type', filters.groupType);
      }
      if (filters.state) {
        query = query.eq('state', filters.state);
      }

      // Default sort = last_activity_at DESC (generated COALESCE(last_touched_at, created_at)).
      // Surfaces brand-new leads (no rep-initiated touch yet) at the top by their created_at,
      // while still ordering worked leads by their most recent rep activity. See migration
      // 20260620590000_crm_lead_last_activity_default_sort.sql.
      const { data, error, count } = await query
        .order(filters.sortBy || 'last_activity_at', {
          ascending: filters.sortDir === 'asc',
          nullsFirst: false,
        })
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

  /**
   * Get leads grouped by pipeline stage with pagination
   */
  async getLeadsByStage(
    limit: number = 100,
    offset: number = 0
  ): Promise<{ grouped: Record<string, Lead[]>; total: number }> {
    try {
      const { data, error, count } = await this.supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, pipeline_stage, priority, plan_type, assigned_to, created_at, tags', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get leads by stage:', error);
        return { grouped: {}, total: 0 };
      }

      const grouped: Record<string, Lead[]> = {};
      for (const lead of data || []) {
        const stage = lead.pipeline_stage || 'new';
        if (!grouped[stage]) {
          grouped[stage] = [];
        }
        grouped[stage].push(lead as unknown as Lead);
      }

      return { grouped, total: count || 0 };
    } catch (error) {
      console.error('Get leads by stage error:', error);
      return { grouped: {}, total: 0 };
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .select(LEAD_ROW_SELECT)
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

  /**
   * Create a new lead
   */
  async createLead(
    input: LeadCreateInput
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .insert({
          org_id: input.org_id,
          ...input,
          pipeline_stage: 'new',
          priority: 'medium',
          lead_score: 0,
          tags: input.tags || [],
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, leadId: data?.id };
    } catch (error) {
      console.error('Create lead error:', error);
      return { success: false, error: 'Failed to create lead' };
    }
  }

  /**
   * Update a lead
   */
  async updateLead(
    id: string,
    updates: LeadUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('lead_submissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update lead error:', error);
      return { success: false, error: 'Failed to update lead' };
    }
  }

  /**
   * Update lead's pipeline stage
   */
  async updateLeadStage(
    id: string,
    stage: string,
    lostReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const updates: LeadUpdateInput = { pipeline_stage: stage };
    if (lostReason) {
      updates.lost_reason = lostReason;
    }
    return this.updateLead(id, updates);
  }

  /**
   * Assign a lead to a user
   */
  async assignLead(
    leadId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateLead(leadId, { assigned_to: userId });
  }

  /**
   * Bulk update multiple leads via the `crm_bulk_update_leads` RPC.
   * Falls back to per-row iteration if the RPC is unavailable.
   */
  async bulkUpdateLeads(
    leadIds: string[],
    updates: LeadUpdateInput
  ): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = { success: 0, failed: 0, errors: [] };
    if (leadIds.length === 0) return result;

    try {
      const { data, error } = await this.supabase.rpc('crm_bulk_update_leads', {
        p_lead_ids: leadIds,
        p_updates: updates as unknown as Record<string, unknown>,
      });

      if (error) throw error;

      const rpcResult = data as { updated: number; total: number; error?: string };
      result.success = rpcResult.updated ?? 0;
      result.failed = (rpcResult.total ?? leadIds.length) - result.success;
      if (rpcResult.error) result.errors.push(rpcResult.error);
      return result;
    } catch {
      // Fallback: iterate per-row (works before migration is applied).
      for (const id of leadIds) {
        const updateResult = await this.updateLead(id, updates);
        if (updateResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push(`Lead ${id}: ${updateResult.error}`);
        }
      }
      return result;
    }
  }

  /**
   * Add tags to a lead
   */
  async addTagsToLead(
    leadId: string,
    tags: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await this.supabase
        .from('lead_submissions')
        .select('tags')
        .eq('id', leadId)
        .single();

      const existingTags = currentLead?.tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];

      return this.updateLead(leadId, { tags: newTags });
    } catch (error) {
      console.error('Add tags error:', error);
      return { success: false, error: 'Failed to add tags' };
    }
  }

  /**
   * Remove a tag from a lead
   */
  async removeTagFromLead(
    leadId: string,
    tag: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await this.supabase
        .from('lead_submissions')
        .select('tags')
        .eq('id', leadId)
        .single();

      const existingTags = currentLead?.tags || [];
      const newTags = existingTags.filter((t: string) => t !== tag);

      return this.updateLead(leadId, { tags: newTags });
    } catch (error) {
      console.error('Remove tag error:', error);
      return { success: false, error: 'Failed to remove tag' };
    }
  }

  /**
   * CRM rebuild Section 6 — manual "Mark as Lost" button on Lead Profile.
   * Wraps the `crm_mark_lead_lost` RPC which sets stage=lost, subsection=
   * do_not_contact, do_not_contact=true, logs an activity row, and bumps
   * last_touched_at — all in one transaction.
   */
  async markLeadLost(
    leadId: string,
    reason: string = 'rep_marked_lost'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.rpc('crm_mark_lead_lost', {
        p_lead_id: leadId,
        p_reason: reason,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('markLeadLost error:', err);
      return { success: false, error: 'Failed to mark lead as lost' };
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Permission denied – you may not have delete access' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete lead error:', error);
      return { success: false, error: 'Failed to delete lead' };
    }
  }

  /**
   * Bulk delete leads by IDs — single batch query with row-count verification
   */
  async bulkDeleteLeads(ids: string[]): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = { success: 0, failed: 0, errors: [] };
    if (ids.length === 0) return result;

    try {
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .delete()
        .in('id', ids)
        .select('id');

      if (error) {
        result.failed = ids.length;
        result.errors.push(error.message);
        return result;
      }

      const deletedIds = new Set((data ?? []).map((r: { id: string }) => r.id));
      result.success = deletedIds.size;
      result.failed = ids.length - deletedIds.size;

      if (result.failed > 0) {
        const blocked = ids.filter(id => !deletedIds.has(id));
        result.errors.push(
          `${result.failed} lead(s) could not be deleted — check RLS / permissions (ids: ${blocked.slice(0, 5).join(', ')}${blocked.length > 5 ? '…' : ''})`
        );
      }
    } catch (err) {
      console.error('Bulk delete leads error:', err);
      result.failed = ids.length;
      result.errors.push('Unexpected error during bulk delete');
    }

    return result;
  }

  /**
   * Get leads for CSV export
   */
  async getLeadsForExport(
    leadIds?: string[],
    filters?: LeadFilters
  ): Promise<Lead[]> {
    try {
      let query = this.supabase.from('lead_submissions').select('id, org_id, first_name, last_name, email, phone, lead_source, pipeline_stage, priority, plan_type, assigned_to, lead_score, tags, primary_concern, zip_code, city, state, next_followup_at, created_at, updated_at');

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

  /**
   * Generate CSV from leads
   */
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
        const value = lead[col as unknown as keyof Lead];
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
}

// Factory function to create lead service instance
export function createLeadService(supabase: SupabaseClient): LeadService {
  return new LeadService(supabase);
}
