// ============================================================================
// CRM Lead Types - Lead and pipeline related types
// ============================================================================

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source: LeadSource;
  status: LeadStatus;
  stage: PipelineStage;
  priority: LeadPriority;
  score?: number;
  assigned_to?: string;
  owner_id?: string;

  // Contact info
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Lead details
  interested_in?: string[];
  notes?: string;
  tags?: string[];

  // Tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landing_page?: string;

  // Dates
  last_contacted_at?: string;
  next_follow_up_at?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;

  // Zoho sync
  zoho_id?: string;
  zoho_sync_status?: SyncStatus;
  zoho_last_sync?: string;
}

export type LeadSource =
  | 'website'
  | 'referral'
  | 'organic'
  | 'paid_search'
  | 'social_media'
  | 'email_campaign'
  | 'event'
  | 'partner'
  | 'cold_outreach'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurturing';

export type PipelineStage =
  | 'new_lead'
  | 'initial_contact'
  | 'needs_assessment'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  subject: string;
  description?: string;
  outcome?: string;
  duration_minutes?: number;
  scheduled_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'sms'
  | 'status_change'
  | 'stage_change';

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  task_type: string;
  priority: LeadPriority;
  status: TaskStatus;
  due_date?: string;
  reminder_at?: string;
  assigned_to: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  content: string;
  parent_id?: string;
  mentions?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadAttachment {
  id: string;
  lead_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

// Pipeline analytics
export interface PipelineMetrics {
  total_leads: number;
  leads_by_stage: Record<PipelineStage, number>;
  leads_by_status: Record<LeadStatus, number>;
  conversion_rate: number;
  average_deal_value: number;
  average_time_to_close: number;
  leads_created_this_period: number;
  leads_converted_this_period: number;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus[];
  stage?: PipelineStage[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
}
