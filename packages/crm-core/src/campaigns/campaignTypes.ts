export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'email' | 'social' | 'event' | 'webinar' | 'advertisement' | 'referral' | 'other';
export type MemberStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'responded' | 'converted' | 'unsubscribed' | 'bounced';

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  expected_revenue: number | null;
  actual_revenue: number | null;
  expected_response: number | null;
  num_sent: number;
  num_responses: number;
  num_converted: number;
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
  members_count?: number;
  leads_count?: number;
  contacts_count?: number;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  lead_id: string | null;
  contact_id: string | null;
  status: MemberStatus;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  responded_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    company: string | null;
  } | null;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    account_id: string | null;
  } | null;
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus;
  campaign_type?: CampaignType;
  owner_id?: string;
  parent_campaign_id?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  minBudget?: number;
  maxBudget?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignCreateInput {
  name: string;
  description?: string;
  campaign_type?: CampaignType;
  status?: CampaignStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  expected_revenue?: number;
  expected_response?: number;
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
  lead_id?: string;
  contact_id?: string;
  status?: MemberStatus;
  notes?: string;
}

export interface CampaignStats {
  totalMembers: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  respondedCount: number;
  convertedCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  conversionRate: number;
  roi: number | null;
}
