import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Plan,
  PlanWithDetails,
  PlanWithFeatures,
  PlanCreateInput,
  PlanUpdateInput,
  PlanFilters,
  ServiceResult,
} from './planTypes';

/**
 * Sanitize a value for use inside a PostgREST filter string.
 * Escapes characters that have special meaning in PostgREST filter syntax
 * (commas, dots, parentheses, percent signs, backslashes, and asterisks)
 * to prevent filter-injection attacks.
 */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[\\%_*.,()]/g, (ch) => `\\${ch}`);
}

export function createPlanService(supabase: SupabaseClient) {
  // -----------------------------------------------------------------------
  // List plans with optional filters
  // -----------------------------------------------------------------------
  async function getPlans(
    filters: PlanFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ plans: Plan[]; total: number }> {
    let query = supabase.from('plans').select('id, slug, name, tagline, description, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, target_audience, sort_order, is_active, code, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct, currency, enroll_url, cost_basis, external_product_id, created_at, updated_at', { count: 'exact' });

    if (filters.search) {
      const safe = sanitizeFilterValue(filters.search);
      query = query.or(
        `name.ilike.%${safe}%,slug.ilike.%${safe}%,tagline.ilike.%${safe}%,description.ilike.%${safe}%`
      );
    }
    if (filters.plan_type) {
      query = query.eq('plan_type', filters.plan_type);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.target_audience) {
      const safeAudience = sanitizeFilterValue(filters.target_audience);
      query = query.ilike('target_audience', `%${safeAudience}%`);
    }

    query = query.order('sort_order').range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching plans:', error);
      return { plans: [], total: 0 };
    }
    return { plans: (data || []) as unknown as Plan[], total: count || 0 };
  }

  // -----------------------------------------------------------------------
  // Get active plans (for website display)
  // -----------------------------------------------------------------------
  async function getActivePlans(): Promise<PlanWithFeatures[]> {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, slug, name, tagline, description, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, target_audience, sort_order, is_active, code, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct, currency, enroll_url, cost_basis, external_product_id, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !plans) {
      console.error('Error fetching active plans:', error);
      return [];
    }

    const plansWithFeatures = await Promise.all(
      plans.map(async (plan: Plan) => {
        const { data: features } = await supabase
          .from('plan_features')
          .select('id, plan_id, category, feature_name, feature_value, cost, notes, sort_order, created_at')
          .eq('plan_id', plan.id)
          .order('sort_order');

        // Get starting price (lowest individual rate)
        const { data: pricing } = await supabase
          .from('plan_pricing')
          .select('monthly_contribution')
          .eq('plan_id', plan.id)
          .eq('member_type', 'individual')
          .order('monthly_contribution')
          .limit(1)
          .maybeSingle();

        const priceDisplay = pricing?.monthly_contribution
          ? `$${pricing.monthly_contribution}`
          : '$0';

        return {
          ...plan,
          features: features || [],
          price_display: priceDisplay,
        } as PlanWithFeatures;
      })
    );

    return plansWithFeatures;
  }

  // -----------------------------------------------------------------------
  // Get single plan by ID with all relations
  // -----------------------------------------------------------------------
  async function getPlan(id: string): Promise<PlanWithDetails | null> {
    const { data: plan, error } = await supabase
      .from('plans')
      .select('id, slug, name, tagline, description, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, target_audience, sort_order, is_active, code, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct, currency, enroll_url, cost_basis, external_product_id, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !plan) return null;

    const [featuresRes, pricingRes, sharingRes] = await Promise.all([
      supabase
        .from('plan_features')
        .select('id, plan_id, category, feature_name, feature_value, cost, notes, sort_order, created_at')
        .eq('plan_id', id)
        .order('sort_order'),
      supabase
        .from('plan_pricing')
        .select('id, plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date, created_at')
        .eq('plan_id', id)
        .order('effective_date', { ascending: false }),
      supabase
        .from('plan_sharing_details')
        .select('id, plan_id, has_lifetime_cap, has_annual_cap, preexisting_lookback_months, maternity_waiting_months, has_international_coverage, iua_options, created_at, updated_at')
        .eq('plan_id', id)
        .maybeSingle(),
    ]);

    return {
      ...plan,
      features: featuresRes.data || [],
      pricing: pricingRes.data || [],
      sharing_details: sharingRes.data || null,
    } as PlanWithDetails;
  }

  // -----------------------------------------------------------------------
  // Get plan by slug
  // -----------------------------------------------------------------------
  async function getPlanBySlug(slug: string): Promise<PlanWithDetails | null> {
    const { data: plan, error } = await supabase
      .from('plans')
      .select('id, slug, name, tagline, description, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, target_audience, sort_order, is_active, code, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct, currency, enroll_url, cost_basis, external_product_id, created_at, updated_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !plan) return null;

    const [featuresRes, pricingRes, sharingRes] = await Promise.all([
      supabase
        .from('plan_features')
        .select('id, plan_id, category, feature_name, feature_value, cost, notes, sort_order, created_at')
        .eq('plan_id', plan.id)
        .order('sort_order'),
      supabase
        .from('plan_pricing')
        .select('id, plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date, created_at')
        .eq('plan_id', plan.id)
        .order('effective_date', { ascending: false }),
      supabase
        .from('plan_sharing_details')
        .select('id, plan_id, has_lifetime_cap, has_annual_cap, preexisting_lookback_months, maternity_waiting_months, has_international_coverage, iua_options, created_at, updated_at')
        .eq('plan_id', plan.id)
        .maybeSingle(),
    ]);

    return {
      ...plan,
      features: featuresRes.data || [],
      pricing: pricingRes.data || [],
      sharing_details: sharingRes.data || null,
    } as PlanWithDetails;
  }

  // -----------------------------------------------------------------------
  // Create plan
  // -----------------------------------------------------------------------
  async function createPlan(
    input: PlanCreateInput
  ): Promise<ServiceResult<{ planId: string }>> {
    const { data, error } = await supabase
      .from('plans')
      .insert({
        slug: input.slug,
        name: input.name,
        tagline: input.tagline || null,
        description: input.description || null,
        plan_type: input.plan_type,
        is_medical_cost_sharing: input.is_medical_cost_sharing ?? false,
        is_mec_compliant: input.is_mec_compliant ?? false,
        is_hsa_compatible: input.is_hsa_compatible ?? false,
        target_audience: input.target_audience || null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
        code: input.code || null,
        enrollment_fee: input.enrollment_fee ?? 0,
        annual_membership_fee: input.annual_membership_fee ?? 0,
        tobacco_surcharge_pct: input.tobacco_surcharge_pct ?? 0,
        currency: input.currency ?? 'USD',
        enroll_url: input.enroll_url || null,
        cost_basis: input.cost_basis ?? null,
        external_product_id: input.external_product_id || null,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: { planId: data.id } };
  }

  // -----------------------------------------------------------------------
  // Update plan
  // -----------------------------------------------------------------------
  async function updatePlan(
    id: string,
    updates: PlanUpdateInput
  ): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Delete plan
  // -----------------------------------------------------------------------
  async function deletePlan(id: string): Promise<ServiceResult> {
    const { error } = await supabase.from('plans').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Toggle active status
  // -----------------------------------------------------------------------
  async function toggleActive(id: string): Promise<ServiceResult> {
    const { data: plan } = await supabase
      .from('plans')
      .select('is_active')
      .eq('id', id)
      .single();

    if (!plan) return { success: false, error: 'Plan not found' };

    const { error } = await supabase
      .from('plans')
      .update({ is_active: !plan.is_active })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Get distinct plan types
  // -----------------------------------------------------------------------
  async function getPlanTypes(): Promise<string[]> {
    const { data } = await supabase
      .from('plans')
      .select('plan_type')
      .order('plan_type');

    if (!data) return [];
    return [...new Set(data.map((d: { plan_type: string }) => d.plan_type))];
  }

  return {
    getPlans,
    getActivePlans,
    getPlan,
    getPlanBySlug,
    createPlan,
    updatePlan,
    deletePlan,
    toggleActive,
    getPlanTypes,
  };
}

export type PlanServiceInstance = ReturnType<typeof createPlanService>;
