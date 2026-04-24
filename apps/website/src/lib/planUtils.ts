import { PlanFeature, PlanWithDetails } from '@/hooks/usePlans';

export const FEATURE_CATEGORIES = {
  'Virtual Health': 'Virtual Health',
  'Preventive Care': 'Preventive Care',
  'Medical Cost Sharing': 'Medical Cost Sharing',
  'Minimum Essential Coverage': 'Minimum Essential Coverage',
  'Pharmacy Benefits': 'Pharmacy Benefits',
  'Member Support': 'Member Support',
  'Exclusive Discounts': 'Exclusive Discounts',
  'Digital Health Tools': 'Digital Health Tools',
  'International Membership': 'International Membership',
  'Core Benefits': 'Core Benefits',
  'Additional Benefits': 'Additional Benefits',
  'Virtual Care': 'Virtual Care',
  'Financial Benefits': 'Financial Benefits',
} as const;

export type FeatureCategory = keyof typeof FEATURE_CATEGORIES;

export function groupFeaturesByCategory(features: PlanFeature[]) {
  const grouped: Record<string, PlanFeature[]> = {};

  features.forEach(feature => {
    if (!grouped[feature.category]) {
      grouped[feature.category] = [];
    }
    grouped[feature.category].push(feature);
  });

  return grouped;
}

export function getCategoryLabel(category: string): string {
  return FEATURE_CATEGORIES[category as FeatureCategory] || category;
}

export function getPlanBadges(plan: PlanWithDetails) {
  const badges: { label: string; variant: 'default' | 'secondary' | 'outline' }[] = [];

  if (plan.is_medical_cost_sharing) {
    badges.push({ label: 'Medical Cost Sharing', variant: 'default' });
  }

  if (plan.is_mec_compliant) {
    badges.push({ label: 'MEC Compliant', variant: 'secondary' });
  }

  if (plan.is_hsa_compatible) {
    badges.push({ label: 'HSA Compatible', variant: 'outline' });
  }

  return badges;
}

export function getAllUniqueCategories(plans: PlanWithDetails[]): string[] {
  const categories = new Set<string>();

  plans.forEach(plan => {
    plan.features.forEach(feature => {
      categories.add(feature.category);
    });
  });

  return Array.from(categories).sort((a, b) => {
    const orderMap: Record<string, number> = {
      'Core Benefits': 1,
      'Medical Cost Sharing': 2,
      'Minimum Essential Coverage': 3,
      'Preventive Care': 4,
      'Virtual Health': 5,
      'Virtual Care': 6,
      'Pharmacy Benefits': 7,
      'Member Support': 8,
      'International Membership': 9,
      'Exclusive Discounts': 10,
      'Digital Health Tools': 11,
      'Additional Benefits': 12,
      'Financial Benefits': 13,
    };

    return (orderMap[a] || 999) - (orderMap[b] || 999);
  });
}

export function getFeatureForPlan(
  plan: PlanWithDetails,
  category: string,
  featureName: string
): PlanFeature | null {
  return plan.features.find(
    f => f.category === category && f.feature_name === featureName
  ) || null;
}

export function formatSharingDetails(plan: PlanWithDetails): string[] {
  const details: string[] = [];
  const sharing = plan.sharing_details;

  if (!sharing) return details;

  if (!sharing.has_lifetime_cap) {
    details.push('No lifetime caps');
  }

  if (!sharing.has_annual_cap) {
    details.push('No annual caps');
  }

  if (sharing.preexisting_lookback_months) {
    const years = Math.floor(sharing.preexisting_lookback_months / 12);
    details.push(`${years}-year pre-membership condition lookback`);
  }

  if (sharing.maternity_waiting_months) {
    details.push(`${sharing.maternity_waiting_months}-month maternity waiting period`);
  }

  return details;
}
