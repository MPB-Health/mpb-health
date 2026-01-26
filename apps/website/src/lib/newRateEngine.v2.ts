import { RateCalculatorInput, RateEstimate, RateOptions, RateVersion } from './schema';
import rateTablesConfigV2 from '../../content/rate_tables.config.v2.json';

interface MembershipRates {
  MemberOnly: number;
  MemberSpouse: number;
  MemberChild: number;
  MemberFamily: number;
}

interface AgeBandRates {
  '18-29': MembershipRates;
  '30-49': MembershipRates;
  '50-64': MembershipRates;
}

interface IUARates {
  [iua: string]: AgeBandRates;
}

interface ProductConfig {
  iua_options: number[];
  rate_tables: IUARates;
}

interface VersionConfig {
  id: string;
  effective_date: string;
  products: {
    [key: string]: ProductConfig;
  };
}

interface RateTablesConfigV2 {
  schema: string;
  tobacco_household_monthly_surcharge: number;
  versions: VersionConfig[];
}

const config = rateTablesConfigV2 as RateTablesConfigV2;

const planIdToProductName: Record<string, string> = {
  'care-plus': 'CarePlus',
  'direct': 'Direct',
  'secure-hsa': 'SecureHSA'
};

const benefitIdToIua: Record<string, string> = {
  // Individual tiers
  '3281': '1250',
  '3279': '2500',
  '3278': '5000',
  // Couple tiers
  '3283': '1250',
  '3285': '2500',
  '3286': '5000',
  // Family tiers
  '3293': '1250',
  '3295': '2500',
  '3296': '5000'
};

function normalizeBenefitTier(tier?: string): string | undefined {
  if (!tier) return tier;
  return benefitIdToIua[tier] ?? tier;
}

function resolveVersion(opts?: RateOptions): RateVersion {
  // Explicit version override takes precedence
  if (opts?.rateVersion) return opts.rateVersion;

  // 2026 rates are now effective (billing effective December 20, 2025)
  // Default to 2026 rates for all new calculations
  return '2026-01-01';
}

function loadTables(version: RateVersion): { cfg: RateTablesConfigV2; v: VersionConfig } {
  const v = config.versions.find(x => x.id === version);
  if (!v) {
    throw new Error(`Rate version not found: ${version}`);
  }
  return { cfg: config, v };
}

function getAgeBand(age: number): '18-29' | '30-49' | '50-64' {
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 49) return '30-49';
  if (age >= 50 && age <= 64) return '50-64';
  return '30-49';
}

/**
 * Convert householdType to the correct MembershipRates key
 * Supports both legacy types (individual, couple, family) and new types (member-only, member-spouse, member-child, member-family)
 */
function getMembershipType(householdType: string, hasSpouse: boolean, hasDependents: boolean): keyof MembershipRates {
  // New membership types (direct mapping)
  if (householdType === 'member-only') return 'MemberOnly';
  if (householdType === 'member-spouse') return 'MemberSpouse';
  if (householdType === 'member-child') return 'MemberChild';
  if (householdType === 'member-family') return 'MemberFamily';

  // Legacy types (backward compatibility)
  if (householdType === 'individual') return 'MemberOnly';
  if (householdType === 'couple') return 'MemberSpouse';
  if (householdType === 'family') {
    if (hasSpouse && hasDependents) return 'MemberFamily';
    if (hasSpouse) return 'MemberSpouse';
    if (hasDependents) return 'MemberChild';
    return 'MemberFamily'; // Default family to MemberFamily
  }
  return 'MemberOnly';
}

export function estimateMonthly(input: RateCalculatorInput, opts?: RateOptions): RateEstimate {
  const version = resolveVersion(opts);
  const { cfg, v } = loadTables(version);

  const lineItems: Array<{ description: string; amount: number }> = [];

  const productName = planIdToProductName[input.selectedPlan];
  if (!productName) {
    throw new Error(`Unsupported plan for v2 engine: ${input.selectedPlan}`);
  }

  const product = v.products[productName];
  if (!product) {
    throw new Error(`Product not found in version ${version}: ${productName}`);
  }

  const iua = normalizeBenefitTier(input.benefitTier) || '2500';
  const ageBand = getAgeBand(input.primaryAge);

  const rateTables = product.rate_tables[iua];
  if (!rateTables) {
    throw new Error(`IUA tier not found: ${iua}`);
  }

  const ageBandRates = rateTables[ageBand];
  if (!ageBandRates) {
    throw new Error(`Age band not found: ${ageBand}`);
  }

  const hasSpouse = input.householdType !== 'individual' && input.spouseAge !== undefined && input.spouseAge !== null;
  const hasDependents = input.dependentsCount > 0;
  const membershipType = getMembershipType(input.householdType, hasSpouse, hasDependents);

  const baseRate = ageBandRates[membershipType];

  lineItems.push({
    description: `${membershipType.replace(/([A-Z])/g, ' $1').trim()} - IUA $${Number(iua).toLocaleString()}`,
    amount: baseRate
  });

  let total = baseRate;

  const hasAnyTobaccoUser = input.primaryTobacco || input.spouseTobacco;
  if (hasAnyTobaccoUser) {
    const tobaccoSurcharge = cfg.tobacco_household_monthly_surcharge;
    lineItems.push({
      description: 'Household tobacco/vape surcharge',
      amount: tobaccoSurcharge
    });
    total += tobaccoSurcharge;
  }

  const result: RateEstimate = {
    total: Math.round(total),
    lineItems,
    disclaimer: `Rates effective ${v.effective_date}. Estimates are informational and not insurance. Final sharing levels and eligibility are determined during enrollment. This is not a binding quote.`,
    meta: {
      version,
      effective_date: v.effective_date
    }
  };

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

export function estimateBoth(input: RateCalculatorInput): { current: RateEstimate; y2026: RateEstimate } {
  return {
    current: estimateMonthly(input, { rateVersion: 'current' }),
    y2026: estimateMonthly(input, { rateVersion: '2026-01-01' })
  };
}

export function getBenefitTiersForPlan(planId: string, version?: RateVersion): Array<{ id: string; displayLabel: string; iua: string }> {
  const resolvedVersion = version || '2026-01-01';
  const { v } = loadTables(resolvedVersion);

  const productName = planIdToProductName[planId];
  if (!productName) return [];

  const product = v.products[productName];
  if (!product) return [];

  return product.iua_options.map(iua => ({
    id: iua.toString(),
    displayLabel: `$${iua.toLocaleString()} IUA`,
    iua: `$${iua.toLocaleString()}`
  }));
}

export function getAvailablePlans(version?: RateVersion): string[] {
  const resolvedVersion = version || '2026-01-01';
  const { v } = loadTables(resolvedVersion);
  return Object.keys(v.products);
}

export function getConfigurationVersion(): string {
  return config.schema;
}

export function getTobaccoSurcharge(): number {
  return config.tobacco_household_monthly_surcharge;
}
