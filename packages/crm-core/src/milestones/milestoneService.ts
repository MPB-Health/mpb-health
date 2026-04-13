import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  QuarterlyMilestone,
  MilestoneInput,
  MilestoneProgress,
  ForecastScenario,
  ForecastResult,
  MilestoneActuals,
} from './types';
import { DEFAULT_MILESTONES } from './types';

export class MilestoneService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getMilestones(year: number): Promise<QuarterlyMilestone[]> {
    const { data, error } = await this.supabase
      .from('crm_quarterly_milestones')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('year', year)
      .order('quarter');

    if (error) {
      console.error('Failed to get milestones:', error);
      return [];
    }
    return data as QuarterlyMilestone[];
  }

  async getMilestone(id: string): Promise<QuarterlyMilestone | null> {
    const { data, error } = await this.supabase
      .from('crm_quarterly_milestones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as QuarterlyMilestone;
  }

  async upsertMilestone(input: MilestoneInput): Promise<QuarterlyMilestone | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data: existing } = await this.supabase
      .from('crm_quarterly_milestones')
      .select('id')
      .eq('org_id', this.orgId)
      .eq('year', input.year)
      .eq('quarter', input.quarter)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.supabase
        .from('crm_quarterly_milestones')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update milestone:', error);
        return null;
      }
      return data as QuarterlyMilestone;
    }

    const { data, error } = await this.supabase
      .from('crm_quarterly_milestones')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create milestone:', error);
      return null;
    }
    return data as QuarterlyMilestone;
  }

  async seedDefaultMilestones(year: number): Promise<void> {
    for (const [q, defaults] of Object.entries(DEFAULT_MILESTONES)) {
      await this.upsertMilestone({
        year,
        quarter: Number(q),
        phase_name: defaults.phase,
        lead_target: defaults.leads,
        sales_target: defaults.sales,
        linkedin_follower_target: defaults.linkedin,
        referral_partner_target: defaults.partners,
        community_event_target: defaults.events,
      });
    }
  }

  async updateActuals(
    id: string,
    actuals: MilestoneActuals
  ): Promise<QuarterlyMilestone | null> {
    const { data, error } = await this.supabase
      .from('crm_quarterly_milestones')
      .update({ actuals })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update actuals:', error);
      return null;
    }
    return data as QuarterlyMilestone;
  }

  async getMilestoneProgress(year: number): Promise<MilestoneProgress[]> {
    const milestones = await this.getMilestones(year);
    const progress: MilestoneProgress[] = [];

    for (const ms of milestones) {
      const actuals = ms.actuals || {};
      progress.push({
        quarter: ms.quarter,
        phase_name: ms.phase_name,
        metrics: [
          { name: 'Leads', target: ms.lead_target, actual: actuals.leads || 0, percentage: ms.lead_target > 0 ? Math.round(((actuals.leads || 0) / ms.lead_target) * 100) : 0 },
          { name: 'Sales Closed', target: ms.sales_target, actual: actuals.sales_closed || 0, percentage: ms.sales_target > 0 ? Math.round(((actuals.sales_closed || 0) / ms.sales_target) * 100) : 0 },
          { name: 'Revenue', target: ms.revenue_target, actual: actuals.revenue || 0, percentage: ms.revenue_target > 0 ? Math.round(((actuals.revenue || 0) / ms.revenue_target) * 100) : 0 },
          { name: 'LinkedIn Followers', target: ms.linkedin_follower_target, actual: actuals.linkedin_followers || 0, percentage: ms.linkedin_follower_target > 0 ? Math.round(((actuals.linkedin_followers || 0) / ms.linkedin_follower_target) * 100) : 0 },
          { name: 'Referral Partners', target: ms.referral_partner_target, actual: actuals.referral_partners || 0, percentage: ms.referral_partner_target > 0 ? Math.round(((actuals.referral_partners || 0) / ms.referral_partner_target) * 100) : 0 },
          { name: 'Community Events', target: ms.community_event_target, actual: actuals.community_events || 0, percentage: ms.community_event_target > 0 ? Math.round(((actuals.community_events || 0) / ms.community_event_target) * 100) : 0 },
        ],
      });
    }

    return progress;
  }

  async getForecastScenarios(
    year: number,
    quarter: number,
    avgRevenuePerSale: Record<ForecastScenario, number> = {
      conservative: 2000,
      moderate: 3500,
      aggressive: 5000,
    }
  ): Promise<ForecastResult[]> {
    const milestones = await this.getMilestones(year);
    const ms = milestones.find((m) => m.quarter === quarter);
    if (!ms) return [];

    const actuals = ms.actuals || {};
    const actualLeads = actuals.leads || 0;
    const actualSales = actuals.sales_closed || 0;

    const convRate = actualLeads > 0 ? actualSales / actualLeads : 0.1;

    const results: ForecastResult[] = [];
    const scenarios: ForecastScenario[] = ['conservative', 'moderate', 'aggressive'];
    const multipliers = { conservative: 0.8, moderate: 1.0, aggressive: 1.3 };

    for (const scenario of scenarios) {
      const mult = multipliers[scenario];
      const projectedLeads = Math.round(ms.lead_target * mult);
      const projectedSales = Math.round(projectedLeads * convRate);
      const avgRev = avgRevenuePerSale[scenario];
      results.push({
        scenario,
        projected_leads: projectedLeads,
        projected_sales: projectedSales,
        projected_revenue: projectedSales * avgRev,
        avg_revenue_per_sale: avgRev,
      });
    }

    return results;
  }
}

export function createMilestoneService(
  supabase: SupabaseClient,
  orgId: string
): MilestoneService {
  return new MilestoneService(supabase, orgId);
}
