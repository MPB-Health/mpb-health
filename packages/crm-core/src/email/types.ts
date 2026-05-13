export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template_id?: string;
  /**
   * Section 7 (Round 3 Addendum) — admin-driven mass sends pull from the
   * Master Template Library and stamp the master id so the outbound row in
   * `crm_email_log` can be attributed back to the master template (and so
   * the master template's usage / version metrics can be rolled up).
   */
  master_template_id?: string;
  lead_id?: string;
  // Sales Plan 2026 A/B harness — callers stamp these so send-crm-email +
  // email-tracking can attribute opens/clicks/replies to the right variant.
  ab_test_id?: string;
  ab_variant?: 'a' | 'b';
}

export interface EmailSendResult {
  success: boolean;
  email_id?: string;
  error?: string;
}

export interface EmailLogEntry {
  id: string;
  org_id: string | null;
  lead_id: string | null;
  template_id: string | null;
  to_email: string;
  subject: string | null;
  body_preview: string | null;
  status: 'sent' | 'failed' | 'bounced';
  resend_email_id: string | null;
  sent_by: string | null;
  sent_at: string;
  created_at: string;
  // Tracking fields
  tracking_id?: string;
  open_count?: number;
  click_count?: number;
  first_opened_at?: string;
  last_opened_at?: string;
}

// =====================================================
// EMAIL SCHEDULES
// =====================================================

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type RecipientType = 'leads' | 'members' | 'agents' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface ScheduleConfig {
  time: string; // HH:mm format
  timezone: string; // e.g., 'America/New_York'
  days_of_week?: number[]; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  run_date?: string; // ISO date for 'once' type
}

export interface EmailSchedule {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  template_id?: string;
  recipient_type: RecipientType;
  recipient_filter: Record<string, unknown>;
  recipient_list: string[];
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  next_run_at?: string;
  last_run_at?: string;
  status: ScheduleStatus;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  template_name?: string;
}

export interface EmailScheduleCreateInput {
  name: string;
  description?: string;
  template_id?: string;
  recipient_type: RecipientType;
  recipient_filter?: Record<string, unknown>;
  recipient_list?: string[];
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
}

export interface EmailScheduleUpdateInput extends Partial<EmailScheduleCreateInput> {
  status?: ScheduleStatus;
}

// =====================================================
// EMAIL TRACKING
// =====================================================

export type TrackingType = 'open' | 'click';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface EmailTracking {
  id: string;
  email_log_id: string;
  tracking_type: TrackingType;
  link_url?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: DeviceType;
  location_country?: string;
  location_city?: string;
  tracked_at: string;
}

export interface EmailTrackingStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  opens_by_device: Record<DeviceType, number>;
  opens_by_country: Record<string, number>;
  opens_over_time: { date: string; count: number }[];
  top_clicked_links: { url: string; count: number }[];
}

export interface EmailLogFilters {
  status?: 'sent' | 'failed' | 'bounced';
  template_id?: string;
  lead_id?: string;
  sent_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  has_opened?: boolean;
  has_clicked?: boolean;
}
