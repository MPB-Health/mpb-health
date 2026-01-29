// ============================================================================
// Plan Interest Types
// Types for tracking what health plans leads are interested in
// ============================================================================

// Family size options
export type FamilySize = 'MO' | 'M+S' | 'M+C' | 'M+F';

// Interest level progression
export type InterestLevel = 'interested' | 'quoted' | 'applied' | 'enrolled' | 'declined';

// Source of the interest
export type InterestSource = 'manual' | 'website_quote' | 'agent_quote' | 'imported';

// Household type for quotes
export type HouseholdType = 'individual' | 'couple' | 'family' | 'parent_child';

// Quote status
export type HealthQuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'declined';

// Quote source
export type HealthQuoteSource = 'crm' | 'website' | 'api' | 'import';

// Sync status for website quotes
export type WebsiteSyncStatus = 'pending' | 'synced' | 'failed' | 'skipped' | 'manual_review';

// ============================================================================
// Main Interfaces
// ============================================================================

export interface LeadPlanInterest {
  id: string;
  lead_id: string;
  plan_id: string | null;
  plan_name: string;
  plan_code: string | null;
  family_size: FamilySize;
  interest_level: InterestLevel;
  quoted_monthly_rate: number | null;
  quoted_at: string | null;
  quote_valid_until: string | null;
  primary_age: number | null;
  spouse_age: number | null;
  dependent_ages: number[] | null;
  source: InterestSource;
  source_quote_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface LeadPlanInterestWithPlan extends LeadPlanInterest {
  plan?: {
    id: string;
    name: string;
    slug: string;
    tier: string | null;
    features: Record<string, unknown> | null;
  } | null;
}

// ============================================================================
// Health Quote Types
// ============================================================================

export interface QuoteLine {
  plan_id: string;
  plan_name: string;
  family_size: FamilySize;
  monthly_rate: number;
  annual_rate: number;
  rate_breakdown: {
    base: number;
    spouse_add?: number;
    child_add?: number;
    age_factor?: number;
    state_factor?: number;
    tobacco_surcharge?: number;
  };
}

export interface LeadHealthQuote {
  id: string;
  lead_id: string;
  org_id: string | null;
  quote_number: string;
  status: HealthQuoteStatus;
  household_type: HouseholdType;
  member_count: number;
  primary_age: number;
  spouse_age: number | null;
  dependent_ages: number[] | null;
  state: string | null;
  zip_code: string | null;
  tobacco_user: boolean;
  quote_lines: QuoteLine[];
  total_monthly: number | null;
  total_annual: number | null;
  valid_from: string;
  valid_until: string;
  source: HealthQuoteSource;
  website_submission_id: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface LeadHealthQuoteWithLead extends LeadHealthQuote {
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
}

// ============================================================================
// Website Sync Types
// ============================================================================

export interface ExtractedQuoteData {
  household_type?: HouseholdType;
  primary_age?: number;
  spouse_age?: number;
  dependent_ages?: number[];
  state?: string;
  zip?: string;
  selected_plans?: string[];
  estimated_monthly?: number;
}

export interface WebsiteQuoteSync {
  id: string;
  website_submission_id: string;
  crm_lead_id: string | null;
  crm_quote_id: string | null;
  sync_status: WebsiteSyncStatus;
  sync_error: string | null;
  sync_attempts: number;
  last_sync_attempt: string | null;
  extracted_data: ExtractedQuoteData;
  created_at: string;
  synced_at: string | null;
}

// ============================================================================
// Input Types
// ============================================================================

export interface LeadPlanInterestCreateInput {
  lead_id: string;
  plan_id?: string;
  plan_name: string;
  plan_code?: string;
  family_size: FamilySize;
  interest_level?: InterestLevel;
  quoted_monthly_rate?: number;
  quoted_at?: string;
  quote_valid_until?: string;
  primary_age?: number;
  spouse_age?: number;
  dependent_ages?: number[];
  source?: InterestSource;
  source_quote_id?: string;
  notes?: string;
}

export interface LeadPlanInterestUpdateInput {
  interest_level?: InterestLevel;
  quoted_monthly_rate?: number;
  quoted_at?: string;
  quote_valid_until?: string;
  primary_age?: number;
  spouse_age?: number;
  dependent_ages?: number[];
  notes?: string;
}

export interface HealthQuoteCreateInput {
  lead_id: string;
  household_type: HouseholdType;
  member_count?: number;
  primary_age: number;
  spouse_age?: number;
  dependent_ages?: number[];
  state?: string;
  zip_code?: string;
  tobacco_user?: boolean;
  quote_lines: QuoteLine[];
  valid_until?: string;
  source?: HealthQuoteSource;
  website_submission_id?: string;
  notes?: string;
}

export interface HealthQuoteUpdateInput {
  status?: HealthQuoteStatus;
  quote_lines?: QuoteLine[];
  valid_until?: string;
  notes?: string;
  decline_reason?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface PlanInterestFilters {
  lead_id?: string;
  plan_id?: string;
  family_size?: FamilySize;
  interest_level?: InterestLevel;
  source?: InterestSource;
  hasQuote?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface HealthQuoteFilters {
  lead_id?: string;
  status?: HealthQuoteStatus;
  source?: HealthQuoteSource;
  household_type?: HouseholdType;
  validOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface WebsiteSyncFilters {
  sync_status?: WebsiteSyncStatus;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Available Plan (for selection)
// ============================================================================

export interface AvailableHealthPlan {
  id: string;
  name: string;
  slug: string;
  tier: string | null;
  monthly_contribution: number | null;
  features: Record<string, unknown> | null;
}

// ============================================================================
// Family Size Labels
// ============================================================================

export const FAMILY_SIZE_LABELS: Record<FamilySize, string> = {
  'MO': 'Member Only',
  'M+S': 'Member + Spouse',
  'M+C': 'Member + Child(ren)',
  'M+F': 'Member + Family',
};

export const INTEREST_LEVEL_LABELS: Record<InterestLevel, string> = {
  'interested': 'Interested',
  'quoted': 'Quoted',
  'applied': 'Applied',
  'enrolled': 'Enrolled',
  'declined': 'Declined',
};

export const HOUSEHOLD_TYPE_LABELS: Record<HouseholdType, string> = {
  'individual': 'Individual',
  'couple': 'Couple',
  'family': 'Family',
  'parent_child': 'Parent + Child(ren)',
};
