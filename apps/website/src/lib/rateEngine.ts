import { RateCalculatorInput, RateEstimate } from './schema';
// @ts-ignore - path alias resolved by bundler
import rateTablesConfig from '@/content/rate_tables.config.json';

// Type definitions for the rate table configuration
interface RateTablesConfig {
  version: string;
  schema: string;
  dimensions: {
    product: string[];
    state: string;
    age_band: string;
    tobacco: string[];
  };
  rate_tables: Record<string, Record<string, number>>;
}

// Load configuration
const config = rateTablesConfig as RateTablesConfig;

// Fallback rate tables (temporary until actual rates are populated)
const fallbackRateTables: Record<string, Record<string, number>> = {
  'Essentials': {
    '18-29': 95,
    '30-39': 125,
    '40-49': 165,
    '50-59': 215,
    '60-64': 285
  },
  'MEC+ Essentials': {
    '18-29': 115,
    '30-39': 145,
    '40-49': 185,
    '50-59': 235,
    '60-64': 305
  },
  'Care Plus': {
    '18-29': 135,
    '30-39': 165,
    '40-49': 205,
    '50-59': 255,
    '60-64': 325
  },
  'Direct': {
    '18-29': 155,
    '30-39': 185,
    '40-49': 225,
    '50-59': 275,
    '60-64': 345
  },
  'Secure HSA': {
    '18-29': 85,
    '30-39': 115,
    '40-49': 155,
    '50-59': 205,
    '60-64': 275
  }
};

const stateModifiers: Record<string, number> = {
  AL: 0.98, AK: 1.05, AZ: 1.02, AR: 0.97, CA: 1.05, CO: 1.00, CT: 1.04,
  DE: 1.03, FL: 1.02, GA: 1.01, HI: 1.06, ID: 0.96, IL: 1.03, IN: 0.98,
  IA: 0.97, KS: 0.98, KY: 0.97, LA: 0.99, ME: 1.02, MD: 1.04, MA: 1.05,
  MI: 1.01, MN: 1.02, MS: 0.96, MO: 0.98, MT: 0.97, NE: 0.97, NV: 1.03,
  NH: 1.03, NJ: 1.05, NM: 0.98, NY: 1.06, NC: 1.00, ND: 0.96, OH: 0.99,
  OK: 0.97, OR: 1.03, PA: 1.02, RI: 1.04, SC: 0.99, SD: 0.96, TN: 0.98,
  TX: 1.01, UT: 0.98, VT: 1.03, VA: 1.02, WA: 1.04, WV: 0.97, WI: 1.00, WY: 0.97
};

// Map plan IDs to display names
const planIdToDisplayName = {
  'essentials': 'Essentials',
  'mec-essentials': 'MEC+ Essentials',
  'care-plus': 'Care Plus',
  'direct': 'Direct',
  'secure-hsa': 'Secure HSA'
};

function getAgeBand(age: number): string {
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 39) return '30-39';
  if (age >= 40 && age <= 49) return '40-49';
  if (age >= 50 && age <= 59) return '50-59';
  if (age >= 60 && age <= 64) return '60-64';
  return '30-39'; // fallback
}

function getBaseRate(planId: string, age: number): number {
  const displayName = planIdToDisplayName[planId as keyof typeof planIdToDisplayName];
  const ageBand = getAgeBand(age);
  
  // Try to get rate from config first (if populated), otherwise use fallback
  const rateTables: Record<string, Record<string, number>> = Object.keys(config.rate_tables).length > 0 
    ? config.rate_tables 
    : fallbackRateTables;
  
  const planRates = rateTables[displayName];
  if (!planRates) {
    console.warn(`No rates found for plan: ${displayName}, using fallback`);
    return 125; // Default fallback rate
  }
  
  const rate = planRates[ageBand];
  if (!rate) {
    console.warn(`No rate found for age band ${ageBand} in plan ${displayName}`);
    return 125; // Default fallback rate
  }
  
  return rate;
}

export function estimateMonthly(input: RateCalculatorInput): RateEstimate {
  const lineItems: Array<{ description: string; amount: number }> = [];
  
  // Primary member base rate
  const primaryBase = getBaseRate(input.selectedPlan, input.primaryAge);
  lineItems.push({
    description: `Primary member (Age ${input.primaryAge})`,
    amount: primaryBase
  });
  
  let total = primaryBase;
  
  // Spouse rate
  if ((input.householdType === 'member-spouse' || input.householdType === 'member-family') && input.spouseAge) {
    const spouseBase = getBaseRate(input.selectedPlan, input.spouseAge);
    lineItems.push({
      description: `Spouse (Age ${input.spouseAge})`,
      amount: spouseBase
    });
    total += spouseBase;
  }
  
  // Dependents
  if (input.dependentsCount > 0) {
    const dependentRate = 65; // Fixed rate per child
    const dependentTotal = dependentRate * input.dependentsCount;
    lineItems.push({
      description: `${input.dependentsCount} dependent${input.dependentsCount > 1 ? 's' : ''}`,
      amount: dependentTotal
    });
    total += dependentTotal;
  }
  
  // Tobacco surcharge
  let tobaccoSurcharge = 0;
  if (input.primaryTobacco) {
    const surcharge = Math.round(primaryBase * 0.15);
    tobaccoSurcharge += surcharge;
    lineItems.push({
      description: 'Tobacco surcharge (Primary)',
      amount: surcharge
    });
  }
  
  if (input.spouseTobacco && input.spouseAge) {
    const spouseBase = getBaseRate(input.selectedPlan, input.spouseAge);
    const surcharge = Math.round(spouseBase * 0.15);
    tobaccoSurcharge += surcharge;
    lineItems.push({
      description: 'Tobacco surcharge (Spouse)', 
      amount: surcharge
    });
  }
  
  total += tobaccoSurcharge;
  
  // State modifier
  const stateModifier = stateModifiers[input.state] || 1.0;
  if (stateModifier !== 1.0) {
    const adjustment = Math.round(total * (stateModifier - 1));
    if (adjustment !== 0) {
      lineItems.push({
        description: `${input.state} state adjustment`,
        amount: adjustment
      });
      total += adjustment;
    }
  }
  
  const result: RateEstimate = {
    total: Math.round(total),
    lineItems,
    disclaimer: 'Estimates are informational and not insurance. Final sharing levels and eligibility are determined during enrollment. This is not a binding quote.'
  };
  
  // Add comparison if current monthly cost is provided
  if (typeof input.currentMonthly === 'number' && input.currentMonthly > 0) {
    const current = input.currentMonthly;
    const deltaMonthly = current - result.total;
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
}

// Utility functions for configuration management
export function getAvailablePlans(): string[] {
  return config.dimensions.product;
}

export function getConfigurationVersion(): string {
  return config.version;
}

export function isRateTablesPopulated(): boolean {
  return Object.keys(config.rate_tables).length > 0;
}

// Admin utility to update rate tables (for future use)
export function updateRateTable(product: string, ageBand: string, state: string, tobacco: string, rate: number): void {
  const key = `${product}|${state}|${ageBand}|${tobacco}`;
  if (!config.rate_tables[product]) {
    config.rate_tables[product] = {};
  }
  // This would require a way to persist back to the JSON file
  log.info(`Rate update requested: ${key} = ${rate}`);
}

// Simple unit tests (updated to work with new structure)
export function __tests__() {
  log.info('Running rate engine tests with configuration...');
  log.info(`Configuration version: ${getConfigurationVersion()}`);
  log.info(`Available plans: ${getAvailablePlans().join(', ')}`);
  log.info(`Rate tables populated: ${isRateTablesPopulated()}`);
  
  // Test basic individual rate
  const test1 = estimateMonthly({
    state: 'CO',
    householdType: 'member-only',
    primaryAge: 35,
    dependentsCount: 0,
    primaryTobacco: false,
    spouseTobacco: false,
    selectedPlan: 'essentials'
  });
  console.assert(test1.total === 125, `Expected 125, got ${test1.total}`);
  
  // Test couple with tobacco
  const test2 = estimateMonthly({
    state: 'FL',
    householdType: 'member-spouse', 
    primaryAge: 45,
    spouseAge: 42,
    dependentsCount: 0,
    primaryTobacco: true,
    spouseTobacco: false,
    selectedPlan: 'essentials'
  });
  const expectedBase = 165 + 165; // Both in 40-49 band
  const expectedTobacco = Math.round(165 * 0.15); // 15% surcharge on primary
  const expectedState = Math.round((expectedBase + expectedTobacco) * 0.02); // 2% FL adjustment
  const expectedTotal = expectedBase + expectedTobacco + expectedState;
  console.assert(test2.total === expectedTotal, `Expected ${expectedTotal}, got ${test2.total}`);
  
  log.info('Rate engine tests completed');
}