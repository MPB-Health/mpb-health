// ============================================================================
// Analytics Module — Public exports
// ============================================================================

export { AnalyticsService, analyticsService } from './AnalyticsService';
export { ReportService, reportService, REPORT_TEMPLATES } from './ReportService';

export type {
  // Enums
  MetricType,
  TimeGranularity,
  ReportStatus,
  ReportType,
  WidgetType,
  ChartType,

  // Metric Snapshots
  MetricSnapshot,
  MetricDataPoint,

  // Performance Goals
  PerformanceGoal,
  CreateGoalInput,

  // Saved Reports
  ReportConfig,
  SavedReport,
  CreateReportInput,

  // Report Schedules
  ReportRecipient,
  ReportSchedule,
  CreateScheduleInput,

  // Report Runs
  ReportRun,

  // Dashboard Widgets
  WidgetConfig,
  DashboardWidget,
  CreateWidgetInput,
  UpdateWidgetInput,

  // Leaderboard
  LeaderboardEntry,
  LeaderboardUser,

  // Analytics Summary
  KPIMetric,
  AnalyticsSummary,
  DateRangeParams,
} from './types';
