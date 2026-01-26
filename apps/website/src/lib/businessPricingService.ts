import { BusinessRateCalculatorInput, BusinessRateEstimate } from './schema';
import { estimateMonthly } from './newRateEngine.v2';

export function estimateBusinessMonthly(input: BusinessRateCalculatorInput): BusinessRateEstimate {
  try {
    const rateResult = estimateMonthly({
      state: input.state,
      householdType: input.householdType,
      primaryAge: input.primaryAge,
      spouseAge: input.spouseAge,
      dependentsCount: input.dependentsCount,
      primaryTobacco: input.primaryTobacco,
      spouseTobacco: input.spouseTobacco,
      selectedPlan: input.selectedPlan,
      benefitTier: input.benefitTier,
    });

    const perEmployeeCost = Math.round(rateResult.total);
    const totalBusinessCost = perEmployeeCost * input.employeeCount;
    const annualBusinessCost = totalBusinessCost * 12;

    const lineItems = [
      {
        description: `${input.selectedPlan === 'mec-essentials' ? 'MEC+ Essentials' : 'Secure HSA'} - Per Employee`,
        amount: perEmployeeCost
      },
      ...rateResult.lineItems.slice(1).map(item => ({
        description: item.description,
        amount: item.amount * input.employeeCount
      })),
      {
        description: `Total for ${input.employeeCount} ${input.employeeCount === 1 ? 'Employee' : 'Employees'}`,
        amount: totalBusinessCost
      }
    ];

    const result: BusinessRateEstimate = {
      total: totalBusinessCost,
      perEmployeeCost,
      employeeCount: input.employeeCount,
      totalBusinessCost,
      annualBusinessCost,
      lineItems,
      disclaimer: input.selectedPlan === 'mec-essentials'
        ? 'MEC+ Essentials satisfies ACA employer mandate for applicable large employers. Estimates are informational. Final costs determined at enrollment.'
        : 'Secure HSA is HSA-compatible with potential tax advantages. 1099 or business ID required. Estimates are informational. Final costs determined at enrollment.'
    };

    if (typeof input.currentMonthly === 'number' && input.currentMonthly > 0) {
      const current = input.currentMonthly;
      const deltaMonthly = current - totalBusinessCost;
      const direction = deltaMonthly > 0 ? 'savings' : deltaMonthly < 0 ? 'increase' : 'same';
      const deltaAnnual = deltaMonthly * 12;

      result.comparison = {
        currentMonthly: current,
        deltaMonthly,
        deltaAnnual,
        direction
      };
    }

    return result;
  } catch (error) {
    console.error('[BusinessPricing] Failed to get pricing result:', error);
    return {
      total: 0,
      perEmployeeCost: 0,
      employeeCount: input.employeeCount,
      totalBusinessCost: 0,
      annualBusinessCost: 0,
      lineItems: [{
        description: 'Pricing not available for selected options',
        amount: 0
      }],
      disclaimer: 'Unable to calculate rate. Please contact us for assistance.'
    };
  }
}

export function compareBusinessPlans(input: Omit<BusinessRateCalculatorInput, 'selectedPlan' | 'benefitTier'>): {
  mecEssentials: BusinessRateEstimate;
  secureHSA: BusinessRateEstimate[];
} {
  const mecEssentialsResult = estimateBusinessMonthly({
    ...input,
    selectedPlan: 'mec-essentials',
  });

  // Use IUA values for v2 engine (1250, 2500, 5000)
  const secureHSATiers = ['1250', '2500', '5000'];
  const secureHSAResults = secureHSATiers.map(tier =>
    estimateBusinessMonthly({
      ...input,
      selectedPlan: 'secure-hsa',
      benefitTier: tier,
    })
  );

  return {
    mecEssentials: mecEssentialsResult,
    secureHSA: secureHSAResults,
  };
}
