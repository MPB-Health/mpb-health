import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  RecruitingRecord,
  RecruitingPipelineStage,
  RecruitingFilters,
  RecruitingCreateInput,
  RecruitingUpdateInput,
  BulkResult,
} from './recruitingTypes';

const RECRUITING_ROW_SELECT = `
  id, org_id, first_name, last_name, email, phone,
  license_number, npn, appointed_carriers, agency_affiliation,
  state, city, pipeline_stage, workflow_subsection,
  linkedin_workflow_status, do_not_contact, priority,
  assigned_to, tags, notes,
  last_contacted_at, last_touched_at, stage_changed_at,
  created_by, created_at, updated_at
`;

export class RecruitingService {
  constructor(private supabase: SupabaseClient) {}

  async getRecords(
    orgId: string,
    filters: RecruitingFilters = {},
    limit = 50,
    offset = 0,
  ): Promise<{ records: RecruitingRecord[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_recruiting_records')
        .select(RECRUITING_ROW_SELECT, { count: 'exact' })
        .eq('org_id', orgId);

      if (filters.stage) {
        query = query.eq('pipeline_stage', filters.stage);
      }
      if (filters.workflowSubsection) {
        query = query.eq('workflow_subsection', filters.workflowSubsection);
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
        const s = filters.search.replace(/[%_]/g, '');
        query = query.or(
          `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,npn.ilike.%${s}%,license_number.ilike.%${s}%,agency_affiliation.ilike.%${s}%`,
        );
      }

      const sortCol = filters.sortBy || 'last_touched_at';
      const { data, error, count } = await query
        .order(sortCol, {
          ascending: filters.sortDir === 'asc',
          nullsFirst: false,
        })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('RecruitingService.getRecords:', error);
        return { records: [], total: 0 };
      }
      return { records: (data ?? []) as unknown as RecruitingRecord[], total: count || 0 };
    } catch (err) {
      console.error('RecruitingService.getRecords error:', err);
      return { records: [], total: 0 };
    }
  }

  async getRecord(id: string): Promise<RecruitingRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_recruiting_records')
        .select(RECRUITING_ROW_SELECT)
        .eq('id', id)
        .single();
      if (error) {
        console.error('RecruitingService.getRecord:', error);
        return null;
      }
      return data as unknown as RecruitingRecord;
    } catch (err) {
      console.error('RecruitingService.getRecord error:', err);
      return null;
    }
  }

  async createRecord(
    input: RecruitingCreateInput,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_recruiting_records')
        .insert({
          org_id: input.org_id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          license_number: input.license_number ?? null,
          npn: input.npn ?? null,
          appointed_carriers: input.appointed_carriers ?? [],
          agency_affiliation: input.agency_affiliation ?? null,
          state: input.state ?? null,
          city: input.city ?? null,
          pipeline_stage: input.pipeline_stage ?? 'prospect',
          workflow_subsection: input.workflow_subsection ?? 'working',
          assigned_to: input.assigned_to ?? null,
          tags: input.tags ?? [],
          notes: input.notes ?? null,
          created_by: input.created_by ?? null,
          stage_changed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data?.id };
    } catch (err) {
      console.error('RecruitingService.createRecord error:', err);
      return { success: false, error: 'Failed to create recruit' };
    }
  }

  async updateRecord(
    id: string,
    updates: RecruitingUpdateInput,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_recruiting_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('RecruitingService.updateRecord error:', err);
      return { success: false, error: 'Failed to update recruit' };
    }
  }

  async updateStage(
    id: string,
    stage: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateRecord(id, {
      pipeline_stage: stage,
    });
  }

  async assignRecord(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateRecord(id, { assigned_to: userId });
  }

  async markInactive(
    id: string,
    reason?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const record = await this.getRecord(id);
      if (!record) return { success: false, error: 'Record not found' };

      const noteAppend = reason
        ? `${record.notes ? record.notes + '\n' : ''}[Marked inactive] ${reason}`
        : record.notes;

      return this.updateRecord(id, {
        pipeline_stage: 'inactive',
        workflow_subsection: 'do_not_contact',
        do_not_contact: true,
        last_touched_at: new Date().toISOString(),
        notes: noteAppend,
      });
    } catch (err) {
      console.error('RecruitingService.markInactive error:', err);
      return { success: false, error: 'Failed to mark inactive' };
    }
  }

  async deleteRecord(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_recruiting_records')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('RecruitingService.deleteRecord error:', err);
      return { success: false, error: 'Failed to delete recruit' };
    }
  }

  async bulkAssign(ids: string[], userId: string): Promise<BulkResult> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const result = await this.assignRecord(id, userId);
      if (result.success) success++;
      else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    }
    return { success, failed, errors };
  }

  async bulkUpdateStage(ids: string[], stage: string): Promise<BulkResult> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const result = await this.updateStage(id, stage);
      if (result.success) success++;
      else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    }
    return { success, failed, errors };
  }

  async bulkMarkInactive(ids: string[], reason?: string): Promise<BulkResult> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const result = await this.markInactive(id, reason);
      if (result.success) success++;
      else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    }
    return { success, failed, errors };
  }

  async getPipelineStages(orgId: string): Promise<RecruitingPipelineStage[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_recruiting_pipeline_stages')
        .select('*')
        .eq('org_id', orgId)
        .order('sort_order');
      if (error) {
        console.error('RecruitingService.getPipelineStages:', error);
        return [];
      }
      return (data ?? []) as RecruitingPipelineStage[];
    } catch (err) {
      console.error('RecruitingService.getPipelineStages error:', err);
      return [];
    }
  }
}

export function createRecruitingService(supabase: SupabaseClient): RecruitingService {
  return new RecruitingService(supabase);
}
