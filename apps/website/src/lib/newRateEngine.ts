import { RateCalculatorInput, RateEstimate, RateOptions, ComparisonCalculatorInput } from './schema';
import { 
  estimateMonthly as estimateMonthlyV2, 
  getBenefitTiersForPlan as getBenefitTiersV2,
  getConfigurationVersion as getConfigurationVersionV2
} from './newRateEngine.v2';
import { lookupPrice } from './pricingService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('NewRateEngine');

// Re-export types for backward compatibility
export interface BenefitTier {
  id: string;
  displayLabel: string;
  iua: string;
}

// Types for multi-plan comparison
export interface TierEstimate {
  tierId: string;
  tierLabel: string;
  iua: string;
  monthly: number;
}

export interface PlanEstimate {
  planId: string;
  planLabel: string;
  description: string;
  tiers: TierEstimate[];
  flatRate?: number; // For plans without IUA tiers (essentials, mec-essentials)
  lowestPrice: number;
  highestPrice: number;
  popular?: boolean;
  hsaCompatible?: boolean;
  enrollUrl?: string;
}

export interface AllMembershipsEstimate {
  plans: PlanEstimate[];
  inputSummary: {
    householdType: string;
    primaryAge: number;
    spouseAge?: number;
    dependentsCount: number;
    state: string;
  };
}

// Plans supported by the v2 rate engine (with IUA tiers)
const _V2_SUPPORTED_PLANS = ['care-plus', 'direct', 'secure-hsa'];

// Plans that use flat-rate pricing from pricingData.ts
const FLAT_RATE_PLANS = ['essentials', 'mec-essentials'];

/**
 * Calculate monthly estimate using the v2 rate engine for IUA-based plans,
 * or the legacy pricing service for flat-rate plans (essentials, mec-essentials)
 * 
 * This properly handles all 4 membership types:
 * - MemberOnly (individual)
 * - MemberSpouse (couple)
 * - MemberChild (single parent with children)
 * - MemberFamily (couple with children)
 */
export function estimateMonthly(input: RateCalculatorInput, opts?: RateOptions): RateEstimate {
  log.info('[RateEngine] Calculating estimate for:', {
    plan: input.selectedPlan,
    householdType: input.householdType,
    primaryAge: input.primaryAge,
    benefitTier: input.benefitTier,
    dependentsCount: input.dependentsCount,
    spouseAge: input.spouseAge
  });

  // Use legacy pricing service for flat-rate plans (essentials, mec-essentials)
  if (FLAT_RATE_PLANS.includes(input.selectedPlan)) {
    log.info('[RateEngine] Using legacy pricing for flat-rate plan:', input.selectedPlan);
    
    const pricingResult = lookupPrice({
      planId: input.selectedPlan,
      householdType: input.householdType,
      primaryAge: input.primaryAge,
      primaryTobacco: input.primaryTobacco,
      spouseTobacco: input.spouseTobacco,
      benefitTier: input.benefitTier
    });

    if (pricingResult) {
      log.info('[RateEngine] Legacy pricing result:', {
        total: pricingResult.totalMonthly,
        breakdown: pricingResult.breakdown.length
      });
      
      return {
        total: Math.round(pricingResult.totalMonthly),
        lineItems: pricingResult.breakdown.map(item => ({
          description: item.description,
          amount: item.amount
        })),
        disclaimer: 'Rates are estimates and may vary. Final sharing levels and eligibility are determined during enrollment.'
      };
    }
    
    // Fallback if legacy pricing fails
    console.error('[RateEngine] Legacy pricing lookup failed for:', input.selectedPlan);
    return {
      total: 0,
      lineItems: [{
        description: 'Pricing not available for selected options',
        amount: 0
      }],
      disclaimer: 'Unable to calculate rate. Please contact us for assistance.'
    };
  }

  // Use v2 engine for IUA-based plans (care-plus, direct, secure-hsa)
  try {
    const result = estimateMonthlyV2(input, opts);
    log.info('[RateEngine] Pricing result:', {
      total: result.total,
      lineItems: result.lineItems.length
    });
    return result;
  } catch (error) {
    console.error('[RateEngine] Failed to get pricing result:', error);
    return {
      total: 0,
      lineItems: [{
        description: 'Pricing not available for selected options',
        amount: 0
      }],
      disclaimer: 'Unable to calculate rate. Please contact us for assistance.'
    };
  }
}

/**
 * Get available benefit tiers (IUA levels) for a plan
 * Returns tiers with id (IUA value like "1250"), displayLabel, and iua
 */
export function getBenefitTiersForPlan(planId: string): BenefitTier[] {
  // v2 engine only supports care-plus, direct, secure-hsa
  const v2SupportedPlans = ['care-plus', 'direct', 'secure-hsa'];
  
  if (v2SupportedPlans.includes(planId)) {
    return getBenefitTiersV2(planId);
  }
  
  // For other plans (essentials, mec-essentials), return empty array
  // as they don't have IUA tiers
  return [];
}

export function getAvailablePlans(): string[] {
  return ['essentials', 'mec-essentials', 'care-plus', 'direct', 'secure-hsa'];
}

export function getConfigurationVersion(): string {
  return getConfigurationVersionV2();
}

// Plan metadata — from Membership Overview (Agent Resource) PDF
const PLAN_METADATA: Record<string, { label: string; description: string; popular?: boolean; hsaCompatible?: boolean; enrollUrl?: string }> = {
  'essentials': {
    label: 'Essentials',
    description: 'Hospital debt relief + $0 virtual care. No medical cost sharing.',
    enrollUrl: 'https://essentials.enrollmpb.com/'
  },
  'mec-essentials': {
    label: 'MEC+ Essentials',
    description: 'ACA MEC + Debt Dismissal + HSA. No medical cost sharing.',
    enrollUrl: 'https://mecplus.enrollmpb.com/'
  },
  'care-plus': {
    label: 'Care+',
    description: 'Medical cost sharing + virtual care + MPB Concierge',
    enrollUrl: 'https://careplus.enrollmpb.com/'
  },
  'direct': {
    label: 'Direct',
    description: 'Limited preventive sharing + medical cost sharing + virtual care',
    enrollUrl: 'https://direct.enrollmpb.com/'
  },
  'secure-hsa': {
    label: 'Secure HSA',
    description: 'Medical cost sharing + MEC + HSA + RX Valet',
    hsaCompatible: true,
    popular: true, // Best seller
    enrollUrl: 'https://securehsa.enrollmpb.com/'
  }
};

/**
 * Calculate monthly estimates for ALL available memberships at once
 * This allows users to compare all options with a single form submission
 */
export function estimateAllMemberships(input: ComparisonCalculatorInput, opts?: RateOptions): AllMembershipsEstimate {
  const allPlans = getAvailablePlans();
  const planEstimates: PlanEstimate[] = [];

  for (const planId of allPlans) {
    const metadata = PLAN_METADATA[planId] || { label: planId, description: '' };
    const tiers = getBenefitTiersForPlan(planId);
    
    if (tiers.length > 0) {
      // Plan has IUA tiers - calculate for each tier
      const tierEstimates: TierEstimate[] = [];
      
      for (const tier of tiers) {
        try {
          const result = estimateMonthly({
            ...input,
            selectedPlan: planId as RateCalculatorInput['selectedPlan'],
            benefitTier: tier.id
          }, opts);
          
          tierEstimates.push({
            tierId: tier.id,
            tierLabel: tier.displayLabel,
            iua: tier.iua,
            monthly: result.total
          });
        } catch (error) {
          console.error(`[RateEngine] Failed to calculate ${planId} tier ${tier.id}:`, error);
        }
      }
      
      if (tierEstimates.length > 0) {
        const prices = tierEstimates.map(t => t.monthly).filter(p => p > 0);
        planEstimates.push({
          planId,
          planLabel: metadata.label,
          description: metadata.description,
          tiers: tierEstimates,
          lowestPrice: Math.min(...prices),
          highestPrice: Math.max(...prices),
          popular: metadata.popular,
          hsaCompatible: metadata.hsaCompatible,
          enrollUrl: metadata.enrollUrl
        });
      }
    } else {
      // Flat rate plan (no IUA tiers)
      try {
        const result = estimateMonthly({
          ...input,
          selectedPlan: planId as RateCalculatorInput['selectedPlan'],
          benefitTier: undefined
        }, opts);
        
        planEstimates.push({
          planId,
          planLabel: metadata.label,
          description: metadata.description,
          tiers: [],
          flatRate: result.total,
          lowestPrice: result.total,
          highestPrice: result.total,
          popular: metadata.popular,
          hsaCompatible: metadata.hsaCompatible,
          enrollUrl: metadata.enrollUrl
        });
      } catch (error) {
        console.error(`[RateEngine] Failed to calculate flat rate for ${planId}:`, error);
      }
    }
  }

  return {
    plans: planEstimates,
    inputSummary: {
      householdType: input.householdType,
      primaryAge: input.primaryAge,
      spouseAge: input.spouseAge ?? undefined,
      dependentsCount: input.dependentsCount ?? 0,
      state: input.state
    }
  };
}
