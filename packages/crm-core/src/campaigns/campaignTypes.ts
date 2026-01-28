export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  type: 'email' | 'webinar' | 'conference' | 'advertisement' | 'referral' | 'social' | 'other';
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  expected_revenue: number | null;
  actual_revenue: number | null;
  expected_response: number | null;
  target_audience: string | null;
  parent_campaign_id: string | null;
  owner_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithRelations extends Campaign {
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  parent_campaign?: {
    id: string;
    name: string;
  } | null;
  member_count?: number;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  lead_id: string | null;
  status: 'sent' | 'opened' | 'clicked' | 'responded' | 'converted' | 'opted_out';
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

export interface CampaignFilters {
  search?: string;
  type?: string;
  status?: string;
  owner_id?: string;
  parent_campaign_id?: string;
  startFrom?: string;
  startTo?: string;
  endFrom?: string;
  endTo?: string;
  minBudget?: number;
  maxBudget?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignCreateInput {
  name: string;
  description?: string;
  type: 'email' | 'webinar' | 'conference' | 'advertisement' | 'referral' | 'social' | 'other';
  status?: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  expected_revenue?: number;
  expected_response?: number;
  target_audience?: string;
  parent_campaign_id?: string;
  owner_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CampaignUpdateInput extends Partial<CampaignCreateInput> {
  actual_cost?: number;
  actual_revenue?: number;
}

export interface CampaignMemberCreateInput {
  contact_id?: string;
  lead_id?: string;
  status?: 'sent' | 'opened' | 'clicked' | 'responded' | 'converted' | 'opted_out';
  notes?: string;
}

export interface CampaignStats {
  totalMembers: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  respondedCount: number;
  convertedCount: number;
  optedOutCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  roi: number | null;
}
