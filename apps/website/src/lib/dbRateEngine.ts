/**
 * Database-backed rate engine for the website.
 * 
 * This replaces the hardcoded JSON/TS rate tables with live queries
 * to the plan_pricing table via @mpbhealth/plans-core.
 * 
 * Usage:
 *   import { dbEstimateMonthly, dbEstimateAllMemberships } from './dbRateEngine';
 * 
 * The functions match the signature of the original newRateEngine exports
 * so they can be swapped in with minimal changes.
 */

import { supabase } from './supabase';
import {
  createPlanRateEngine,
  createPlanService,
  MEMBER_TYPE_LABELS,
  type RateEstimate,
  type AllPlansEstimate,
} from '@mpbhealth/plans-core';
import type { RateCalculatorInput, RateEstimate as LegacyRateEstimate, RateOptions } from './schema';
import type { AllMembershipsEstimate, PlanEstimate, TierEstimate, BenefitTier } from './newRateEngine';
import { getHouseholdPricingAge } from './householdPricingAge';

const rateEngine = createPlanRateEngine(supabase);
const planService = createPlanService(supabase);

/**
 * Map website household types to plan_pricing member_type values
 */
function mapMemberType(householdType: string): string {
  switch (householdType) {
    case 'individual':
    case 'member-only':
      return 'individual';
    case 'couple':
    case 'member-spouse':
      return 'couple';
    case 'member-child':
      return 'member_child';
    case 'family':
    case 'member-family':
      return 'family';
    default:
      return 'individual';
  }
}

/**
 * Database-backed monthly estimate (same API as newRateEngine.estimateMonthly)
 */
export async function dbEstimateMonthly(
  input: RateCalculatorInput,
  _opts?: RateOptions
): Promise<LegacyRateEstimate> {
  const memberType = mapMemberType(input.householdType);
  const iuaAmount = input.benefitTier ? Number(input.benefitTier) : undefined;

  const result = await rateEngine.estimateMonthly({
    planSlug: input.selectedPlan,
    age: getHouseholdPricingAge(input),
    memberType,
    iuaAmount: iuaAmount && !isNaN(iuaAmount) ? iuaAmount : null,
    usesTobacco: input.primaryTobacco || input.spouseTobacco,
  });

  if (!result) {
    return {
      total: 0,
      lineItems: [{ description: 'Pricing not available for selected options', amount: 0 }],
      disclaimer: 'Unable to calculate rate. Please contact us for assistance.',
    };
  }

  const lineItems: { description: string; amount: number }[] = [
    {
      description: `${result.planName} - ${MEMBER_TYPE_LABELS[memberType] || memberType}`,
      amount: result.monthlyContribution,
    },
  ];

  if (result.tobaccoSurcharge > 0) {
    lineItems.push({
      description: 'Household tobacco/vape surcharge',
      amount: result.tobaccoSurcharge,
    });
  }

  return {
    total: Math.round(result.totalMonthly),
    lineItems,
    disclaimer:
      'Rates are estimates and may vary. Final sharing levels and eligibility are determined during enrollment.',
  };
}

/**
 * Database-backed comparison estimate (same API as newRateEngine.estimateAllMemberships)
 */
export async function dbEstimateAllMemberships(input: {
  householdType: string;
  primaryAge: number;
  spouseAge?: number | null;
  oldestDependentAge?: number | null;
  dependentsCount?: number | null;
  state: string;
  primaryTobacco?: boolean;
  spouseTobacco?: boolean;
}): Promise<AllMembershipsEstimate> {
  const memberType = mapMemberType(input.householdType);
  const usesTobacco = input.primaryTobacco || input.spouseTobacco;
  const pricingAge = getHouseholdPricingAge({
    primaryAge: input.primaryAge,
    spouseAge: input.spouseAge,
    oldestDependentAge: input.oldestDependentAge,
    dependentsCount: input.dependentsCount ?? 0,
  });

  const allEstimates = await rateEngine.estimateAllMemberships({
    age: pricingAge,
    memberType,
    usesTobacco,
  });

  // Also fetch plan metadata for labels, descriptions, etc.
  const planData = await rateEngine.loadPricingData();

  const planEstimates: PlanEstimate[] = allEstimates.map((planEst) => {
    const planInfo = planData.plans.find((p) => p.slug === planEst.planSlug);

    // If this plan has multiple estimates (IUA tiers), map them
    const tiers: TierEstimate[] = planEst.estimates
      .filter((e) => e.iuaAmount != null)
      .map((e) => ({
        tierId: String(e.iuaAmount),
        tierLabel: `$${Number(e.iuaAmount).toLocaleString()} IUA`,
        iua: `$${Number(e.iuaAmount).toLocaleString()}`,
        monthly: Math.round(e.totalMonthly),
      }));

    const flatEst = planEst.estimates.find((e) => e.iuaAmount == null);
    const allPrices = planEst.estimates.map((e) => e.totalMonthly).filter((p) => p > 0);

    return {
      planId: planEst.planSlug,
      planLabel: planInfo?.name || planEst.planName,
      description: planInfo?.tagline || '',
      tiers,
      flatRate: flatEst ? Math.round(flatEst.totalMonthly) : undefined,
      lowestPrice: allPrices.length > 0 ? Math.round(Math.min(...allPrices)) : 0,
      highestPrice: allPrices.length > 0 ? Math.round(Math.max(...allPrices)) : 0,
      popular: planEst.planSlug === 'care-plus',
      hsaCompatible: planInfo?.is_hsa_compatible ?? false,
      enrollUrl: planInfo?.enroll_url || undefined,
    };
  });

  return {
    plans: planEstimates,
    inputSummary: {
      householdType: input.householdType,
      primaryAge: input.primaryAge,
      pricingAge,
      oldestDependentAge: input.oldestDependentAge ?? undefined,
      spouseAge: input.spouseAge ?? undefined,
      dependentsCount: input.dependentsCount ?? 0,
      state: input.state,
    },
  };
}

/**
 * Database-backed benefit tiers lookup
 */
export async function dbGetBenefitTiersForPlan(planSlug: string): Promise<BenefitTier[]> {
  const matrix = await rateEngine.getPricingMatrix(planSlug);
  if (!matrix) return [];

  const tiers: BenefitTier[] = [];
  for (const iua of matrix.iuaOptions) {
    if (iua != null) {
      const iuaNum = Number(iua);
      tiers.push({
        id: String(iuaNum),
        displayLabel: `$${iuaNum.toLocaleString()} IUA`,
        iua: `$${iuaNum.toLocaleString()}`,
      });
    }
  }

  return tiers;
}

/**
 * Invalidate the rate engine cache (call after admin pricing changes)
 */
export function invalidateRateCache(): void {
  rateEngine.invalidateCache();
}
