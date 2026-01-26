import { getPricingData, ProductPricing, BenefitTierPricing } from './csvPricingParser';

export interface PricingQuery {
  planId: string;
  householdType: 'individual' | 'couple' | 'family';
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

export function lookupPrice(query: PricingQuery): PricingResult | null {
  const pricingData = getPricingData();
  const product = pricingData.get(query.planId);

  if (!product) {
    console.warn(`No pricing found for plan: ${query.planId}`);
    return null;
  }

  const breakdown: PriceBreakdown[] = [];
  let basePrice = 0;
  let tobaccoTotal = 0;

  let selectedTier = product.benefitTiers.find(
    t => t.benefitId === query.benefitTier && t.householdType === query.householdType
  );

  if (!selectedTier) {
    selectedTier = product.benefitTiers.find(
      t => t.householdType === query.householdType && t.ageRanges.length > 0
    );
  }

  if (!selectedTier) {
    selectedTier = product.benefitTiers.find(
      t => t.householdType === 'individual' && t.ageRanges.length > 0
    );
  }

  if (!selectedTier) {
    console.warn(`No benefit tier found for plan ${query.planId} with household type ${query.householdType}`);
    return null;
  }

  const primaryAgeRange = selectedTier.ageRanges.find(
    ar => query.primaryAge >= ar.ageMin && query.primaryAge <= ar.ageMax && !ar.isSmoker
  );

  if (primaryAgeRange) {
    basePrice += primaryAgeRange.price;
    breakdown.push({
      description: `Primary member (Age ${query.primaryAge})`,
      amount: primaryAgeRange.price,
      type: 'base',
    });
  } else {
    console.warn(`No pricing for age ${query.primaryAge} in tier ${selectedTier.benefitId}`);
    return null;
  }

  if (query.householdType === 'couple' && query.spouseAge) {
    const spouseAgeRange = selectedTier.ageRanges.find(
      ar => query.spouseAge! >= ar.ageMin && query.spouseAge! <= ar.ageMax && !ar.isSmoker
    );

    if (spouseAgeRange) {
      breakdown.push({
        description: `Spouse (Age ${query.spouseAge})`,
        amount: spouseAgeRange.price,
        type: 'base',
      });
    }
  }

  if (query.householdType === 'family' && query.spouseAge) {
    const spouseAgeRange = selectedTier.ageRanges.find(
      ar => query.spouseAge! >= ar.ageMin && query.spouseAge! <= ar.ageMax && !ar.isSmoker
    );

    if (spouseAgeRange) {
      breakdown.push({
        description: `Spouse (Age ${query.spouseAge})`,
        amount: spouseAgeRange.price,
        type: 'base',
      });
    }
  }

  if (query.dependentsCount && query.dependentsCount > 0) {
    const dependentRate = 65;
    const dependentTotal = dependentRate * query.dependentsCount;
    breakdown.push({
      description: `${query.dependentsCount} dependent${query.dependentsCount > 1 ? 's' : ''}`,
      amount: dependentTotal,
      type: 'dependent',
    });
  }

  if (query.primaryTobacco && product.tobaccoSurcharge > 0) {
    tobaccoTotal += product.tobaccoSurcharge;
    breakdown.push({
      description: 'Tobacco surcharge (Primary)',
      amount: product.tobaccoSurcharge,
      type: 'tobacco',
    });
  }

  if (query.spouseTobacco && product.tobaccoSurcharge > 0 && (query.householdType === 'couple' || query.householdType === 'family')) {
    tobaccoTotal += product.tobaccoSurcharge;
    breakdown.push({
      description: 'Tobacco surcharge (Spouse)',
      amount: product.tobaccoSurcharge,
      type: 'tobacco',
    });
  }

  const totalMonthly = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    basePrice,
    enrollmentFee: product.enrollmentFee,
    annualMembershipFee: product.annualMembershipFee,
    tobaccoSurcharge: tobaccoTotal,
    totalMonthly,
    breakdown,
    benefitTier: selectedTier,
  };
}

export function getBenefitTiersForPlan(planId: string): BenefitTierPricing[] {
  const pricingData = getPricingData();
  const product = pricingData.get(planId);

  if (!product) return [];

  const uniqueTiers = new Map<string, BenefitTierPricing>();

  for (const tier of product.benefitTiers) {
    const key = `${tier.benefitId}-${tier.iua}`;
    if (!uniqueTiers.has(key)) {
      uniqueTiers.set(key, tier);
    }
  }

  return Array.from(uniqueTiers.values()).sort((a, b) => {
    const aIUA = parseInt(a.iua.replace(/\$|,/g, '')) || 0;
    const bIUA = parseInt(b.iua.replace(/\$|,/g, '')) || 0;
    return aIUA - bIUA;
  });
}

export function getAvailablePlans(): string[] {
  const pricingData = getPricingData();
  return Array.from(pricingData.keys());
}

export function getProductInfo(planId: string): ProductPricing | undefined {
  const pricingData = getPricingData();
  return pricingData.get(planId);
}
