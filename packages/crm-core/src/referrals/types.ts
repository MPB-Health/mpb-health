export type PartnerType =
  | 'financial_advisor'
  | 'cpa'
  | 'hr_consultant'
  | 'attorney'
  | 'payroll_company'
  | 'other';

export interface ReferralPartner {
  id: string;
  org_id: string;
  name: string;
  partner_type: PartnerType;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralPartnerInput {
  name: string;
  partner_type?: PartnerType;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  is_active?: boolean;
}

export type ReferralDirection = 'requested' | 'received';
export type ReferralStatus = 'pending' | 'contacted' | 'converted' | 'lost' | 'declined';

export interface Referral {
  id: string;
  org_id: string;
  partner_id: string;
  lead_id: string | null;
  contact_id: string | null;
  referred_by: string;
  direction: ReferralDirection;
  status: ReferralStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  partner?: ReferralPartner;
}

export interface ReferralInput {
  partner_id: string;
  lead_id?: string;
  contact_id?: string;
  direction: ReferralDirection;
  status?: ReferralStatus;
  notes?: string;
}

export interface PartnerStats {
  partner_id: string;
  partner_name: string;
  referrals_requested: number;
  referrals_received: number;
  converted: number;
}

export interface RepReferralStats {
  rep_id: string;
  rep_name: string;
  requested: number;
  received: number;
  converted: number;
}
