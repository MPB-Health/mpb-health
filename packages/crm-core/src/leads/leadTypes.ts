// Lead priority levels
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Sales Plan 2026 — required lead_source picklist.
 * Slugs mirror `public.crm_lead_source_types.slug`. The DB trigger
 * `crm_validate_lead_source` enforces that whatever gets written into
 * `lead_submissions.lead_source` matches an `is_active=true` row, and always
 * derives `is_self_generated` from the lookup so the split driving every 2026
 * report cannot drift from the picklist.
 *
 * Keep in sync with 20260413100000_crm_sales_plan_2026.sql (crm_lead_source_types seed).
 */
export const LEAD_SOURCE_SLUGS = [
  'linkedin',
  'networking',
  'referrals',
  'community',
  'reactivation',
  'inhouse_round_robin',
  'church_partnership',
  'hydration_booth',
  'chamber_bni_sbdc',
  'outside_advisors',
  'sunbiz_prospect',
] as const;
export type LeadSourceSlug = (typeof LEAD_SOURCE_SLUGS)[number];

/** Source slugs that are considered self-generated (Self-Gen vs Inhouse (RR) split). */
export const SELF_GENERATED_SOURCE_SLUGS: readonly LeadSourceSlug[] = [
  'linkedin',
  'networking',
  'referrals',
  'community',
  'reactivation',
  'church_partnership',
  'hydration_booth',
  'chamber_bni_sbdc',
  'outside_advisors',
  'sunbiz_prospect',
] as const;

/**
 * Client-side helper mirroring the DB trigger. Always prefer the server value
 * when available — this is for optimistic UI only.
 */
export function inferSelfGenerated(source: string | null | undefined): boolean {
  if (!source) return false;
  return (SELF_GENERATED_SOURCE_SLUGS as readonly string[]).includes(source);
}

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
  // Sales Plan 2026 attribution
  lead_source?: LeadSourceSlug | string | null;
  is_self_generated?: boolean | null;
  outside_advisor_id?: string | null;
  referral_partner_id?: string | null;
  reactivation_source_lead_id?: string | null;
  /** Leads-module subsection: working | nurture | linkedin | do_not_contact */
  workflow_subsection?: 'working' | 'nurture' | 'linkedin' | 'do_not_contact' | null;
  linkedin_workflow_status?: string | null;
  do_not_contact?: boolean | null;
  preliminary_quote_sent_at?: string | null;
  quote_cadence_started_at?: string | null;
  engagement_detected_at?: string | null;
  concierge_handoff_at?: string | null;
  last_opt_out_signal_at?: string | null;
  enrollment_approved_at?: string | null;
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
  planType?: 'healthshare' | 'traditional_insurance';
  carrierId?: string;
  tobaccoStatus?: string;
  groupType?: string;
  state?: string;
  // Sales Plan 2026 report filters
  leadSource?: LeadSourceSlug | string;
  isSelfGenerated?: boolean;
  outsideAdvisorId?: string;
  referralPartnerId?: string;
  /** Filter Leads module subsection tab */
  workflowSubsection?: 'working' | 'nurture' | 'linkedin' | 'do_not_contact';
  sortBy?: 'created_at' | 'last_contacted_at' | 'pipeline_stage' | 'assigned_to';
  sortDir?: 'asc' | 'desc';
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

// Default pipeline stages (8-stage MP Health model — DB `crm_pipeline_stages` is source of truth per org)
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: '1', name: 'new', display_name: 'New', color: '#3B82F6', sort_order: 1, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '2', name: 'working', display_name: 'Working', color: '#6366F1', sort_order: 2, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '3', name: 'quoted', display_name: 'Quoted', color: '#8B5CF6', sort_order: 3, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '4', name: 'engaged', display_name: 'Engaged / Qualifying', color: '#10B981', sort_order: 4, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '5', name: 'application_in_progress', display_name: 'Application in Progress', color: '#F59E0B', sort_order: 5, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '6', name: 'won', display_name: 'Won — Enrolled', color: '#22C55E', sort_order: 6, is_active: true, is_won_stage: true, is_lost_stage: false },
  { id: '7', name: 'nurture', display_name: 'Nurture', color: '#64748B', sort_order: 7, is_active: true, is_won_stage: false, is_lost_stage: false },
  { id: '8', name: 'lost', display_name: 'Lost', color: '#EF4444', sort_order: 8, is_active: true, is_won_stage: false, is_lost_stage: true },
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
  // Sales Plan 2026 — picklist is enforced DB-side by the
  // crm_validate_lead_source trigger. If omitted here the trigger defaults to
  // 'inhouse_round_robin' so automated intake paths stay unbroken during rollout,
  // but every user-driven intake path MUST surface the picker.
  lead_source?: LeadSourceSlug | string;
  is_self_generated?: boolean;
  outside_advisor_id?: string;
  referral_partner_id?: string;
  reactivation_source_lead_id?: string;
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
  // Sales Plan 2026 attribution
  lead_source?: LeadSourceSlug | string | null;
  outside_advisor_id?: string | null;
  referral_partner_id?: string | null;
  reactivation_source_lead_id?: string | null;
  workflow_subsection?: 'working' | 'nurture' | 'linkedin' | 'do_not_contact' | null;
  linkedin_workflow_status?: string | null;
  do_not_contact?: boolean | null;
}
