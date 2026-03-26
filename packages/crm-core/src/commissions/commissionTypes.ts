export type AdvisorTier =
  | 'producer'
  | 'team_leader'
  | 'director'
  | 'regional_director'
  | 'national_director';

export type CommissionRateType = 'percentage' | 'flat' | 'per_member';

export type CommissionStatus = 'pending' | 'earned' | 'approved' | 'paid' | 'clawed_back' | 'disputed';

export interface CommissionSchedule {
  id: string;
  org_id: string;
  name: string;
  plan_id: string | null;
  carrier_id: string | null;
  advisor_tier: AdvisorTier | null;
  rate_type: CommissionRateType;
  rate_value: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionRecord {
  id: string;
  org_id: string;
  advisor_id: string;
  schedule_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  carrier_id: string | null;
  plan_type: string | null;
  premium_amount: number | null;
  subsidy_amount: number | null;
  member_responsibility: number | null;
  commission_rate: number | null;
  commission_amount: number;
  status: CommissionStatus;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advisor_name?: string;
  advisor_email?: string;
}

export interface CommissionPayout {
  id: string;
  org_id: string;
  advisor_id: string;
  total_amount: number;
  record_count: number;
  payout_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  advisor_name?: string;
}

export interface CommissionScheduleCreateInput {
  name: string;
  plan_id?: string;
  carrier_id?: string;
  advisor_tier?: AdvisorTier;
  rate_type: CommissionRateType;
  rate_value: number;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

export interface CommissionScheduleUpdateInput extends Partial<CommissionScheduleCreateInput> {
  is_active?: boolean;
}

export interface CommissionRecordCreateInput {
  advisor_id: string;
  schedule_id?: string;
  lead_id?: string;
  contact_id?: string;
  carrier_id?: string;
  plan_type?: string;
  premium_amount?: number;
  subsidy_amount?: number;
  member_responsibility?: number;
  commission_rate?: number;
  commission_amount: number;
  period_start?: string;
  period_end?: string;
  notes?: string;
}

export interface CommissionRecordUpdateInput {
  status?: CommissionStatus;
  commission_amount?: number;
  notes?: string;
  paid_at?: string;
}

export interface CommissionPayoutCreateInput {
  advisor_id: string;
  total_amount: number;
  record_count: number;
  payout_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

export interface CommissionFilters {
  advisor_id?: string;
  status?: CommissionStatus;
  plan_type?: string;
  carrier_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CommissionSummary {
  total_earned: number;
  total_pending: number;
  total_paid: number;
  total_clawed_back: number;
  record_count: number;
  avg_commission: number;
}

export const ADVISOR_TIER_LABELS: Record<AdvisorTier, string> = {
  producer: 'Producer',
  team_leader: 'Team Leader',
  director: 'Director',
  regional_director: 'Regional Director',
  national_director: 'National Director',
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: 'Pending',
  earned: 'Earned',
  approved: 'Approved',
  paid: 'Paid',
  clawed_back: 'Clawed Back',
  disputed: 'Disputed',
};
