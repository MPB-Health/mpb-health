export interface ReportDateRange {
  from: string; // ISO date
  to: string;   // ISO date
}

export interface ConversionFunnelData {
  stage: string;
  display_name: string;
  count: number;
  color: string;
  conversion_rate: number; // % of leads that moved to the next stage
}

export interface LeadSourceBreakdown {
  source: string;
  count: number;
  conversion_rate: number;
  avg_days_to_convert: number;
}

export interface ResponseTimeMetrics {
  avg_first_contact_hours: number;
  median_first_contact_hours: number;
  within_1h_percent: number;
  within_24h_percent: number;
}

export interface TeamPerformanceRow {
  user_id: string;
  user_email: string;
  leads_assigned: number;
  leads_converted: number;
  conversion_rate: number;
  avg_response_hours: number;
  tasks_completed: number;
  activities_logged: number;
}

// =====================================================
// SAVED REPORTS
// =====================================================

export type ReportType = 'conversion_funnel' | 'lead_sources' | 'team_performance' | 'interaction' | 'custom';

export interface SavedReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'csv' | 'xlsx' | 'pdf';
  time?: string; // HH:mm
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface SavedReport {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  report_type: ReportType;
  filters: Record<string, unknown>;
  columns: string[];
  sort_config: { field: string; direction: 'asc' | 'desc' } | null;
  chart_config: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  schedule_config?: SavedReportSchedule;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SavedReportCreateInput {
  name: string;
  description?: string;
  report_type: ReportType;
  filters?: Record<string, unknown>;
  columns?: string[];
  sort_config?: { field: string; direction: 'asc' | 'desc' };
  chart_config?: Record<string, unknown>;
  is_default?: boolean;
  is_shared?: boolean;
  schedule_config?: SavedReportSchedule;
}

export interface SavedReportUpdateInput extends Partial<SavedReportCreateInput> {}

// =====================================================
// EXPORT ARCHIVE
// =====================================================

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReportExport {
  id: string;
  org_id: string;
  saved_report_id?: string;
  report_name: string;
  report_type: ReportType;
  export_format: ExportFormat;
  file_path?: string;
  file_size_bytes?: number;
  row_count?: number;
  filters_used: Record<string, unknown>;
  status: ExportStatus;
  error_message?: string;
  exported_by: string;
  exported_at: string;
  expires_at: string;
}

export interface ReportExportCreateInput {
  saved_report_id?: string;
  report_name: string;
  report_type: ReportType;
  export_format: ExportFormat;
  filters_used?: Record<string, unknown>;
}

// =====================================================
// USER PRESENCE (Online Now)
// =====================================================

export type UserPresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  id: string;
  user_id: string;
  org_id: string;
  status: UserPresenceStatus;
  current_page?: string;
  last_activity_at: string;
  session_started_at: string;
  ip_address?: string;
  user_agent?: string;
  // Joined fields
  user_email?: string;
  user_name?: string;
}

export interface UserPresenceUpdateInput {
  status?: UserPresenceStatus;
  current_page?: string;
}

// =====================================================
// INTERACTION LOGS
// =====================================================

export type InteractionType = 'call' | 'email' | 'chat' | 'meeting' | 'note';
export type InteractionDirection = 'inbound' | 'outbound';
export type InteractionOutcome = 'completed' | 'no_answer' | 'voicemail' | 'callback_requested' | 'scheduled' | 'cancelled';
export type InteractionSentiment = 'positive' | 'neutral' | 'negative';

export interface InteractionLog {
  id: string;
  org_id: string;
  member_id?: string;
  agent_id: string;
  interaction_type: InteractionType;
  direction?: InteractionDirection;
  subject?: string;
  summary?: string;
  duration_seconds?: number;
  outcome?: InteractionOutcome;
  sentiment?: InteractionSentiment;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined fields
  agent_email?: string;
  agent_name?: string;
  member_name?: string;
}

export interface InteractionLogCreateInput {
  member_id?: string;
  interaction_type: InteractionType;
  direction?: InteractionDirection;
  subject?: string;
  summary?: string;
  duration_seconds?: number;
  outcome?: InteractionOutcome;
  sentiment?: InteractionSentiment;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface InteractionFilters {
  member_id?: string;
  agent_id?: string;
  interaction_type?: InteractionType;
  direction?: InteractionDirection;
  outcome?: InteractionOutcome;
  sentiment?: InteractionSentiment;
  date_from?: string;
  date_to?: string;
}

export interface InteractionStats {
  total_interactions: number;
  by_type: Record<InteractionType, number>;
  by_outcome: Record<string, number>;
  by_sentiment: Record<string, number>;
  avg_duration_seconds: number;
  interactions_per_day: { date: string; count: number }[];
}
