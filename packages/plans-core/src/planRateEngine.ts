import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Plan,
  PlanPricing,
  RateEstimateInput,
  RateEstimate,
  AllPlansEstimate,
} from './planTypes';
import { MEMBER_TYPES, AGE_BANDS } from './planTypes';

// In-memory cache for pricing data to avoid repeated DB queries per page load
interface PricingCache {
  timestamp: number;
  plans: Plan[];
  pricing: Map<string, PlanPricing[]>;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function createPlanRateEngine(supabase: SupabaseClient) {
  let cache: PricingCache | null = null;

  // -----------------------------------------------------------------------
  // Load and cache all active plans and their current pricing
  // -----------------------------------------------------------------------
  async function loadPricingData(): Promise<PricingCache> {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return cache;
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch all active plans
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!plans || plans.length === 0) {
      cache = { timestamp: Date.now(), plans: [], pricing: new Map() };
      return cache;
    }

    // Fetch all pricing rows for active plans (current and past effective dates)
    const planIds = plans.map((p: Plan) => p.id);
    const { data: allPricing } = await supabase
      .from('plan_pricing')
      .select('*')
      .in('plan_id', planIds)
      .lte('effective_date', today)
      .order('effective_date', { ascending: false });

    // Group pricing by plan_id and keep only latest effective_date per plan
    const pricingMap = new Map<string, PlanPricing[]>();
    if (allPricing) {
      const latestDatePerPlan = new Map<string, string>();

      for (const row of allPricing as PlanPricing[]) {
        if (!latestDatePerPlan.has(row.plan_id)) {
          latestDatePerPlan.set(row.plan_id, row.effective_date);
        }
      }

      for (const row of allPricing as PlanPricing[]) {
        if (row.effective_date === latestDatePerPlan.get(row.plan_id)) {
          if (!pricingMap.has(row.plan_id)) {
            pricingMap.set(row.plan_id, []);
          }
          pricingMap.get(row.plan_id)!.push(row);
        }
      }
    }

    cache = {
      timestamp: Date.now(),
      plans: plans as Plan[],
      pricing: pricingMap,
    };

    return cache;
  }

  // -----------------------------------------------------------------------
  // Invalidate cache (call after admin pricing changes)
  // -----------------------------------------------------------------------
  function invalidateCache(): void {
    cache = null;
  }

  // -----------------------------------------------------------------------
  // Find age band label for a given age
  // -----------------------------------------------------------------------
  function getAgeBand(age: number): string {
    for (const band of AGE_BANDS) {
      if (age >= band.min && age <= band.max) {
        return band.label;
      }
    }
    return 'unknown';
  }

  // -----------------------------------------------------------------------
  // Estimate monthly rate for a single plan
  // -----------------------------------------------------------------------
  async function estimateMonthly(
    input: RateEstimateInput
  ): Promise<RateEstimate | null> {
    const data = await loadPricingData();

    const plan = data.plans.find((p) => p.slug === input.planSlug);
    if (!plan) return null;

    const planPricing = data.pricing.get(plan.id) || [];

    // Find matching pricing row
    const match = planPricing.find(
      (row) =>
        row.member_type === input.memberType &&
        input.age >= row.age_min &&
        input.age <= row.age_max &&
        (input.iuaAmount == null
          ? row.iua_amount == null
          : Number(row.iua_amount) === Number(input.iuaAmount))
    );

    if (!match) return null;

    const monthlyContribution = Number(match.monthly_contribution);
    const tobaccoSurcharge =
      input.usesTobacco && plan.tobacco_surcharge_pct > 0
        ? plan.tobacco_surcharge_pct
        : 0;

    const totalMonthly = monthlyContribution + tobaccoSurcharge;

    return {
      planId: plan.id,
      planName: plan.name,
      planSlug: plan.slug,
      monthlyContribution,
      tobaccoSurcharge,
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      enrollmentFee: Number(plan.enrollment_fee) || 0,
      annualMembershipFee: Number(plan.annual_membership_fee) || 0,
      memberType: input.memberType,
      iuaAmount: input.iuaAmount ?? null,
      ageBand: getAgeBand(input.age),
    };
  }

  // -----------------------------------------------------------------------
  // Estimate all memberships across all active plans for comparison
  // -----------------------------------------------------------------------
  async function estimateAllMemberships(input: {
    age: number;
    memberType: string;
    usesTobacco?: boolean;
  }): Promise<AllPlansEstimate[]> {
    const data = await loadPricingData();
    const results: AllPlansEstimate[] = [];

    for (const plan of data.plans) {
      const planPricing = data.pricing.get(plan.id) || [];

      // Get unique IUA amounts for this plan
      const iuaAmounts = [
        ...new Set(planPricing.map((r) => r.iua_amount)),
      ].sort((a, b) => (Number(a) || 0) - (Number(b) || 0));

      const estimates: RateEstimate[] = [];

      for (const iua of iuaAmounts) {
        const match = planPricing.find(
          (row) =>
            row.member_type === input.memberType &&
            input.age >= row.age_min &&
            input.age <= row.age_max &&
            (iua == null
              ? row.iua_amount == null
              : Number(row.iua_amount) === Number(iua))
        );

        if (match) {
          const monthlyContribution = Number(match.monthly_contribution);
          const tobaccoSurcharge =
            input.usesTobacco && plan.tobacco_surcharge_pct > 0
              ? plan.tobacco_surcharge_pct
              : 0;
          const totalMonthly = monthlyContribution + tobaccoSurcharge;

          estimates.push({
            planId: plan.id,
            planName: plan.name,
            planSlug: plan.slug,
            monthlyContribution,
            tobaccoSurcharge,
            totalMonthly,
            totalAnnual: totalMonthly * 12,
            enrollmentFee: Number(plan.enrollment_fee) || 0,
            annualMembershipFee: Number(plan.annual_membership_fee) || 0,
            memberType: input.memberType,
            iuaAmount: iua,
            ageBand: getAgeBand(input.age),
          });
        }
      }

      if (estimates.length > 0) {
        results.push({
          planSlug: plan.slug,
          planName: plan.name,
          planType: plan.plan_type,
          isActive: plan.is_active,
          estimates,
        });
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Get full pricing matrix for a plan (all member types, age bands, IUAs)
  // -----------------------------------------------------------------------
  async function getPricingMatrix(planSlug: string): Promise<{
    plan: Plan;
    iuaOptions: (number | null)[];
    matrix: Record<
      string,
      Record<string, Record<string, number>>
    >;
  } | null> {
    const data = await loadPricingData();
    const plan = data.plans.find((p) => p.slug === planSlug);
    if (!plan) return null;

    const planPricing = data.pricing.get(plan.id) || [];
    const iuaOptions = [
      ...new Set(planPricing.map((r) => r.iua_amount)),
    ].sort((a, b) => (Number(a) || 0) - (Number(b) || 0));

    // Build matrix: iua -> memberType -> ageBand -> price
    const matrix: Record<string, Record<string, Record<string, number>>> = {};

    for (const row of planPricing) {
      const iuaKey = row.iua_amount != null ? String(row.iua_amount) : 'flat';
      const ageBand = `${row.age_min}-${row.age_max}`;

      if (!matrix[iuaKey]) matrix[iuaKey] = {};
      if (!matrix[iuaKey][row.member_type]) matrix[iuaKey][row.member_type] = {};
      matrix[iuaKey][row.member_type][ageBand] = Number(row.monthly_contribution);
    }

    return { plan, iuaOptions, matrix };
  }

  return {
    estimateMonthly,
    estimateAllMemberships,
    getPricingMatrix,
    invalidateCache,
    loadPricingData,
    getAgeBand,
  };
}

export type PlanRateEngineInstance = ReturnType<typeof createPlanRateEngine>;
