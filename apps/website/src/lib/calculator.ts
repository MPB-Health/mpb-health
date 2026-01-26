// Cost estimation logic for health sharing calculator
export interface HouseholdMember {
  age: number;
  tier: 'adult' | 'senior' | 'child';
}

export interface CalculatorInputs {
  householdSize: number;
  members: HouseholdMember[];
  membershipLevel: 'essential' | 'premier' | 'elite';
}

export interface CalculatorResult {
  monthlyShare: number;
  annualIncident: number;
  estimatedSavings: number;
  comparedToInsurance: number;
}

export const calculateCosts = (inputs: CalculatorInputs): CalculatorResult => {
  // Base rates by membership tier
  const baseRates = {
    essential: { adult: 189, senior: 229, child: 89 },
    premier: { adult: 279, senior: 319, child: 129 },
    elite: { adult: 369, senior: 409, child: 169 },
  };

  // Annual incident amounts
  const annualIncidents = {
    essential: 2500,
    premier: 1500,
    elite: 1000,
  };

  // Calculate monthly share based on household composition
  let monthlyShare = 0;
  
  inputs.members.forEach(member => {
    monthlyShare += baseRates[inputs.membershipLevel][member.tier];
  });

  // Apply household discount for families
  if (inputs.householdSize >= 3) {
    monthlyShare *= 0.85; // 15% family discount
  } else if (inputs.householdSize === 2) {
    monthlyShare *= 0.92; // 8% couples discount
  }

  // Estimate traditional insurance cost for comparison
  const avgInsuranceCost = inputs.householdSize * 450; // Average individual insurance
  const estimatedSavings = avgInsuranceCost - monthlyShare;
  const comparedToInsurance = (estimatedSavings / avgInsuranceCost) * 100;

  return {
    monthlyShare: Math.round(monthlyShare),
    annualIncident: annualIncidents[inputs.membershipLevel],
    estimatedSavings: Math.round(estimatedSavings),
    comparedToInsurance: Math.round(comparedToInsurance),
  };
};

export const getAgeBasedTier = (age: number): HouseholdMember['tier'] => {
  if (age < 18) return 'child';
  if (age >= 65) return 'senior';
  return 'adult';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};