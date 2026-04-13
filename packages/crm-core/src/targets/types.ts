export type TargetType = 'monthly_rep' | 'quarterly_team';

export interface ActivityTarget {
  id: string;
  org_id: string;
  target_type: TargetType;
  rep_id: string | null;
  period_start: string;
  period_end: string;
  targets: Record<string, number>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityTargetInput {
  target_type: TargetType;
  rep_id?: string;
  period_start: string;
  period_end: string;
  targets: Record<string, number>;
}

export interface TargetProgress {
  activity_type: string;
  target: number;
  actual: number;
  percentage: number;
  on_pace: boolean;
}

export interface RepTargetSummary {
  rep_id: string;
  rep_name: string;
  period: string;
  progress: TargetProgress[];
  overall_percentage: number;
}

export const DEFAULT_MONTHLY_TARGETS: Record<string, number> = {
  call: 200,
  email: 150,
  linkedin_post: 24,
  linkedin_connection_sent: 40,
  presentation: 10,
  networking_event: 4,
  community_outreach: 4,
  referral_requested: 10,
  crm_lead_entered: 30,
};

export const QUARTERLY_TEAM_TARGETS: Record<number, Record<string, number>> = {
  1: { leads: 250, sales_closed: 25, linkedin_followers: 150, referral_partners: 5, community_events: 3 },
  2: { leads: 400, sales_closed: 50, linkedin_followers: 200, referral_partners: 10, community_events: 6 },
  3: { leads: 500, sales_closed: 65, linkedin_followers: 250, referral_partners: 15, community_events: 8 },
  4: { leads: 700, sales_closed: 100, linkedin_followers: 300, referral_partners: 20, community_events: 10 },
};
