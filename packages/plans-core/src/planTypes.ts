// ============================================================================
// Unified Plan Types — Single source of truth for Website, CRM, Admin Portal
// ============================================================================

export interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  plan_type: string;
  is_medical_cost_sharing: boolean;
  is_mec_compliant: boolean;
  is_hsa_compatible: boolean;
  target_audience: string | null;
  sort_order: number;
  is_active: boolean;
  code: string | null;
  enrollment_fee: number;
  annual_membership_fee: number;
  tobacco_surcharge_pct: number;
  currency: string;
  enroll_url: string | null;
  cost_basis: number | null;
  external_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  category: string;
  feature_name: string;
  feature_value: string | null;
  cost: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface PlanPricing {
  id: string;
  plan_id: string;
  age_min: number;
  age_max: number;
  member_type: string;
  iua_amount: number | null;
  monthly_contribution: number;
  effective_date: string;
  created_at: string;
}

export interface PlanSharingDetails {
  id: string;
  plan_id: string;
  has_lifetime_cap: boolean;
  has_annual_cap: boolean;
  preexisting_lookback_months: number | null;
  maternity_waiting_months: number | null;
  has_international_coverage: boolean;
  iua_options: number[] | null;
  created_at: string;
  updated_at: string;
}

// Composite types for full plan data
export interface PlanWithFeatures extends Plan {
  features: PlanFeature[];
  price_display?: string;
}

export interface PlanWithPricing extends Plan {
  pricing: PlanPricing[];
}

export interface PlanWithDetails extends Plan {
  features: PlanFeature[];
  pricing: PlanPricing[];
  sharing_details: PlanSharingDetails | null;
}

// Input types for CRUD
export interface PlanCreateInput {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  plan_type: string;
  is_medical_cost_sharing?: boolean;
  is_mec_compliant?: boolean;
  is_hsa_compatible?: boolean;
  target_audience?: string;
  sort_order?: number;
  is_active?: boolean;
  code?: string;
  enrollment_fee?: number;
  annual_membership_fee?: number;
  tobacco_surcharge_pct?: number;
  currency?: string;
  enroll_url?: string;
  cost_basis?: number;
  external_product_id?: string;
}

export interface PlanUpdateInput extends Partial<PlanCreateInput> {}

export interface PlanFeatureCreateInput {
  plan_id: string;
  category: string;
  feature_name: string;
  feature_value?: string;
  cost?: string;
  notes?: string;
  sort_order?: number;
}

export interface PlanPricingCreateInput {
  plan_id: string;
  age_min: number;
  age_max: number;
  member_type: string;
  iua_amount?: number | null;
  monthly_contribution: number;
  effective_date: string;
}

export interface PlanSharingDetailsInput {
  plan_id: string;
  has_lifetime_cap?: boolean;
  has_annual_cap?: boolean;
  preexisting_lookback_months?: number;
  maternity_waiting_months?: number;
  has_international_coverage?: boolean;
  iua_options?: number[];
}

// Filters
export interface PlanFilters {
  search?: string;
  plan_type?: string;
  is_active?: boolean;
  target_audience?: string;
}

// Rate engine types
export interface RateEstimateInput {
  planSlug: string;
  age: number;
  memberType: string;
  iuaAmount?: number | null;
  usesTobacco?: boolean;
  effectiveDate?: string;
}

export interface RateEstimate {
  planId: string;
  planName: string;
  planSlug: string;
  monthlyContribution: number;
  tobaccoSurcharge: number;
  totalMonthly: number;
  totalAnnual: number;
  enrollmentFee: number;
  annualMembershipFee: number;
  memberType: string;
  iuaAmount: number | null;
  ageBand: string;
}

export interface AllPlansEstimate {
  planSlug: string;
  planName: string;
  planType: string;
  isActive: boolean;
  estimates: RateEstimate[];
}

// Service result type
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Member type constants
export const MEMBER_TYPES = ['individual', 'couple', 'member_child', 'family'] as const;
export type MemberType = typeof MEMBER_TYPES[number];

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  individual: 'Member Only',
  couple: 'Member + Spouse',
  member_child: 'Member + Child(ren)',
  family: 'Member + Family',
};

// Plan type constants
export const PLAN_TYPES = ['essentials', 'mec_essentials', 'care_plus', 'direct', 'secure_hsa'] as const;
export type PlanType = typeof PLAN_TYPES[number];

export const PLAN_TYPE_LABELS: Record<string, string> = {
  essentials: 'Essentials',
  mec_essentials: 'MEC+ Essentials',
  care_plus: 'Care Plus',
  direct: 'Direct',
  secure_hsa: 'Secure HSA',
};

// IUA options used across plans
export const IUA_OPTIONS = [1250, 2500, 5000] as const;

// Age bands
export const AGE_BANDS = [
  { label: '18-29', min: 18, max: 29 },
  { label: '30-49', min: 30, max: 49 },
  { label: '50-64', min: 50, max: 64 },
] as const;
