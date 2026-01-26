import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Lead,
  LeadFilters,
  LeadCreateInput,
  LeadUpdateInput,
  BulkUpdateResult,
} from './leadTypes';

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
        .from('zoho_lead_submissions')
        .select('*', { count: 'exact' });

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
      if (filters.zohoSyncStatus) {
        query = query.eq('zoho_sync_status', filters.zohoSyncStatus);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get leads:', error);
        return { leads: [], total: 0 };
      }

      return { leads: data as Lead[], total: count || 0 };
    } catch (error) {
      console.error('Get leads error:', error);
      return { leads: [], total: 0 };
    }
  }

  /**
   * Get leads grouped by pipeline stage
   */
  async getLeadsByStage(): Promise<Record<string, Lead[]>> {
    try {
      const { data, error } = await this.supabase
        .from('zoho_lead_submissions')
        .select('*')
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

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.supabase
        .from('zoho_lead_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get lead:', error);
        return null;
      }

      return data as Lead;
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
        .from('zoho_lead_submissions')
        .insert({
          ...input,
          pipeline_stage: 'new',
          priority: 'medium',
          lead_score: 0,
          zoho_sync_status: 'pending',
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
        .from('zoho_lead_submissions')
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
   * Bulk update multiple leads
   */
  async bulkUpdateLeads(
    leadIds: string[],
    updates: LeadUpdateInput
  ): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = { success: 0, failed: 0, errors: [] };

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

  /**
   * Add tags to a lead
   */
  async addTagsToLead(
    leadId: string,
    tags: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentLead } = await this.supabase
        .from('zoho_lead_submissions')
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
        .from('zoho_lead_submissions')
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
   * Delete a lead
   */
  async deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('zoho_lead_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete lead error:', error);
      return { success: false, error: 'Failed to delete lead' };
    }
  }

  /**
   * Get leads for CSV export
   */
  async getLeadsForExport(
    leadIds?: string[],
    filters?: LeadFilters
  ): Promise<Lead[]> {
    try {
      let query = this.supabase.from('zoho_lead_submissions').select('*');

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

      return data as Lead[];
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
}

// Factory function to create lead service instance
export function createLeadService(supabase: SupabaseClient): LeadService {
  return new LeadService(supabase);
}
