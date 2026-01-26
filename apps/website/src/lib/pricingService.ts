import { PRICING_DATA, ProductPricing, BenefitTierPricing } from './pricingData';

// Support both legacy and new membership types
export type HouseholdType = 'individual' | 'couple' | 'family' | 'member-only' | 'member-spouse' | 'member-child' | 'member-family';

export interface PricingQuery {
  planId: string;
  householdType: HouseholdType;
  primaryAge: number;
  spouseAge?: number;
  benefitTier?: string;
  primaryTobacco?: boolean;
  spouseTobacco?: boolean;
  dependentsCount?: number;
}

export interface PricingResult {
  basePrice: number;
  enrollmentFee: number;
  annualMembershipFee: number;
  tobaccoSurcharge: number;
  totalMonthly: number;
  breakdown: PriceBreakdown[];
  benefitTier?: BenefitTierPricing;
}

export interface PriceBreakdown {
  description: string;
  amount: number;
  type: 'base' | 'enrollment' | 'annual' | 'tobacco' | 'dependent';
}

/**
 * Map new membership types to legacy householdType for pricing lookup
 */
function normalizeHouseholdType(householdType: HouseholdType): 'individual' | 'couple' | 'family' {
  switch (householdType) {
    case 'member-only':
    case 'individual':
      return 'individual';
    case 'member-spouse':
    case 'couple':
      return 'couple';
    case 'member-child':
    case 'member-family':
    case 'family':
      return 'family';
    default:
      return 'individual';
  }
}

/**
 * Get the display label for a membership type
 */
function getMembershipLabel(householdType: HouseholdType): string {
  switch (householdType) {
    case 'member-only':
    case 'individual':
      return 'Member Only';
    case 'member-spouse':
    case 'couple':
      return 'Member + Spouse';
    case 'member-child':
      return 'Member + Children';
    case 'member-family':
    case 'family':
      return 'Member + Family';
    default:
      return 'Member Only';
  }
}

export function lookupPrice(query: PricingQuery): PricingResult | null {
  const product = PRICING_DATA[query.planId];

  if (!product) {
    console.error(`[Pricing] No pricing data found for plan: ${query.planId}`, { availablePlans: Object.keys(PRICING_DATA) });
    return null;
  }

  const breakdown: PriceBreakdown[] = [];
  let totalMonthly = 0;

  // Normalize householdType for tier lookup
  const normalizedHouseholdType = normalizeHouseholdType(query.householdType);

  // For member-child, try to find Member + Children tier first (specific to some plans like mec-essentials)
  let selectedTier = query.householdType === 'member-child'
    ? product.benefitTiers.find(t => t.benefitLabel?.toLowerCase().includes('children') && t.benefitId === query.benefitTier)
    : product.benefitTiers.find(t => t.benefitId === query.benefitTier && t.householdType === normalizedHouseholdType);

  if (!selectedTier && query.benefitTier) {
    console.log(`[Pricing] Exact tier match not found, searching by benefitId only: ${query.benefitTier}`);
    selectedTier = product.benefitTiers.find(
      t => t.benefitId === query.benefitTier
    );
  }

  // For member-child without exact match, try to find Member + Children tier
  if (!selectedTier && query.householdType === 'member-child') {
    selectedTier = product.benefitTiers.find(
      t => t.benefitLabel?.toLowerCase().includes('children')
    );
  }

  if (!selectedTier) {
    // Find the cheapest tier (highest IUA = lowest monthly cost) for "Starting at" pricing
    console.log(`[Pricing] Tier not found by ID, finding lowest cost tier for household type: ${normalizedHouseholdType}`);
    const matchingTiers = product.benefitTiers.filter(
      t => t.householdType === normalizedHouseholdType
    );
    
    if (matchingTiers.length > 0) {
      // Sort by IUA value descending (highest IUA = lowest price)
      selectedTier = matchingTiers.sort((a, b) => {
        const aIUA = parseInt(a.iua.replace(/\$|,/g, '')) || 0;
        const bIUA = parseInt(b.iua.replace(/\$|,/g, '')) || 0;
        return bIUA - aIUA; // Descending order - highest IUA first
      })[0];
    }
  }

  if (!selectedTier) {
    console.log(`[Pricing] Using first available tier as fallback`);
    selectedTier = product.benefitTiers[0];
  }

  if (!selectedTier) {
    console.error(`[Pricing] No benefit tier found for plan ${query.planId}`, {
      query,
      availableTiers: product.benefitTiers.length
    });
    return null;
  }

  console.log(`[Pricing] Selected tier:`, {
    benefitId: selectedTier.benefitId,
    householdType: selectedTier.householdType,
    displayLabel: selectedTier.displayLabel
  });

  const primaryAgeRange = selectedTier.ageRanges.find(
    ar => query.primaryAge >= ar.ageMin && query.primaryAge <= ar.ageMax
  );

  if (!primaryAgeRange) {
    console.error(`[Pricing] No pricing for age ${query.primaryAge} in tier ${selectedTier.benefitId}`, {
      availableRanges: selectedTier.ageRanges.map(ar => `${ar.ageMin}-${ar.ageMax}`)
    });
    return null;
  }

  totalMonthly += primaryAgeRange.price;
  breakdown.push({
    description: `${selectedTier.displayLabel} - ${getMembershipLabel(query.householdType)}`,
    amount: primaryAgeRange.price,
    type: 'base',
  });

  // Tobacco/vape surcharge applies once per household when any member uses tobacco
  const hasAnyTobaccoUser = query.primaryTobacco || query.spouseTobacco;
  if (hasAnyTobaccoUser && product.tobaccoSurcharge > 0) {
    totalMonthly += product.tobaccoSurcharge;
    breakdown.push({
      description: 'Household tobacco/vape surcharge',
      amount: product.tobaccoSurcharge,
      type: 'tobacco',
    });
  }

  return {
    basePrice: primaryAgeRange.price,
    enrollmentFee: product.enrollmentFee,
    annualMembershipFee: product.annualMembershipFee,
    tobaccoSurcharge: product.tobaccoSurcharge,
    totalMonthly: Math.round(totalMonthly),
    breakdown,
    benefitTier: selectedTier,
  };
}

export function getBenefitTiersForPlan(planId: string): BenefitTierPricing[] {
  const product = PRICING_DATA[planId];
  if (!product) return [];

  const uniqueTiers = new Map<string, BenefitTierPricing>();

  for (const tier of product.benefitTiers) {
    if (tier.householdType === 'individual') {
      const key = tier.benefitId;
      if (!uniqueTiers.has(key)) {
        uniqueTiers.set(key, tier);
      }
    }
  }

  return Array.from(uniqueTiers.values()).sort((a, b) => {
    const aIUA = parseInt(a.iua.replace(/\$|,/g, '')) || 0;
    const bIUA = parseInt(b.iua.replace(/\$|,/g, '')) || 0;
    return aIUA - bIUA;
  });
}

export function getAvailablePlans(): string[] {
  return Object.keys(PRICING_DATA);
}

export function getProductInfo(planId: string): ProductPricing | undefined {
  return PRICING_DATA[planId];
}

export { type ProductPricing, type BenefitTierPricing, type AgePricing } from './pricingData';
