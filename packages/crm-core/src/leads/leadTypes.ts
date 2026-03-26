// Lead priority levels
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

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
  zoho_sync_status?: string;
  created_at: string;
  updated_at?: string;
  stage_changed_at?: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  converted_at?: string;
  lost_reason?: string;
  form_data?: Record<string, unknown>;
  // Domain fields
  plan_type?: 'healthshare' | 'traditional_insurance' | null;
  carrier_id?: string | null;
  tobacco_status?: 'none' | 'tobacco_user' | 'vape_user' | 'former_user' | null;
  group_type?: 'individual' | 'small_group' | 'large_group' | 'association' | null;
  original_effective_date?: string | null;
  premium_amount?: number | null;
  subsidy_amount?: number | null;
  member_responsibility?: number | null;
  state?: string | null;
  city?: string | null;
  // Joined relations (not persisted)
  carrier?: { id: string; name: string; carrier_type: string } | null;
  assigned_user?: { id: string; email: string; full_name?: string } | null;
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
  zohoSyncStatus?: string;
  planType?: 'healthshare' | 'traditional_insurance';
  carrierId?: string;
  tobaccoStatus?: string;
  groupType?: string;
  state?: string;
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
  /** Computed field (not persisted). Used by dashboard views to show lead counts per stage. */
  count?: number;
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
  plan_type?: 'healthshare' | 'traditional_insurance';
  carrier_id?: string;
  tobacco_status?: string;
  group_type?: string;
  original_effective_date?: string;
  premium_amount?: number;
  subsidy_amount?: number;
  member_responsibility?: number;
  state?: string;
  city?: string;
}

// Lead update input
export interface LeadUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  household_size?: number;
  zip_code?: string;
  current_insurance?: string;
  monthly_premium?: string;
  coverage_preference?: string;
  primary_concern?: string;
  contact_preference?: string;
  pipeline_stage?: string;
  priority?: LeadPriority;
  assigned_to?: string;
  lead_score?: number;
  tags?: string[];
  next_followup_at?: string;
  lost_reason?: string;
  plan_type?: 'healthshare' | 'traditional_insurance' | null;
  carrier_id?: string | null;
  tobacco_status?: string | null;
  group_type?: string | null;
  original_effective_date?: string | null;
  premium_amount?: number | null;
  subsidy_amount?: number | null;
  member_responsibility?: number | null;
  state?: string | null;
  city?: string | null;
}
