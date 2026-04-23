export interface Deal {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  account_id: string | null;
  contact_id: string | null;
  amount: number | null;
  currency: string;
  stage_id: string;
  probability: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  deal_type: 'new_business' | 'existing_business' | 'renewal';
  lead_source: string | null;
  next_step: string | null;
  owner_id: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  tags: string[];
  campaign_id: string | null;
  converted_from_lead_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  account?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  stage?: {
    id: string;
    name: string;
    display_name: string;
    color: string;
    probability: number;
    is_won_stage: boolean;
    is_lost_stage: boolean;
  } | null;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface DealStage {
  id: string;
  org_id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string | null;
  probability: number;
  sort_order: number;
  is_won_stage: boolean;
  is_lost_stage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealFilters {
  search?: string;
  account_id?: string;
  contact_id?: string;
  stage_id?: string;
  owner_id?: string;
  deal_type?: string;
  minAmount?: number;
  maxAmount?: number;
  closeFrom?: string;
  closeTo?: string;
  tags?: string[];
  includeWon?: boolean;
  includeLost?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface DealCreateInput {
  name: string;
  description?: string;
  account_id?: string;
  contact_id?: string;
  amount?: number;
  currency?: string;
  stage_id: string;
  probability?: number;
  expected_close_date?: string;
  deal_type?: 'new_business' | 'existing_business' | 'renewal';
  lead_source?: string;
  next_step?: string;
  owner_id?: string;
  tags?: string[];
  campaign_id?: string;
  // Sales Plan 2026: every closed deal rolls up into the Revenue + Leads Split
  // reports by product line (Health Insurance vs Medical Cost Sharing, with
  // more lines seeded in `crm_product_lines`). Optional during create so legacy
  // imports don't break; Revenue report rows without a line fall into a
  // "(uncategorised)" bucket so the omission is visible in QA.
  product_line?: string;
}

export interface DealUpdateInput extends Partial<DealCreateInput> {
  lost_reason?: string;
}

export interface DealStageHistory {
  id: string;
  deal_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by: string | null;
  notes: string | null;
  changed_at: string;
}
