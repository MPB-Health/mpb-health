export type CarrierType =
  | 'traditional'
  | 'healthshare'
  | 'supplemental'
  | 'dental'
  | 'vision'
  | 'life'
  | 'other';

export interface InsuranceCarrier {
  id: string;
  org_id: string | null;
  name: string;
  slug: string;
  carrier_type: CarrierType;
  is_active: boolean;
  logo_url: string | null;
  website_url: string | null;
  phone: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CarrierCreateInput {
  name: string;
  slug?: string;
  carrier_type: CarrierType;
  logo_url?: string;
  website_url?: string;
  phone?: string;
  notes?: string;
  sort_order?: number;
}

export interface CarrierUpdateInput extends Partial<CarrierCreateInput> {
  is_active?: boolean;
}

export interface CarrierFilters {
  carrier_type?: CarrierType;
  is_active?: boolean;
  search?: string;
}

export type PlanType = 'healthshare' | 'traditional_insurance';

export type TobaccoStatus = 'none' | 'tobacco_user' | 'vape_user' | 'former_user';

export type GroupType = 'individual' | 'small_group' | 'large_group' | 'association';

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  healthshare: 'HealthShare',
  traditional_insurance: 'Traditional Insurance',
};

export const TOBACCO_STATUS_LABELS: Record<TobaccoStatus, string> = {
  none: 'Non-Tobacco',
  tobacco_user: 'Tobacco User',
  vape_user: 'Vape User',
  former_user: 'Former User',
};

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  individual: 'Individual',
  small_group: 'Small Group',
  large_group: 'Large Group',
  association: 'Association',
};

export const CARRIER_TYPE_LABELS: Record<CarrierType, string> = {
  traditional: 'Traditional Insurance',
  healthshare: 'HealthShare',
  supplemental: 'Supplemental',
  dental: 'Dental',
  vision: 'Vision',
  life: 'Life',
  other: 'Other',
};
