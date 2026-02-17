import { z } from 'zod';

// Membership types matching actual pricing structure:
// - member-only: Just the primary member
// - member-spouse: Member + Spouse (no children)
// - member-child: Member + Children (single parent)
// - member-family: Member + Spouse + Children (full family)
export const MEMBERSHIP_TYPES = ['member-only', 'member-spouse', 'member-child', 'member-family'] as const;
export type MembershipType = typeof MEMBERSHIP_TYPES[number];

export const rateCalculatorSchema = z.object({
  state: z.string().min(2, 'State is required'),
  householdType: z.enum(MEMBERSHIP_TYPES, {
    errorMap: () => ({ message: 'Please select a membership type' }),
  }),
  primaryAge: z
    .number({ invalid_type_error: 'Age is required', required_error: 'Age is required' })
    .min(18, 'Primary member must be at least 18')
    .max(64, 'Primary member must be 64 or younger'),
  spouseAge: z
    .number()
    .min(18, 'Spouse must be at least 18')
    .max(64, 'Spouse must be 64 or younger')
    .optional()
    .nullable(),
  dependentsCount: z
    .number()
    .min(0, 'Cannot have negative dependents')
    .max(10, 'Maximum 10 dependents')
    .optional()
    .default(0),
  primaryTobacco: z.boolean().default(false),
  spouseTobacco: z.boolean().default(false),
  selectedPlan: z.enum(
    ['essentials', 'mec-essentials', 'care-plus', 'direct', 'secure-hsa'] as const,
    {
      errorMap: () => ({ message: 'Please select a plan' }),
    }
  ),
  benefitTier: z.string().optional(),
  currentMonthly: z.number().optional().nullable().or(z.nan()).transform((val: any) => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return val as number;
  }),
}).refine(
  (data) => {
    // Spouse age required for member-spouse and member-family
    if (data.householdType === 'member-spouse' || data.householdType === 'member-family') {
      return data.spouseAge !== undefined && data.spouseAge !== null;
    }
    return true;
  },
  {
    message: 'Spouse age is required',
    path: ['spouseAge'],
  }
).refine(
  (data) => {
    // Dependents required for member-child and member-family
    if (data.householdType === 'member-child' || data.householdType === 'member-family') {
      return data.dependentsCount !== undefined && data.dependentsCount >= 1;
    }
    return true;
  },
  {
    message: 'Number of children is required',
    path: ['dependentsCount'],
  }
).refine(
  (data) => {
    const plansRequiringTier = ['care-plus', 'direct', 'secure-hsa'];
    if (plansRequiringTier.includes(data.selectedPlan)) {
      return data.benefitTier !== undefined && data.benefitTier !== '' && data.benefitTier !== null;
    }
    return true;
  },
  {
    message: 'Please select a benefit tier (IUA level) for this plan',
    path: ['benefitTier'],
  }
);

// Inferred type from zod (used for form validation)
export type RateCalculatorFormData = z.infer<typeof rateCalculatorSchema>;

// Explicit input type for rate engine functions (makes currentMonthly truly optional)
export interface RateCalculatorInput {
  state: string;
  householdType: MembershipType;
  primaryAge: number;
  spouseAge?: number | null;
  dependentsCount: number;
  primaryTobacco: boolean;
  spouseTobacco: boolean;
  selectedPlan: 'essentials' | 'mec-essentials' | 'care-plus' | 'direct' | 'secure-hsa';
  benefitTier?: string;
  currentMonthly?: number;
}

// Schema for comparison calculator (no plan/tier selection required)
// Uses the same MEMBERSHIP_TYPES as the rate calculator for consistency
export const comparisonCalculatorSchema = z.object({
  state: z.string().min(2, 'State is required'),
  householdType: z.enum(MEMBERSHIP_TYPES, {
    errorMap: () => ({ message: 'Please select a membership type' }),
  }),
  primaryAge: z
    .number({ invalid_type_error: 'Age is required', required_error: 'Age is required' })
    .min(18, 'Primary member must be at least 18')
    .max(64, 'Primary member must be 64 or younger'),
  spouseAge: z
    .number()
    .min(18, 'Spouse must be at least 18')
    .max(64, 'Spouse must be 64 or younger')
    .optional()
    .nullable(),
  dependentsCount: z
    .number()
    .min(0, 'Cannot have negative dependents')
    .max(10, 'Maximum 10 dependents')
    .optional()
    .default(0),
  primaryTobacco: z.boolean().default(false),
  spouseTobacco: z.boolean().default(false),
  currentMonthly: z.number().optional().nullable().or(z.nan()).transform((val: any) => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return val as number;
  }),
}).refine(
  (data) => {
    // Spouse age required for member-spouse and member-family
    if (data.householdType === 'member-spouse' || data.householdType === 'member-family') {
      return data.spouseAge !== undefined && data.spouseAge !== null;
    }
    return true;
  },
  {
    message: 'Spouse age is required',
    path: ['spouseAge'],
  }
).refine(
  (data) => {
    // Dependents required for member-child and member-family
    if (data.householdType === 'member-child' || data.householdType === 'member-family') {
      return data.dependentsCount !== undefined && data.dependentsCount >= 1;
    }
    return true;
  },
  {
    message: 'Number of children is required',
    path: ['dependentsCount'],
  }
);

export type ComparisonCalculatorInput = z.infer<typeof comparisonCalculatorSchema>;

export type RateVersion = 'current' | '2026-01-01';

export interface RateOptions {
  startDate?: string | Date;
  rateVersion?: RateVersion;
}

export interface RateEstimate {
  total: number;
  lineItems: Array<{
    description: string;
    amount: number;
  }>;
  disclaimer: string;
  meta?: {
    version: RateVersion;
    effective_date: string;
  };
  comparison?: {
    currentMonthly: number;
    deltaMonthly: number;
    deltaAnnual: number;
    direction: 'savings' | 'increase' | 'same';
  };
}

export const businessRateCalculatorSchema = z.object({
  state: z.string().min(2, 'State is required'),
  businessType: z.enum(['sole-proprietor', 'llc', 'corporation', 'partnership'] as const, {
    errorMap: () => ({ message: 'Please select a business type' }),
  }),
  employeeCount: z
    .number({ invalid_type_error: 'Number of employees is required', required_error: 'Number of employees is required' })
    .min(1, 'Must have at least 1 employee')
    .max(100, 'Maximum 100 employees'),
  householdType: z.enum(MEMBERSHIP_TYPES, {
    errorMap: () => ({ message: 'Please select a membership type' }),
  }),
  primaryAge: z
    .number({ invalid_type_error: 'Age is required', required_error: 'Age is required' })
    .min(18, 'Primary member must be at least 18')
    .max(64, 'Primary member must be 64 or younger'),
  spouseAge: z
    .number()
    .min(18, 'Spouse must be at least 18')
    .max(64, 'Spouse must be 64 or younger')
    .optional()
    .nullable(),
  dependentsCount: z
    .number()
    .min(0, 'Cannot have negative dependents')
    .max(10, 'Maximum 10 dependents')
    .optional()
    .default(0),
  primaryTobacco: z.boolean().default(false),
  spouseTobacco: z.boolean().default(false),
  selectedPlan: z.enum(['mec-essentials', 'secure-hsa'] as const, {
    errorMap: () => ({ message: 'Please select a plan' }),
  }),
  benefitTier: z.string().optional(),
  currentMonthly: z.number().optional().nullable().or(z.nan()).transform((val: any) => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return undefined;
    return val as number;
  }),
}).refine(
  (data) => {
    // Spouse age required for member-spouse and member-family
    if (data.householdType === 'member-spouse' || data.householdType === 'member-family') {
      return data.spouseAge !== undefined && data.spouseAge !== null;
    }
    return true;
  },
  {
    message: 'Spouse age is required',
    path: ['spouseAge'],
  }
).refine(
  (data) => {
    // Dependents required for member-child and member-family
    if (data.householdType === 'member-child' || data.householdType === 'member-family') {
      return data.dependentsCount !== undefined && data.dependentsCount >= 1;
    }
    return true;
  },
  {
    message: 'Number of children is required',
    path: ['dependentsCount'],
  }
).refine(
  (data) => {
    if (data.selectedPlan === 'secure-hsa') {
      return data.benefitTier !== undefined && data.benefitTier !== '' && data.benefitTier !== null;
    }
    return true;
  },
  {
    message: 'Please select a benefit tier (IUA level) for Secure HSA',
    path: ['benefitTier'],
  }
);

export type BusinessRateCalculatorInput = z.infer<typeof businessRateCalculatorSchema>;

export interface BusinessRateEstimate extends RateEstimate {
  perEmployeeCost: number;
  employeeCount: number;
  totalBusinessCost: number;
  annualBusinessCost: number;
}
