// ============================================================================
// Report Service — Saved reports, schedules, and dashboard widgets
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  SavedReport,
  CreateReportInput,
  ReportSchedule,
  CreateScheduleInput,
  ReportRun,
  DashboardWidget,
  CreateWidgetInput,
  UpdateWidgetInput,
  ReportType,
} from './types';

// Pre-built report templates
export const REPORT_TEMPLATES = [
  {
    id: 'performance_overview',
    name: 'Performance Overview',
    description: 'Key performance metrics and trends',
    type: 'performance' as ReportType,
    config: {
      metrics: ['leads_new', 'leads_converted', 'conversion_rate', 'messages_sent', 'tasks_completed'],
      filters: {},
      groupBy: [],
      dateRange: { type: 'preset' as const, preset: 'last_30_days' as const },
      chartType: 'line' as const,
    },
  },
  {
    id: 'lead_pipeline',
    name: 'Lead Pipeline Report',
    description: 'Lead status breakdown and conversion funnel',
    type: 'leads' as ReportType,
    config: {
      metrics: ['leads_total', 'leads_new', 'leads_converted', 'leads_lost', 'conversion_rate'],
      filters: {},
      groupBy: ['status'],
      dateRange: { type: 'preset' as const, preset: 'this_month' as const },
      chartType: 'bar' as const,
    },
  },
  {
    id: 'compliance_summary',
    name: 'Compliance Summary',
    description: 'Compliance scores and acknowledgments',
    type: 'compliance' as ReportType,
    config: {
      metrics: ['compliance_score'],
      filters: {},
      groupBy: ['user'],
      dateRange: { type: 'preset' as const, preset: 'this_month' as const },
      chartType: 'bar' as const,
    },
  },
  {
    id: 'activity_log',
    name: 'Activity Report',
    description: 'Messages, calls, and tasks activity',
    type: 'activity' as ReportType,
    config: {
      metrics: ['messages_sent', 'messages_received', 'calls_made', 'meetings_held', 'tasks_completed'],
      filters: {},
      groupBy: ['day'],
      dateRange: { type: 'preset' as const, preset: 'last_7_days' as const },
      chartType: 'area' as const,
    },
  },
  {
    id: 'team_comparison',
    name: 'Team Comparison',
    description: 'Compare performance across team members',
    type: 'performance' as ReportType,
    config: {
      metrics: ['leads_converted', 'messages_sent', 'compliance_score'],
      filters: {},
      groupBy: ['user'],
      dateRange: { type: 'preset' as const, preset: 'this_month' as const },
      chartType: 'bar' as const,
      compareWith: 'previous_period' as const,
    },
  },
];

export class ReportService {
  // =========================================================================
  // SAVED REPORTS
  // =========================================================================

  /**
   * Get all reports for organization
   */
  async getReports(orgId: string, userId?: string): Promise<SavedReport[]> {
    let query = supabase
      .from('saved_reports')
      .select('*')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false });

    // Filter to public reports or user's own reports
    if (userId) {
      query = query.or(`created_by.eq.${userId},is_public.eq.true`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ReportService] Failed to get reports:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single report
   */
  async getReport(reportId: string): Promise<SavedReport | null> {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ReportService] Failed to get report:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a saved report
   */
  async createReport(
    orgId: string,
    createdBy: string,
    input: CreateReportInput
  ): Promise<SavedReport> {
    const { data, error } = await supabase
      .from('saved_reports')
      .insert({
        org_id: orgId,
        created_by: createdBy,
        name: input.name,
        description: input.description,
        report_type: input.report_type,
        config: input.config,
        is_public: input.is_public ?? false,
        shared_with: input.shared_with ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to create report:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a saved report
   */
  async updateReport(
    reportId: string,
    input: Partial<CreateReportInput>
  ): Promise<SavedReport> {
    const { data, error } = await supabase
      .from('saved_reports')
      .update(input)
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to update report:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a saved report
   */
  async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('[ReportService] Failed to delete report:', error);
      throw error;
    }
  }

  /**
   * Get report templates
   */
  getReportTemplates() {
    return REPORT_TEMPLATES;
  }

  // =========================================================================
  // REPORT SCHEDULES
  // =========================================================================

  /**
   * Get schedules for a report
   */
  async getSchedules(reportId: string): Promise<ReportSchedule[]> {
    const { data, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ReportService] Failed to get schedules:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a report schedule
   */
  async createSchedule(
    orgId: string,
    createdBy: string,
    input: CreateScheduleInput
  ): Promise<ReportSchedule> {
    const { data, error } = await supabase
      .from('report_schedules')
      .insert({
        org_id: orgId,
        report_id: input.report_id,
        frequency: input.frequency,
        day_of_week: input.day_of_week,
        day_of_month: input.day_of_month,
        time_of_day: input.time_of_day || '09:00',
        timezone: input.timezone || 'America/New_York',
        delivery_method: input.delivery_method || 'email',
        recipients: input.recipients,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to create schedule:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    input: Partial<CreateScheduleInput> & { is_active?: boolean }
  ): Promise<ReportSchedule> {
    const { data, error } = await supabase
      .from('report_schedules')
      .update(input)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to update schedule:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('[ReportService] Failed to delete schedule:', error);
      throw error;
    }
  }

  // =========================================================================
  // REPORT RUNS
  // =========================================================================

  /**
   * Get recent report runs
   */
  async getReportRuns(
    orgId: string,
    reportId?: string,
    limit: number = 20
  ): Promise<ReportRun[]> {
    let query = supabase
      .from('report_runs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reportId) {
      query = query.eq('report_id', reportId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ReportService] Failed to get report runs:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a report run (trigger report generation)
   */
  async runReport(
    orgId: string,
    reportId: string,
    triggeredBy: string,
    dateRangeStart?: string,
    dateRangeEnd?: string,
    exportFormat?: 'json' | 'csv' | 'pdf'
  ): Promise<ReportRun> {
    // Get the report config
    const report = await this.getReport(reportId);
    if (!report) throw new Error('Report not found');

    // Create run record
    const { data, error } = await supabase
      .from('report_runs')
      .insert({
        org_id: orgId,
        report_id: reportId,
        status: 'generating',
        parameters: report.config,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        export_format: exportFormat,
        triggered_by: triggeredBy,
      })
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to create report run:', error);
      throw error;
    }

    // Update run count on report
    await supabase
      .from('saved_reports')
      .update({
        run_count: report.run_count + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    // In a real implementation, this would trigger async report generation
    // For now, we'll mark it as ready immediately
    await this.completeReportRun(data.id, {}, 0);

    return data;
  }

  /**
   * Complete a report run
   */
  async completeReportRun(
    runId: string,
    resultData: unknown,
    rowCount: number,
    exportUrl?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('report_runs')
      .update({
        status: 'ready',
        completed_at: new Date().toISOString(),
        result_data: resultData,
        row_count: rowCount,
        export_url: exportUrl,
        export_expires_at: exportUrl
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .eq('id', runId);

    if (error) {
      console.error('[ReportService] Failed to complete report run:', error);
    }
  }

  // =========================================================================
  // DASHBOARD WIDGETS
  // =========================================================================

  /**
   * Get widgets for user or organization
   */
  async getWidgets(orgId: string, userId?: string): Promise<DashboardWidget[]> {
    let query = supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_visible', true)
      .order('position_y')
      .order('position_x');

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ReportService] Failed to get widgets:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a dashboard widget
   */
  async createWidget(
    orgId: string,
    userId: string,
    input: CreateWidgetInput
  ): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        org_id: orgId,
        user_id: userId,
        name: input.name,
        widget_type: input.widget_type,
        config: input.config,
        position_x: input.position_x ?? 0,
        position_y: input.position_y ?? 0,
        width: input.width ?? 1,
        height: input.height ?? 1,
      })
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to create widget:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a widget
   */
  async updateWidget(widgetId: string, input: UpdateWidgetInput): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update(input)
      .eq('id', widgetId)
      .select()
      .single();

    if (error) {
      console.error('[ReportService] Failed to update widget:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a widget
   */
  async deleteWidget(widgetId: string): Promise<void> {
    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', widgetId);

    if (error) {
      console.error('[ReportService] Failed to delete widget:', error);
      throw error;
    }
  }

  /**
   * Update widget positions (for drag & drop)
   */
  async updateWidgetPositions(
    updates: { id: string; position_x: number; position_y: number }[]
  ): Promise<void> {
    for (const update of updates) {
      await supabase
        .from('dashboard_widgets')
        .update({ position_x: update.position_x, position_y: update.position_y })
        .eq('id', update.id);
    }
  }
}

export const reportService = new ReportService();
