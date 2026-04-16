// ============================================================================
// Plan Interest Service
// Manages lead plan interests - tracking what plans leads are interested in
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LeadPlanInterest,
  LeadPlanInterestWithPlan,
  LeadPlanInterestCreateInput,
  LeadPlanInterestUpdateInput,
  PlanInterestFilters,
  AvailableHealthPlan,
} from './planInterestTypes';

export class PlanInterestService {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // Get Plan Interests for a Lead
  // ============================================================================

  async getLeadPlanInterests(leadId: string): Promise<LeadPlanInterestWithPlan[]> {
    const { data, error } = await this.supabase
      .from('crm_lead_plan_interests')
      .select(`
        id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by,
        plan:plans(id, name, slug, tier, features)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PlanInterestService] Failed to get plan interests:', error);
      throw new Error(`Failed to get plan interests: ${error.message}`);
    }

    return (data || []) as any;
  }

  // ============================================================================
  // Get Single Plan Interest
  // ============================================================================

  async getPlanInterest(id: string): Promise<LeadPlanInterestWithPlan | null> {
    const { data, error } = await this.supabase
      .from('crm_lead_plan_interests')
      .select(`
        id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by,
        plan:plans(id, name, slug, tier, features)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[PlanInterestService] Failed to get plan interest:', error);
      throw new Error(`Failed to get plan interest: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Create Plan Interest
  // ============================================================================

  async createPlanInterest(input: LeadPlanInterestCreateInput): Promise<LeadPlanInterest> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_lead_plan_interests')
      .insert({
        lead_id: input.lead_id,
        plan_id: input.plan_id,
        plan_name: input.plan_name,
        plan_code: input.plan_code,
        family_size: input.family_size,
        interest_level: input.interest_level || 'interested',
        quoted_monthly_rate: input.quoted_monthly_rate,
        quoted_at: input.quoted_at,
        quote_valid_until: input.quote_valid_until,
        primary_age: input.primary_age,
        spouse_age: input.spouse_age,
        dependent_ages: input.dependent_ages,
        source: input.source || 'manual',
        source_quote_id: input.source_quote_id,
        notes: input.notes,
        created_by: user?.id,
      })
      .select('id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[PlanInterestService] Failed to create plan interest:', error);
      throw new Error(`Failed to create plan interest: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Update Plan Interest
  // ============================================================================

  async updatePlanInterest(
    id: string,
    input: LeadPlanInterestUpdateInput
  ): Promise<LeadPlanInterest> {
    const { data, error } = await this.supabase
      .from('crm_lead_plan_interests')
      .update({
        interest_level: input.interest_level,
        quoted_monthly_rate: input.quoted_monthly_rate,
        quoted_at: input.quoted_at,
        quote_valid_until: input.quote_valid_until,
        primary_age: input.primary_age,
        spouse_age: input.spouse_age,
        dependent_ages: input.dependent_ages,
        notes: input.notes,
      })
      .eq('id', id)
      .select('id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[PlanInterestService] Failed to update plan interest:', error);
      throw new Error(`Failed to update plan interest: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Delete Plan Interest
  // ============================================================================

  async deletePlanInterest(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('crm_lead_plan_interests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[PlanInterestService] Failed to delete plan interest:', error);
      throw new Error(`Failed to delete plan interest: ${error.message}`);
    }
  }

  // ============================================================================
  // Update Interest Level (Quick Action)
  // ============================================================================

  async updateInterestLevel(
    id: string,
    interestLevel: LeadPlanInterest['interest_level']
  ): Promise<LeadPlanInterest> {
    return this.updatePlanInterest(id, { interest_level: interestLevel });
  }

  // ============================================================================
  // Add Quote to Interest
  // ============================================================================

  async addQuoteToInterest(
    id: string,
    monthlyRate: number,
    validDays: number = 30
  ): Promise<LeadPlanInterest> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    return this.updatePlanInterest(id, {
      interest_level: 'quoted',
      quoted_monthly_rate: monthlyRate,
      quoted_at: new Date().toISOString(),
      quote_valid_until: validUntil.toISOString(),
    });
  }

  // ============================================================================
  // Get Available Health Plans
  // ============================================================================

  async getAvailableHealthPlans(): Promise<AvailableHealthPlan[]> {
    const { data, error } = await this.supabase
      .rpc('get_available_health_plans');

    if (error) {
      // Fallback to direct query if RPC not available
      console.warn('[PlanInterestService] RPC not available, using direct query');
      return this.getAvailableHealthPlansDirect();
    }

    return (data || []) as any;
  }

  private async getAvailableHealthPlansDirect(): Promise<AvailableHealthPlan[]> {
    const { data, error } = await this.supabase
      .from('plans')
      .select(`
        id,
        name,
        slug,
        tier,
        features
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('[PlanInterestService] Failed to get available plans:', error);
      throw new Error(`Failed to get available plans: ${error.message}`);
    }

    // Get pricing for each plan
    const plansWithPricing = await Promise.all(
      (data || []).map(async (plan) => {
        const { data: pricing } = await this.supabase
          .from('plan_pricing')
          .select('monthly_contribution')
          .eq('plan_id', plan.id)
          .eq('member_type', 'individual')
          .lte('effective_date', new Date().toISOString().split('T')[0])
          .order('effective_date', { ascending: false })
          .limit(1)
          .single();

        return {
          ...plan,
          monthly_contribution: pricing?.monthly_contribution || null,
        };
      })
    );

    return plansWithPricing;
  }

  // ============================================================================
  // Get Plan Interest Statistics
  // ============================================================================

  async getPlanInterestStats(): Promise<{
    total: number;
    byInterestLevel: Record<string, number>;
    byPlan: Array<{ plan_name: string; count: number }>;
  }> {
    // Get total count
    const { count: total } = await this.supabase
      .from('crm_lead_plan_interests')
      .select('id', { count: 'exact', head: true });

    // Get by interest level
    const { data: levelData } = await this.supabase
      .from('crm_lead_plan_interests')
      .select('interest_level');

    const byInterestLevel: Record<string, number> = {};
    (levelData || []).forEach((item) => {
      byInterestLevel[item.interest_level] = (byInterestLevel[item.interest_level] || 0) + 1;
    });

    // Get by plan
    const { data: planData } = await this.supabase
      .from('crm_lead_plan_interests')
      .select('plan_name');

    const planCounts: Record<string, number> = {};
    (planData || []).forEach((item) => {
      planCounts[item.plan_name] = (planCounts[item.plan_name] || 0) + 1;
    });

    const byPlan = Object.entries(planCounts)
      .map(([plan_name, count]) => ({ plan_name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: total || 0,
      byInterestLevel,
      byPlan,
    };
  }

  // ============================================================================
  // Query Plan Interests with Filters
  // ============================================================================

  async queryPlanInterests(
    filters: PlanInterestFilters,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ data: LeadPlanInterestWithPlan[]; total: number }> {
    let query = this.supabase
      .from('crm_lead_plan_interests')
      .select(`
        id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by,
        plan:plans(id, name, slug, tier, features)
      `, { count: 'exact' });

    // Apply filters
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters.plan_id) {
      query = query.eq('plan_id', filters.plan_id);
    }
    if (filters.family_size) {
      query = query.eq('family_size', filters.family_size);
    }
    if (filters.interest_level) {
      query = query.eq('interest_level', filters.interest_level);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.hasQuote !== undefined) {
      if (filters.hasQuote) {
        query = query.not('quoted_monthly_rate', 'is', null);
      } else {
        query = query.is('quoted_monthly_rate', null);
      }
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false });
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[PlanInterestService] Failed to query plan interests:', error);
      throw new Error(`Failed to query plan interests: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // ============================================================================
  // Bulk Add Plan Interests
  // ============================================================================

  async bulkAddPlanInterests(
    leadId: string,
    plans: Array<{
      plan_id?: string;
      plan_name: string;
      plan_code?: string;
      family_size: LeadPlanInterest['family_size'];
    }>,
    source: LeadPlanInterest['source'] = 'manual'
  ): Promise<LeadPlanInterest[]> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_lead_plan_interests')
      .insert(
        plans.map((plan) => ({
          lead_id: leadId,
          plan_id: plan.plan_id,
          plan_name: plan.plan_name,
          plan_code: plan.plan_code,
          family_size: plan.family_size,
          interest_level: 'interested',
          source,
          created_by: user?.id,
        }))
      )
      .select('id, lead_id, plan_id, plan_name, plan_code, family_size, interest_level, quoted_monthly_rate, quoted_at, quote_valid_until, primary_age, spouse_age, dependent_ages, source, source_quote_id, notes, created_at, updated_at, created_by');

    if (error) {
      console.error('[PlanInterestService] Failed to bulk add plan interests:', error);
      throw new Error(`Failed to bulk add plan interests: ${error.message}`);
    }

    return (data || []) as any;
  }
}

// Factory function
export function createPlanInterestService(supabase: SupabaseClient): PlanInterestService {
  return new PlanInterestService(supabase);
}
