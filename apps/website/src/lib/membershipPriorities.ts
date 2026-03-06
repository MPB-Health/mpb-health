import { Heart, Shield, Building2, Pill, Stethoscope, LucideIcon } from 'lucide-react';

/**
 * Membership Priorities — aligned with Membership Overview (Agent Resource) PDF.
 *
 * IMPORTANT: Virtual Care ($0 unlimited), MPB Concierge, Pharmacy Discounts,
 * Discounted Supplements, and Pet Telehealth come with ALL memberships.
 * These priorities focus on what ACTUALLY differentiates plans.
 */
export interface MembershipPriority {
  id: string;
  label: string;
  /** Plain-language label for forms — easier to scan */
  shortLabel?: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export interface PlanRecommendation {
  planId: string;
  planName: string;
  score: number;
  matchPercentage: number;
  reasons: string[];
  bestFor: string[];
}

export const membershipPriorities: MembershipPriority[] = [
  {
    id: 'medical-cost-sharing',
    label: 'Medical Cost Sharing',
    shortLabel: 'Hospital & surgery coverage',
    icon: Shield,
    description: 'Hospital, surgery, major medical — community shares eligible expenses',
    keywords: ['hospital', 'surgery', 'major medical', 'catastrophic', 'medical cost sharing'],
  },
  {
    id: 'hsa-tax-benefits',
    label: 'HSA & Tax Benefits',
    shortLabel: 'Pre-tax savings (HSA)',
    icon: Building2,
    description: 'Pre-tax healthcare savings, IRS-compliant HSA',
    keywords: ['HSA', 'tax deductible', 'self-employed', '1099', 'pre-tax'],
  },
  {
    id: 'aca-compliance',
    label: 'ACA Employer Compliance',
    shortLabel: 'Small business / employer coverage',
    icon: Building2,
    description: 'Minimum Essential Coverage — satisfies employer mandate',
    keywords: ['ACA', 'MEC', 'employer mandate', 'small business', 'compliance'],
  },
  {
    id: 'preventive-care',
    label: 'Preventive Care',
    shortLabel: 'Checkups & wellness',
    icon: Stethoscope,
    description: 'Annual wellness, screenings, immunizations',
    keywords: ['preventive', 'wellness', 'screenings', 'immunizations', 'annual checkup'],
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions (RX)',
    shortLabel: 'Prescription savings',
    icon: Pill,
    description: 'RX Valet ($0–$14.95) or pharmacy discounts',
    keywords: ['prescriptions', 'medications', 'pharmacy', 'RX Valet'],
  },
  {
    id: 'budget-friendly',
    label: 'Budget-Friendly',
    shortLabel: 'Lowest monthly cost',
    icon: Heart,
    description: 'Lower monthly cost, essential protection',
    keywords: ['affordable', 'budget', 'low cost', 'savings'],
  },
];

/**
 * Plan strength matrix (0–10) — from Membership Overview PDF.
 * Virtual Care, Concierge, Supplements, Pharmacy come with ALL plans.
 */
const planMembershipMatrix: Record<string, Record<string, number>> = {
  'essentials': {
    'medical-cost-sharing': 0,
    'hospital-debt-relief': 10,
    'hsa-tax-benefits': 0,
    'aca-compliance': 0,
    'preventive-care': 7,
    'prescriptions': 6,
    'budget-friendly': 9,
  },
  'mec-essentials': {
    'medical-cost-sharing': 0,
    'hospital-debt-relief': 10,
    'hsa-tax-benefits': 10,
    'aca-compliance': 10,
    'preventive-care': 9,
    'prescriptions': 9,
    'budget-friendly': 8,
  },
  'care-plus': {
    'medical-cost-sharing': 10,
    'hospital-debt-relief': 0,
    'hsa-tax-benefits': 0,
    'aca-compliance': 0,
    'preventive-care': 8,
    'prescriptions': 7,
    'budget-friendly': 7,
  },
  'direct': {
    'medical-cost-sharing': 10,
    'hospital-debt-relief': 0,
    'hsa-tax-benefits': 0,
    'aca-compliance': 0,
    'preventive-care': 10,
    'prescriptions': 6,
    'budget-friendly': 9,
  },
  'secure-hsa': {
    'medical-cost-sharing': 10,
    'hospital-debt-relief': 0,
    'hsa-tax-benefits': 10,
    'aca-compliance': 10,
    'preventive-care': 9,
    'prescriptions': 9,
    'budget-friendly': 6,
  },
};

// From Membership Overview (Agent Resource) PDF
const planDetails: Record<string, { name: string; tagline: string; bestFor: string[] }> = {
  'essentials': {
    name: 'Essentials',
    tagline: 'Hospital debt relief + virtual care',
    bestFor: ['Those with existing medical debt', 'Debt Dismissal Program eligible', 'Virtual care + discounts only'],
  },
  'mec-essentials': {
    name: 'MEC+ Essentials',
    tagline: 'ACA MEC + Debt Dismissal + HSA',
    bestFor: ['Small businesses (2–50 employees)', 'ACA employer mandate', 'Self-employed needing HSA + debt relief'],
  },
  'care-plus': {
    name: 'Care+',
    tagline: 'Medical cost sharing',
    bestFor: ['Families wanting hospital/surgery sharing', 'Medical cost sharing', 'No HSA needed'],
  },
  'direct': {
    name: 'Direct',
    tagline: 'Limited preventive + medical sharing',
    bestFor: ['Annual wellness, labs, screenings, immunizations', 'Wellness-focused', 'Budget-conscious'],
  },
  'secure-hsa': {
    name: 'Secure HSA',
    tagline: 'Medical sharing + MEC + HSA + RX Valet',
    bestFor: ['Self-employed, 1099, gig workers', 'HSA + tax advantages', 'Full protection + MEC'],
  },
};

export function recommendPlans(selectedPriorities: string[]): PlanRecommendation[] {
  if (selectedPriorities.length === 0) {
    return [];
  }

  const plans = ['essentials', 'mec-essentials', 'care-plus', 'direct', 'secure-hsa'];
  const recommendations: PlanRecommendation[] = [];

  plans.forEach((planId) => {
    let totalScore = 0;
    const reasons: string[] = [];
    const planMembership = planMembershipMatrix[planId];
    const details = planDetails[planId];

    selectedPriorities.forEach((priorityId) => {
      const score = planMembership[priorityId] ?? 0;
      totalScore += score;

      if (score >= 9) {
        const priority = membershipPriorities.find((p) => p.id === priorityId);
        if (priority) {
          reasons.push(`Strong ${priority.label.toLowerCase()} match`);
        }
      }
    });

    const maxPossibleScore = selectedPriorities.length * 10;
    const matchPercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

    recommendations.push({
      planId,
      planName: details.name,
      score: totalScore,
      matchPercentage,
      reasons: reasons.slice(0, 3),
      bestFor: details.bestFor,
    });
  });

  // Sort by score, but always rank Secure HSA first (primary recommendation)
  recommendations.sort((a, b) => {
    if (a.planId === 'secure-hsa') return -1;
    if (b.planId === 'secure-hsa') return 1;
    return b.score - a.score;
  });

  // Ensure Secure HSA (when first) has a strong match % and reason
  const secureHsa = recommendations.find((r) => r.planId === 'secure-hsa');
  if (secureHsa && recommendations[0]?.planId === 'secure-hsa') {
    secureHsa.matchPercentage = Math.max(secureHsa.matchPercentage, 85);
    if (secureHsa.reasons.length === 0) {
      secureHsa.reasons.push('HSA + medical sharing + MEC');
    }
  }

  recommendations.forEach((rec, index) => {
    if (rec.reasons.length === 0 && index < 2) {
      if (rec.planId === 'care-plus') rec.reasons.push('Full medical cost sharing');
      else if (rec.planId === 'direct') rec.reasons.push('Preventive care + medical sharing');
      else if (rec.planId === 'secure-hsa') rec.reasons.push('HSA + medical sharing + MEC');
      else if (rec.planId === 'mec-essentials') rec.reasons.push('ACA compliance + debt relief + HSA');
      else if (rec.planId === 'essentials') rec.reasons.push('Hospital debt relief + virtual care');
    }
  });

  return recommendations;
}

export function getPriorityById(id: string): MembershipPriority | undefined {
  return membershipPriorities.find((p) => p.id === id);
}

export function getTopRecommendation(selectedPriorities: string[]): PlanRecommendation | null {
  const recommendations = recommendPlans(selectedPriorities);
  return recommendations.length > 0 ? recommendations[0] : null;
}

export function getRecommendedPlanIds(selectedPriorities: string[], limit: number = 2): string[] {
  const recommendations = recommendPlans(selectedPriorities);
  return recommendations.slice(0, limit).map((rec) => rec.planId);
}

export const coveragePriorities = membershipPriorities;
export type CoveragePriority = MembershipPriority;
