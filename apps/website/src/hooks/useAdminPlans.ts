import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  createPlanService,
  createPlanPricingService,
  createPlanFeatureService,
  PLAN_TYPES,
  PLAN_TYPE_LABELS,
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  IUA_OPTIONS,
  AGE_BANDS,
} from '@mpbhealth/plans-core';
import type {
  Plan,
  PlanWithDetails,
  PlanCreateInput,
  PlanUpdateInput,
  PlanFeature,
  PlanFeatureCreateInput,
  PlanPricing,
  PlanPricingCreateInput,
  PlanSharingDetails,
  PlanSharingDetailsInput,
  PlanFilters,
  ServiceResult,
} from '@mpbhealth/plans-core';

// ---------------------------------------------------------------------------
// Singleton service instances (reuse across renders)
// ---------------------------------------------------------------------------
const planService = createPlanService(supabase);
const pricingService = createPlanPricingService(supabase);
const featureService = createPlanFeatureService(supabase);

// ---------------------------------------------------------------------------
// useAdminPlans — main CRUD hook for the admin Membership Management page
// ---------------------------------------------------------------------------
export function useAdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalPlans, setTotalPlans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlanFilters>({});

  // -----------------------------------------------------------------------
  // Fetch all plans (admin sees active + inactive)
  // -----------------------------------------------------------------------
  const loadPlans = useCallback(async (f?: PlanFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await planService.getPlans(f ?? filters, 100, 0);
      setPlans(result.plans);
      setTotalPlans(result.total);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // -----------------------------------------------------------------------
  // Plan CRUD
  // -----------------------------------------------------------------------
  const createPlan = useCallback(async (input: PlanCreateInput): Promise<ServiceResult<{ planId: string }>> => {
    const result = await planService.createPlan(input);
    if (result.success) await loadPlans();
    return result;
  }, [loadPlans]);

  const updatePlan = useCallback(async (id: string, updates: PlanUpdateInput): Promise<ServiceResult> => {
    const result = await planService.updatePlan(id, updates);
    if (result.success) await loadPlans();
    return result;
  }, [loadPlans]);

  const deletePlan = useCallback(async (id: string): Promise<ServiceResult> => {
    const result = await planService.deletePlan(id);
    if (result.success) await loadPlans();
    return result;
  }, [loadPlans]);

  const toggleActive = useCallback(async (id: string): Promise<ServiceResult> => {
    const result = await planService.toggleActive(id);
    if (result.success) await loadPlans();
    return result;
  }, [loadPlans]);

  const getPlanDetails = useCallback(async (id: string): Promise<PlanWithDetails | null> => {
    return planService.getPlan(id);
  }, []);

  // -----------------------------------------------------------------------
  // Pricing CRUD
  // -----------------------------------------------------------------------
  const getPlanPricing = useCallback(async (planId: string, effectiveDate?: string) => {
    return pricingService.getPlanPricing(planId, effectiveDate);
  }, []);

  const getCurrentPricing = useCallback(async (planId: string) => {
    return pricingService.getCurrentPricing(planId);
  }, []);

  const getEffectiveDates = useCallback(async (planId: string) => {
    return pricingService.getEffectiveDates(planId);
  }, []);

  const addPricingRows = useCallback(async (rows: PlanPricingCreateInput[]): Promise<ServiceResult> => {
    return pricingService.addPricingRows(rows);
  }, []);

  const updatePricingRow = useCallback(async (id: string, monthlyContribution: number): Promise<ServiceResult> => {
    return pricingService.updatePricingRow(id, monthlyContribution);
  }, []);

  const deletePricingRow = useCallback(async (id: string): Promise<ServiceResult> => {
    return pricingService.deletePricingRow(id);
  }, []);

  const replacePricing = useCallback(async (
    planId: string,
    effectiveDate: string,
    rows: Omit<PlanPricingCreateInput, 'plan_id' | 'effective_date'>[]
  ): Promise<ServiceResult> => {
    return pricingService.replacePricing(planId, effectiveDate, rows);
  }, []);

  // -----------------------------------------------------------------------
  // Feature CRUD
  // -----------------------------------------------------------------------
  const getFeatures = useCallback(async (planId: string) => {
    return featureService.getFeatures(planId);
  }, []);

  const getCategories = useCallback(async () => {
    return featureService.getCategories();
  }, []);

  const addFeature = useCallback(async (input: PlanFeatureCreateInput): Promise<ServiceResult<{ featureId: string }>> => {
    return featureService.addFeature(input);
  }, []);

  const updateFeature = useCallback(async (
    id: string,
    updates: Partial<Omit<PlanFeatureCreateInput, 'plan_id'>>
  ): Promise<ServiceResult> => {
    return featureService.updateFeature(id, updates);
  }, []);

  const deleteFeature = useCallback(async (id: string): Promise<ServiceResult> => {
    return featureService.deleteFeature(id);
  }, []);

  const replaceFeatures = useCallback(async (
    planId: string,
    features: Omit<PlanFeatureCreateInput, 'plan_id'>[]
  ): Promise<ServiceResult> => {
    return featureService.replaceFeatures(planId, features);
  }, []);

  // -----------------------------------------------------------------------
  // Sharing Details
  // -----------------------------------------------------------------------
  const getSharingDetails = useCallback(async (planId: string) => {
    return featureService.getSharingDetails(planId);
  }, []);

  const upsertSharingDetails = useCallback(async (input: PlanSharingDetailsInput): Promise<ServiceResult> => {
    return featureService.upsertSharingDetails(input);
  }, []);

  // -----------------------------------------------------------------------
  // Computed stats
  // -----------------------------------------------------------------------
  const stats = useMemo(() => ({
    totalPlans: totalPlans,
    activePlans: plans.filter(p => p.is_active).length,
    planTypes: [...new Set(plans.map(p => p.plan_type))].length,
    inactivePlans: plans.filter(p => !p.is_active).length,
  }), [plans, totalPlans]);

  return {
    // State
    plans,
    loading,
    error,
    stats,
    filters,

    // Plan ops
    setFilters: (f: PlanFilters) => { setFilters(f); },
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    toggleActive,
    getPlanDetails,

    // Pricing ops
    getPlanPricing,
    getCurrentPricing,
    getEffectiveDates,
    addPricingRows,
    updatePricingRow,
    deletePricingRow,
    replacePricing,

    // Feature ops
    getFeatures,
    getCategories,
    addFeature,
    updateFeature,
    deleteFeature,
    replaceFeatures,

    // Sharing details ops
    getSharingDetails,
    upsertSharingDetails,

    // Constants (re-exported for convenience)
    PLAN_TYPES,
    PLAN_TYPE_LABELS,
    MEMBER_TYPES,
    MEMBER_TYPE_LABELS,
    IUA_OPTIONS,
    AGE_BANDS,
  };
}

// Re-export types for convenience in admin components
export type {
  Plan,
  PlanWithDetails,
  PlanCreateInput,
  PlanUpdateInput,
  PlanFeature,
  PlanFeatureCreateInput,
  PlanPricing,
  PlanPricingCreateInput,
  PlanSharingDetails,
  PlanSharingDetailsInput,
  PlanFilters,
  ServiceResult,
};
