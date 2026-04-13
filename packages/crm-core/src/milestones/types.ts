export interface QuarterlyMilestone {
  id: string;
  org_id: string;
  year: number;
  quarter: number;
  phase_name: string;
  lead_target: number;
  sales_target: number;
  revenue_target: number;
  linkedin_follower_target: number;
  referral_partner_target: number;
  community_event_target: number;
  actuals: MilestoneActuals;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneActuals {
  leads?: number;
  sales_closed?: number;
  revenue?: number;
  linkedin_followers?: number;
  referral_partners?: number;
  community_events?: number;
}

export interface MilestoneInput {
  year: number;
  quarter: number;
  phase_name: string;
  lead_target?: number;
  sales_target?: number;
  revenue_target?: number;
  linkedin_follower_target?: number;
  referral_partner_target?: number;
  community_event_target?: number;
}

export interface MilestoneProgress {
  quarter: number;
  phase_name: string;
  metrics: {
    name: string;
    target: number;
    actual: number;
    percentage: number;
  }[];
}

export type ForecastScenario = 'conservative' | 'moderate' | 'aggressive';

export interface ForecastResult {
  scenario: ForecastScenario;
  projected_leads: number;
  projected_sales: number;
  projected_revenue: number;
  avg_revenue_per_sale: number;
}

export const DEFAULT_MILESTONES: Record<number, { phase: string; leads: number; sales: number; linkedin: number; partners: number; events: number }> = {
  1: { phase: 'Q1 Foundation',        leads: 250, sales: 25,  linkedin: 150, partners: 5,  events: 3  },
  2: { phase: 'Q2 Acceleration',      leads: 400, sales: 50,  linkedin: 200, partners: 10, events: 6  },
  3: { phase: 'Q3 Pre-OE Ramp',       leads: 500, sales: 65,  linkedin: 250, partners: 15, events: 8  },
  4: { phase: 'Q4 OE Execution',      leads: 700, sales: 100, linkedin: 300, partners: 20, events: 10 },
};
