import { Heart, Activity, Brain, Pill, Shield, Stethoscope, PawPrint, LucideIcon } from 'lucide-react';

export interface MembershipPriority {
  id: string;
  label: string;
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
    id: 'primary-care',
    label: 'Primary Care',
    icon: Stethoscope,
    description: 'Routine doctor visits and checkups',
    keywords: ['doctor visits', 'annual physicals', 'wellness exams', 'preventative care'],
  },
  {
    id: 'urgent-care',
    label: 'Urgent Care',
    icon: Activity,
    description: 'Immediate medical attention for non-emergencies',
    keywords: ['urgent care', 'walk-in clinic', 'immediate care', 'minor emergencies'],
  },
  {
    id: 'virtual-behavioral-health',
    label: 'Virtual Behavioral Health',
    icon: Brain,
    description: 'Counseling and virtual behavioral health services',
    keywords: ['therapy', 'counseling', 'behavioral health', 'virtual behavioral health', 'telehealth'],
  },
  {
    id: 'rx',
    label: 'Prescriptions (RX)',
    icon: Pill,
    description: 'Prescription medication membership and discounts',
    keywords: ['prescriptions', 'medications', 'pharmacy', 'rx discounts', 'drug membership'],
  },
  {
    id: 'large-medical',
    label: 'Large Medical Expenses',
    icon: Shield,
    description: 'Major medical events and hospitalizations',
    keywords: ['hospital', 'surgery', 'major medical', 'catastrophic', 'high-cost procedures'],
  },
  {
    id: 'preventative',
    label: 'Preventative Care',
    icon: Heart,
    description: 'Preventive screenings and wellness care',
    keywords: ['preventative', 'screenings', 'wellness', 'immunizations', 'health maintenance'],
  },
  {
    id: 'pet-care',
    label: 'Pet Care',
    icon: PawPrint,
    description: 'Optional pet insurance add-on',
    keywords: ['pet insurance', 'veterinary', 'animal care', 'pet health'],
  },
];

// Plan membership strength matrix (0-10 scale)
const planMembershipMatrix: Record<string, Record<string, number>> = {
  'mec-essentials': {
    'primary-care': 8,
    'urgent-care': 7,
    'mental-health': 6,
    'rx': 5,
    'large-medical': 3,
    'preventative': 8,
    'pet-care': 5,
  },
  'care-plus': {
    'primary-care': 9,
    'urgent-care': 9,
    'mental-health': 8,
    'rx': 7,
    'large-medical': 9,
    'preventative': 9,
    'pet-care': 5,
  },
  'direct': {
    'primary-care': 10,
    'urgent-care': 9,
    'mental-health': 8,
    'rx': 7,
    'large-medical': 7,
    'preventative': 10,
    'pet-care': 5,
  },
  'secure-hsa': {
    'primary-care': 8,
    'urgent-care': 8,
    'mental-health': 8,
    'rx': 7,
    'large-medical': 10,
    'preventative': 9,
    'pet-care': 5,
  },
};

// Plan details for recommendations
const planDetails: Record<string, { name: string; tagline: string; bestFor: string[] }> = {
  'mec-essentials': {
    name: 'MEC+ Essentials',
    tagline: 'Affordable basic membership',
    bestFor: ['Budget-conscious families', 'Basic preventative care', 'Minimum essential membership'],
  },
  'care-plus': {
    name: 'Care+',
    tagline: 'Best overall value',
    bestFor: ['Comprehensive membership', 'Families with children', 'Balanced protection'],
  },
  'direct': {
    name: 'Direct',
    tagline: 'Best for preventative care',
    bestFor: ['Primary care focus', 'Wellness-oriented individuals', 'Frequent doctor visits'],
  },
  'secure-hsa': {
    name: 'Secure HSA',
    tagline: 'Best for self-employed',
    bestFor: ['HSA compatibility', 'Self-employed individuals', 'Major medical protection'],
  },
};

export function recommendPlans(selectedPriorities: string[]): PlanRecommendation[] {
  if (selectedPriorities.length === 0) {
    return [];
  }

  const plans = ['mec-essentials', 'care-plus', 'direct', 'secure-hsa'];
  const recommendations: PlanRecommendation[] = [];

  plans.forEach((planId) => {
    let totalScore = 0;
    const reasons: string[] = [];
    const planMembership = planMembershipMatrix[planId];
    const details = planDetails[planId];

    selectedPriorities.forEach((priorityId) => {
      const score = planMembership[priorityId] || 0;
      totalScore += score;

      // Add reasons for strong matches
      if (score >= 9) {
        const priority = membershipPriorities.find((p) => p.id === priorityId);
        if (priority) {
          reasons.push(`Excellent ${priority.label.toLowerCase()} membership`);
        }
      }
    });

    const maxPossibleScore = selectedPriorities.length * 10;
    const matchPercentage = Math.round((totalScore / maxPossibleScore) * 100);

    recommendations.push({
      planId,
      planName: details.name,
      score: totalScore,
      matchPercentage,
      reasons: reasons.slice(0, 3), // Top 3 reasons
      bestFor: details.bestFor,
    });
  });

  // Sort by score (highest first)
  recommendations.sort((a, b) => b.score - a.score);

  // Add generic reasons for top plans if specific reasons are missing
  recommendations.forEach((rec, index) => {
    if (rec.reasons.length === 0 && index < 2) {
      if (rec.planId === 'care-plus') {
        rec.reasons.push('Well-rounded membership for all priorities');
      } else if (rec.planId === 'direct') {
        rec.reasons.push('Strong preventative and primary care focus');
      } else if (rec.planId === 'secure-hsa') {
        rec.reasons.push('HSA-compatible with comprehensive protection');
      } else if (rec.planId === 'mec-essentials') {
        rec.reasons.push('Budget-friendly essential membership');
      }
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

// Re-export old names for backwards compatibility during migration
export const coveragePriorities = membershipPriorities;
export type CoveragePriority = MembershipPriority;

