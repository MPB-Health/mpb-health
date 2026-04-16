import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SavedReport,
  SavedReportCreateInput,
  SavedReportUpdateInput,
  ReportType,
} from './types';

export class SavedReportsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List saved reports for the current user's organization
   */
  async list(filters?: {
    report_type?: ReportType;
    is_shared?: boolean;
    search?: string;
  }): Promise<SavedReport[]> {
    try {
      let query = this.supabase
        .from('saved_reports')
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }
      if (filters?.is_shared !== undefined) {
        query = query.eq('is_shared', filters.is_shared);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any;
    } catch (err) {
      console.error('SavedReportsService.list error:', err);
      return [];
    }
  }

  /**
   * Get a single saved report by ID
   */
  async get(id: string): Promise<SavedReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('saved_reports')
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any;
    } catch (err) {
      console.error('SavedReportsService.get error:', err);
      return null;
    }
  }

  /**
   * Create a new saved report
   */
  async create(input: SavedReportCreateInput, orgId: string): Promise<SavedReport | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await this.supabase
        .from('saved_reports')
        .insert({
          org_id: orgId,
          name: input.name,
          description: input.description,
          report_type: input.report_type,
          filters: input.filters || {},
          columns: input.columns || [],
          sort_config: input.sort_config || null,
          chart_config: input.chart_config || {},
          is_default: input.is_default || false,
          is_shared: input.is_shared || false,
          schedule_config: input.schedule_config,
          created_by: user.id,
        })
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .single();

      if (error) throw error;

      // Log to audit
      await this.logAudit('report.create', 'saved_report', data.id, null, data);

      return data as any;
    } catch (err) {
      console.error('SavedReportsService.create error:', err);
      return null;
    }
  }

  /**
   * Update a saved report
   */
  async update(id: string, input: SavedReportUpdateInput): Promise<SavedReport | null> {
    try {
      // Get before state for audit
      const before = await this.get(id);

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.report_type !== undefined) updateData.report_type = input.report_type;
      if (input.filters !== undefined) updateData.filters = input.filters;
      if (input.columns !== undefined) updateData.columns = input.columns;
      if (input.sort_config !== undefined) updateData.sort_config = input.sort_config;
      if (input.chart_config !== undefined) updateData.chart_config = input.chart_config;
      if (input.is_default !== undefined) updateData.is_default = input.is_default;
      if (input.is_shared !== undefined) updateData.is_shared = input.is_shared;
      if (input.schedule_config !== undefined) updateData.schedule_config = input.schedule_config;

      const { data, error } = await this.supabase
        .from('saved_reports')
        .update(updateData)
        .eq('id', id)
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .single();

      if (error) throw error;

      // Log to audit
      await this.logAudit('report.update', 'saved_report', id, before, data);

      return data as any;
    } catch (err) {
      console.error('SavedReportsService.update error:', err);
      return null;
    }
  }

  /**
   * Delete a saved report
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Get before state for audit
      const before = await this.get(id);

      const { error } = await this.supabase
        .from('saved_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log to audit
      await this.logAudit('report.delete', 'saved_report', id, before, null);

      return true;
    } catch (err) {
      console.error('SavedReportsService.delete error:', err);
      return false;
    }
  }

  /**
   * Duplicate a saved report
   */
  async duplicate(id: string, newName?: string): Promise<SavedReport | null> {
    try {
      const original = await this.get(id);
      if (!original) return null;

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await this.supabase
        .from('saved_reports')
        .insert({
          org_id: original.org_id,
          name: newName || `${original.name} (Copy)`,
          description: original.description,
          report_type: original.report_type,
          filters: original.filters,
          columns: original.columns,
          sort_config: original.sort_config,
          chart_config: original.chart_config,
          is_default: false, // Never copy default status
          is_shared: false, // Start as unknown as private
          schedule_config: null, // Don't copy schedule
          created_by: user.id,
        })
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .single();

      if (error) throw error;

      await this.logAudit('report.duplicate', 'saved_report', data.id, { original_id: id }, data);

      return data as any;
    } catch (err) {
      console.error('SavedReportsService.duplicate error:', err);
      return null;
    }
  }

  /**
   * Set a report as unknown as the default for its type
   */
  async setDefault(id: string, orgId: string): Promise<boolean> {
    try {
      const report = await this.get(id);
      if (!report) return false;

      // Unset current default for this type
      await this.supabase
        .from('saved_reports')
        .update({ is_default: false })
        .eq('org_id', orgId)
        .eq('report_type', report.report_type)
        .eq('is_default', true);

      // Set new default
      const { error } = await this.supabase
        .from('saved_reports')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await this.logAudit('report.set_default', 'saved_report', id, null, { is_default: true });

      return true;
    } catch (err) {
      console.error('SavedReportsService.setDefault error:', err);
      return false;
    }
  }

  /**
   * Get the default report for a type
   */
  async getDefault(reportType: ReportType, orgId: string): Promise<SavedReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('saved_reports')
        .select('id, org_id, name, description, report_type, filters, columns, sort_config, chart_config, is_default, is_shared, schedule_config, created_by, created_at, updated_at')
        .eq('org_id', orgId)
        .eq('report_type', reportType)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    } catch (err) {
      console.error('SavedReportsService.getDefault error:', err);
      return null;
    }
  }

  private async logAudit(
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown
  ): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      await this.supabase.from('audit_logs').insert({
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: before,
        after_json: after,
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
}

export function createSavedReportsService(supabase: SupabaseClient): SavedReportsService {
  return new SavedReportsService(supabase);
}
