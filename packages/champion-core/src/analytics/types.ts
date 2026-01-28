// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export type MetricType =
  | 'leads_total'
  | 'leads_new'
  | 'leads_converted'
  | 'leads_lost'
  | 'conversion_rate'
  | 'messages_sent'
  | 'messages_received'
  | 'response_time_avg'
  | 'response_time_median'
  | 'compliance_score'
  | 'tasks_completed'
  | 'tasks_overdue'
  | 'calls_made'
  | 'meetings_held'
  | 'revenue_potential'
  | 'revenue_closed';

export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReportStatus = 'draft' | 'generating' | 'ready' | 'failed' | 'archived';

export type ReportType = 'performance' | 'leads' | 'compliance' | 'activity' | 'custom';

export type WidgetType = 'kpi' | 'chart' | 'table' | 'leaderboard' | 'goal_progress';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut';

// ============================================================================
// Metric Snapshots
// ============================================================================

export interface MetricSnapshot {
  id: string;
  org_id: string;
  user_id: string | null;
  metric_type: MetricType;
  granularity: TimeGranularity;
  period_start: string;
  period_end: string;
  value: number;
  previous_value: number | null;
  change_percent: number | null;
  dimensions: Record<string, unknown>;
  created_at: string;
}

export interface MetricDataPoint {
  period_start: string;
  period_end: string;
  value: number;
  change_percent: number | null;
}

// ============================================================================
// Performance Goals
// ============================================================================

export interface PerformanceGoal {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  metric_type: MetricType;
  target_value: number;
  target_period: TimeGranularity;
  current_value: number;
  progress_percent: number;
  last_calculated_at: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  achieved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  metric_type: MetricType;
  target_value: number;
  target_period?: TimeGranularity;
  start_date: string;
  end_date?: string;
  user_id?: string;
}

// ============================================================================
// Saved Reports
// ============================================================================

export interface ReportConfig {
  metrics: MetricType[];
  filters: Record<string, unknown>;
  groupBy: string[];
  dateRange: {
    type: 'preset' | 'custom';
    preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';
    start?: string;
    end?: string;
  };
  chartType?: ChartType;
  compareWith?: 'previous_period' | 'previous_year';
}

export interface SavedReport {
  id: string;
  org_id: string;
  created_by: string;
  name: string;
  description: string | null;
  report_type: ReportType;
  config: ReportConfig;
  is_public: boolean;
  shared_with: string[];
  last_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  name: string;
  description?: string;
  report_type: ReportType;
  config: ReportConfig;
  is_public?: boolean;
  shared_with?: string[];
}

// ============================================================================
// Report Schedules
// ============================================================================

export interface ReportRecipient {
  type: 'email' | 'user_id';
  address?: string;
  id?: string;
}

export interface ReportSchedule {
  id: string;
  org_id: string;
  report_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  timezone: string;
  delivery_method: 'email' | 'slack' | 'webhook';
  recipients: ReportRecipient[];
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  report_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  time_of_day?: string;
  timezone?: string;
  delivery_method?: 'email' | 'slack' | 'webhook';
  recipients: ReportRecipient[];
}

// ============================================================================
// Report Runs
// ============================================================================

export interface ReportRun {
  id: string;
  org_id: string;
  report_id: string | null;
  schedule_id: string | null;
  status: ReportStatus;
  started_at: string;
  completed_at: string | null;
  parameters: Record<string, unknown>;
  date_range_start: string | null;
  date_range_end: string | null;
  result_data: unknown;
  row_count: number | null;
  export_format: 'json' | 'csv' | 'pdf' | null;
  export_url: string | null;
  export_expires_at: string | null;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string;
}

// ============================================================================
// Dashboard Widgets
// ============================================================================

export interface WidgetConfig {
  metric?: MetricType;
  metrics?: MetricType[];
  chartType?: ChartType;
  colors?: string[];
  dateRange?: ReportConfig['dateRange'];
  filters?: Record<string, unknown>;
  showComparison?: boolean;
  showTrend?: boolean;
  limit?: number;
}

export interface DashboardWidget {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  widget_type: WidgetType;
  config: WidgetConfig;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetInput {
  name: string;
  widget_type: WidgetType;
  config: WidgetConfig;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export interface UpdateWidgetInput {
  name?: string;
  config?: WidgetConfig;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  is_visible?: boolean;
}

// ============================================================================
// Leaderboard
// ============================================================================

export interface LeaderboardEntry {
  id: string;
  org_id: string;
  user_id: string;
  period_type: TimeGranularity;
  period_start: string;
  leads_converted_rank: number | null;
  leads_converted_value: number;
  response_time_rank: number | null;
  response_time_value: number | null;
  compliance_score_rank: number | null;
  compliance_score_value: number;
  messages_sent_rank: number | null;
  messages_sent_value: number;
  tasks_completed_rank: number | null;
  tasks_completed_value: number;
  overall_score: number;
  overall_rank: number | null;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface LeaderboardUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  metric_value: number;
  rank: number;
}

// ============================================================================
// Analytics Summary Types
// ============================================================================

export interface KPIMetric {
  metric: MetricType;
  label: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  trend: 'up' | 'down' | 'flat';
  format: 'number' | 'percent' | 'currency' | 'duration';
}

export interface AnalyticsSummary {
  period: {
    start: string;
    end: string;
    granularity: TimeGranularity;
  };
  kpis: KPIMetric[];
  charts: {
    timeSeries: MetricDataPoint[];
    metric: MetricType;
  }[];
}

export interface DateRangeParams {
  start: string;
  end: string;
  granularity?: TimeGranularity;
  compareWithPrevious?: boolean;
}
