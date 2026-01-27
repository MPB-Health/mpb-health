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
