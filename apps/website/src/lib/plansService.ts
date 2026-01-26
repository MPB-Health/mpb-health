import { supabase } from './supabase';

export interface PlanFeature {
  id: string;
  feature_name: string;
  category: string;
  feature_value?: string;
  notes?: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  target_audience: string;
  plan_type: string;
  is_medical_cost_sharing: boolean;
  is_mec_compliant: boolean;
  is_hsa_compatible: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface PlanWithFeatures extends Plan {
  features: PlanFeature[];
  price_display?: string;
  enroll_url?: string;
}

export async function getActivePlans(): Promise<PlanWithFeatures[]> {
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (plansError) {
    console.error('Error fetching plans:', plansError);
    return [];
  }

  if (!plans || plans.length === 0) {
    return [];
  }

  const plansWithFeatures = await Promise.all(
    plans.map(async (plan) => {
      const { data: features } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', plan.id)
        .order('sort_order');

      const { data: pricing } = await supabase
        .from('plan_pricing')
        .select('*')
        .eq('plan_id', plan.id)
        .eq('member_type', 'individual')
        .order('age_min')
        .limit(1)
        .maybeSingle();

      const priceDisplay = pricing?.monthly_contribution
        ? `$${pricing.monthly_contribution}`
        : '$0';

      const enrollUrls: Record<string, string> = {
        'essentials': 'https://essentials.enrollmpb.com/',
        'mec-essentials': 'https://mec.enrollmpb.com/',
        'care-plus': 'https://careplus.enrollmpb.com/',
        'careplus': 'https://careplus.enrollmpb.com/',
        'direct': 'https://direct.enrollmpb.com/',
        'secure-hsa': 'https://securehsa.enrollmpb.com/',
      };

      return {
        ...plan,
        features: features || [],
        price_display: priceDisplay,
        enroll_url: enrollUrls[plan.slug] || '/get-started',
      };
    })
  );

  return plansWithFeatures;
}

export async function getPlanBySlug(slug: string): Promise<PlanWithFeatures | null> {
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (planError || !plan) {
    console.error('Error fetching plan:', planError);
    return null;
  }

  const { data: features } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan_id', plan.id)
    .order('sort_order');

  const { data: pricing } = await supabase
    .from('plan_pricing')
    .select('*')
    .eq('plan_id', plan.id)
    .eq('member_type', 'individual')
    .order('age_min')
    .limit(1)
    .maybeSingle();

  const priceDisplay = pricing?.monthly_contribution
    ? `$${pricing.monthly_contribution}`
    : '$0';

  const enrollUrls: Record<string, string> = {
    'essentials': 'https://essentials.enrollmpb.com/',
    'mec-essentials': 'https://mec.enrollmpb.com/',
    'care-plus': 'https://careplus.enrollmpb.com/',
    'careplus': 'https://careplus.enrollmpb.com/',
    'direct': 'https://direct.enrollmpb.com/',
    'secure-hsa': 'https://securehsa.enrollmpb.com/',
  };

  return {
    ...plan,
    features: features || [],
    price_display: priceDisplay,
    enroll_url: enrollUrls[plan.slug] || '/get-started',
  };
}
