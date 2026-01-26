// Lead priority levels
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

// Zoho sync status
export type ZohoSyncStatus = 'pending' | 'synced' | 'failed' | 'error';

// Main Lead interface matching database schema
export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size?: number;
  zip_code?: string;
  current_insurance?: string;
  monthly_premium?: string;
  coverage_preference?: string;
  primary_concern?: string;
  contact_preference?: string;
  pipeline_stage: string;
  priority: LeadPriority;
  assigned_to?: string;
  lead_score: number;
  tags: string[];
  source_cta?: string;
  source_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  zoho_lead_id?: string;
  zoho_sync_status: ZohoSyncStatus;
  created_at: string;
  updated_at?: string;
  stage_changed_at?: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  converted_at?: string;
  lost_reason?: string;
  form_data?: Record<string, unknown>;
}

// Filters for lead queries
export interface LeadFilters {
  stage?: string;
  priority?: LeadPriority;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  zohoSyncStatus?: ZohoSyncStatus;
}

// Pipeline stage configuration
export interface PipelineStage {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  is_won_stage: boolean;
  is_lost_stage: boolean;
}

// Default pipeline stages
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: '1', name: 'new', display_name: 'New', color: '#3B82F6', sort_order: 1, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '2', name: 'contacted', display_name: 'Contacted', color: '#8B5CF6', sort_order: 2, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '3', name: 'qualified', display_name: 'Qualified', color: '#10B981', sort_order: 3, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '4', name: 'proposal', display_name: 'Proposal', color: '#F59E0B', sort_order: 4, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '5', name: 'negotiation', display_name: 'Negotiation', color: '#EC4899', sort_order: 5, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '6', name: 'won', display_name: 'Won', color: '#22C55E', sort_order: 6, is_active: true, is_won_stage: true, is_lost_stage: false },
  { id: '7', name: 'lost', display_name: 'Lost', color: '#EF4444', sort_order: 7, is_active: true, is_won_stage: false, is_lost_stage: true },
];

// CRM Dashboard statistics
export interface CRMDashboardStats {
  total_leads: number;
  new_leads: number;
  leads_by_stage: Record<string, number>;
  leads_by_priority: Record<string, number>;
  overdue_tasks: number;
  tasks_due_today: number;
  conversion_rate: number;
  avg_days_to_close: number;
}

// Bulk operation result
export interface BulkUpdateResult {
  success: number;
  failed: number;
  errors: string[];
}

// Lead creation input
export interface LeadCreateInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  household_size?: number;
  zip_code?: string;
  current_insurance?: string;
  monthly_premium?: string;
  coverage_preference?: string;
  primary_concern?: string;
  contact_preference?: string;
  source_cta?: string;
  source_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  form_data?: Record<string, unknown>;
  tags?: string[];
}

// Lead update input
export interface LeadUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  household_size?: number;
  zip_code?: string;
  pipeline_stage?: string;
  priority?: LeadPriority;
  assigned_to?: string;
  lead_score?: number;
  tags?: string[];
  next_followup_at?: string;
  lost_reason?: string;
}
