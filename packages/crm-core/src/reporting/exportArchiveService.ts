import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReportExport,
  ReportExportCreateInput,
  ExportFormat,
  ExportStatus,
  ReportType,
} from './types';

export class ExportArchiveService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List export history
   */
  async list(filters?: {
    report_type?: ReportType;
    export_format?: ExportFormat;
    status?: ExportStatus;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<ReportExport[]> {
    try {
      let query = this.supabase
        .from('report_exports')
        .select('id, org_id, saved_report_id, report_name, report_type, export_format, file_path, file_size_bytes, row_count, filters_used, status, error_message, exported_by, exported_at, expires_at')
        .order('exported_at', { ascending: false });

      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }
      if (filters?.export_format) {
        query = query.eq('export_format', filters.export_format);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('exported_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('exported_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any;
    } catch (err) {
      console.error('ExportArchiveService.list error:', err);
      return [];
    }
  }

  /**
   * Get a single export by ID
   */
  async get(id: string): Promise<ReportExport | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_exports')
        .select('id, org_id, saved_report_id, report_name, report_type, export_format, file_path, file_size_bytes, row_count, filters_used, status, error_message, exported_by, exported_at, expires_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any;
    } catch (err) {
      console.error('ExportArchiveService.get error:', err);
      return null;
    }
  }

  /**
   * Create a new export record (typically when starting an export)
   */
  async create(input: ReportExportCreateInput, orgId: string): Promise<ReportExport | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await this.supabase
        .from('report_exports')
        .insert({
          org_id: orgId,
          saved_report_id: input.saved_report_id,
          report_name: input.report_name,
          report_type: input.report_type,
          export_format: input.export_format,
          filters_used: input.filters_used || {},
          status: 'pending',
          exported_by: user.id,
        })
        .select('id, org_id, saved_report_id, report_name, report_type, export_format, file_path, file_size_bytes, row_count, filters_used, status, error_message, exported_by, exported_at, expires_at')
        .single();

      if (error) throw error;

      // Log to audit
      await this.logAudit('export.create', 'report_export', data.id, null, data);

      return data as any;
    } catch (err) {
      console.error('ExportArchiveService.create error:', err);
      return null;
    }
  }

  /**
   * Update export status and metadata (e.g., when export completes)
   */
  async updateStatus(
    id: string,
    status: ExportStatus,
    metadata?: {
      file_path?: string;
      file_size_bytes?: number;
      row_count?: number;
      error_message?: string;
    }
  ): Promise<ReportExport | null> {
    try {
      const updateData: Record<string, unknown> = { status };
      if (metadata?.file_path) updateData.file_path = metadata.file_path;
      if (metadata?.file_size_bytes) updateData.file_size_bytes = metadata.file_size_bytes;
      if (metadata?.row_count !== undefined) updateData.row_count = metadata.row_count;
      if (metadata?.error_message) updateData.error_message = metadata.error_message;

      const { data, error } = await this.supabase
        .from('report_exports')
        .update(updateData)
        .eq('id', id)
        .select('id, org_id, saved_report_id, report_name, report_type, export_format, file_path, file_size_bytes, row_count, filters_used, status, error_message, exported_by, exported_at, expires_at')
        .single();

      if (error) throw error;

      await this.logAudit('export.status_change', 'report_export', id, null, { status, ...metadata });

      return data as any;
    } catch (err) {
      console.error('ExportArchiveService.updateStatus error:', err);
      return null;
    }
  }

  /**
   * Quick export: create record, generate data, update status in one flow
   */
  async quickExport(
    orgId: string,
    input: ReportExportCreateInput,
    data: Record<string, unknown>[],
    headers: string[]
  ): Promise<{ export: ReportExport | null; content: string }> {
    // Create export record
    const exportRecord = await this.create(input, orgId);
    if (!exportRecord) return { export: null, content: '' };

    try {
      // Generate CSV content
      const content = this.generateCSV(headers, data);
      const rowCount = data.length;
      const fileSizeBytes = new Blob([content]).size;

      // Update status to completed
      const updated = await this.updateStatus(exportRecord.id, 'completed', {
        row_count: rowCount,
        file_size_bytes: fileSizeBytes,
      });

      return { export: updated, content };
    } catch (err) {
      // Update status to failed
      await this.updateStatus(exportRecord.id, 'failed', {
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });
      return { export: exportRecord, content: '' };
    }
  }

  /**
   * Generate CSV content from data
   */
  generateCSV(headers: string[], rows: Record<string, unknown>[]): string {
    const headerLine = headers.join(',');
    const dataLines = rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val == null) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    );
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Delete old exports (cleanup)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('report_exports')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('ExportArchiveService.cleanupExpired error:', err);
      return 0;
    }
  }

  /**
   * Get export statistics
   */
  async getStats(orgId: string): Promise<{
    total_exports: number;
    exports_this_month: number;
    by_format: Record<ExportFormat, number>;
    by_type: Record<ReportType, number>;
  }> {
    try {
      const { data: exports, error } = await this.supabase
        .from('report_exports')
        .select('export_format, report_type, exported_at')
        .eq('org_id', orgId);

      if (error) throw error;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const stats = {
        total_exports: exports?.length || 0,
        exports_this_month: 0,
        by_format: { csv: 0, xlsx: 0, pdf: 0 } as Record<ExportFormat, number>,
        by_type: {} as Record<ReportType, number>,
      };

      for (const exp of exports || []) {
        if (exp.exported_at >= monthStart) {
          stats.exports_this_month++;
        }
        const format = exp.export_format as unknown as ExportFormat;
        stats.by_format[format] = (stats.by_format[format] || 0) + 1;
        const type = exp.report_type as unknown as ReportType;
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      }

      return stats;
    } catch (err) {
      console.error('ExportArchiveService.getStats error:', err);
      return {
        total_exports: 0,
        exports_this_month: 0,
        by_format: { csv: 0, xlsx: 0, pdf: 0 },
        by_type: { conversion_funnel: 0, lead_sources: 0, team_performance: 0, interaction: 0, custom: 0 },
      };
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

export function createExportArchiveService(supabase: SupabaseClient): ExportArchiveService {
  return new ExportArchiveService(supabase);
}
