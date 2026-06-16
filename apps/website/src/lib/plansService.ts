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
  enroll_url: string | null;
  enrollment_fee: number;
  annual_membership_fee: number;
  tobacco_surcharge_pct: number;
}

export interface PlanWithFeatures extends Plan {
  features: PlanFeature[];
  price_display?: string;
}

import { getPlanEnrollUrl } from './planEnrollUrls';
import {
  getPlanEnrollmentPagePath,
  PLAN_ENROLLMENT_CONFIGS,
} from './planEnrollmentConfig';

function resolveEnrollPageUrl(storedUrl: string | null | undefined, slug: string): string {
  if (!storedUrl) return getPlanEnrollUrl(slug);
  for (const config of PLAN_ENROLLMENT_CONFIGS) {
    if (storedUrl === config.embedUrl || storedUrl.startsWith(config.embedUrl)) {
      return getPlanEnrollmentPagePath(config.id);
    }
  }
  if (storedUrl.startsWith('/enroll/')) return storedUrl;
  return getPlanEnrollUrl(slug);
}

export async function getActivePlans(): Promise<PlanWithFeatures[]> {
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('id, slug, name, tagline, target_audience, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, sort_order, is_active, enroll_url, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct')
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
        .select('id, plan_id, feature_name, category, feature_value, notes, sort_order')
        .eq('plan_id', plan.id)
        .order('sort_order');

      const { data: pricing } = await supabase
        .from('plan_pricing')
        .select('id, plan_id, member_type, monthly_contribution, sort_order')
        .eq('plan_id', plan.id)
        .eq('member_type', 'individual')
        .order('monthly_contribution')
        .limit(1)
        .maybeSingle();

      const priceDisplay = pricing?.monthly_contribution
        ? `$${pricing.monthly_contribution}`
        : '$0';

      return {
        ...plan,
        features: features || [],
        price_display: priceDisplay,
        // Use DB enroll_url if available, fallback to hardcoded map
        enroll_url: resolveEnrollPageUrl(plan.enroll_url, plan.slug),
      };
    })
  );

  return plansWithFeatures;
}

export async function getPlanBySlug(slug: string): Promise<PlanWithFeatures | null> {
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('id, slug, name, tagline, target_audience, plan_type, is_medical_cost_sharing, is_mec_compliant, is_hsa_compatible, sort_order, is_active, enroll_url, enrollment_fee, annual_membership_fee, tobacco_surcharge_pct')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (planError || !plan) {
    console.error('Error fetching plan:', planError);
    return null;
  }

  const { data: features } = await supabase
    .from('plan_features')
    .select('id, plan_id, feature_name, category, feature_value, notes, sort_order')
    .eq('plan_id', plan.id)
    .order('sort_order');

  const { data: pricing } = await supabase
    .from('plan_pricing')
    .select('id, plan_id, member_type, monthly_contribution, sort_order')
    .eq('plan_id', plan.id)
    .eq('member_type', 'individual')
    .order('monthly_contribution')
    .limit(1)
    .maybeSingle();

  const priceDisplay = pricing?.monthly_contribution
    ? `$${pricing.monthly_contribution}`
    : '$0';

  return {
    ...plan,
    features: features || [],
    price_display: priceDisplay,
    enroll_url: resolveEnrollPageUrl(plan.enroll_url, plan.slug),
  };
}
