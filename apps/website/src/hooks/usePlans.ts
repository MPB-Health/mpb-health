import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  plan_type: string;
  is_medical_cost_sharing: boolean;
  is_mec_compliant: boolean;
  is_hsa_compatible: boolean;
  target_audience: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  category: string;
  feature_name: string;
  feature_value: string | null;
  cost: string | null;
  notes: string | null;
  sort_order: number;
}

export interface PlanSharingDetails {
  id: string;
  plan_id: string;
  has_lifetime_cap: boolean;
  has_annual_cap: boolean;
  preexisting_lookback_months: number | null;
  maternity_waiting_months: number | null;
  has_international_coverage: boolean;
  iua_options: any | null;
}

export interface PlanWithDetails extends Plan {
  features: PlanFeature[];
  sharing_details: PlanSharingDetails | null;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error: fetchError } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (fetchError) throw fetchError;
        setPlans(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return { plans, loading, error };
}

export function usePlanDetails(planSlug: string) {
  const [plan, setPlan] = useState<PlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlanDetails() {
      try {
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', planSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (planError) throw planError;
        if (!planData) {
          setError(new Error('Plan not found'));
          setLoading(false);
          return;
        }

        const { data: featuresData, error: featuresError } = await supabase
          .from('plan_features')
          .select('*')
          .eq('plan_id', planData.id)
          .order('sort_order');

        if (featuresError) throw featuresError;

        const { data: sharingData, error: sharingError } = await supabase
          .from('plan_sharing_details')
          .select('*')
          .eq('plan_id', planData.id)
          .maybeSingle();

        if (sharingError) throw sharingError;

        setPlan({
          ...planData,
          features: featuresData || [],
          sharing_details: sharingData || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch plan details'));
      } finally {
        setLoading(false);
      }
    }

    fetchPlanDetails();
  }, [planSlug]);

  return { plan, loading, error };
}

export function usePlanComparison(planSlugs: string[]) {
  const [plans, setPlans] = useState<PlanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlansForComparison() {
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .in('slug', planSlugs)
          .eq('is_active', true)
          .order('sort_order');

        if (plansError) throw plansError;
        if (!plansData || plansData.length === 0) {
          setError(new Error('No plans found'));
          setLoading(false);
          return;
        }

        const planIds = plansData.map(p => p.id);

        const { data: featuresData, error: featuresError } = await supabase
          .from('plan_features')
          .select('*')
          .in('plan_id', planIds)
          .order('sort_order');

        if (featuresError) throw featuresError;

        const { data: sharingData, error: sharingError } = await supabase
          .from('plan_sharing_details')
          .select('*')
          .in('plan_id', planIds);

        if (sharingError) throw sharingError;

        const plansWithDetails = plansData.map(plan => ({
          ...plan,
          features: featuresData?.filter(f => f.plan_id === plan.id) || [],
          sharing_details: sharingData?.find(s => s.plan_id === plan.id) || null,
        }));

        setPlans(plansWithDetails);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      } finally {
        setLoading(false);
      }
    }

    if (planSlugs.length > 0) {
      fetchPlansForComparison();
    } else {
      setLoading(false);
    }
  }, [planSlugs.join(',')]);

  return { plans, loading, error };
}
