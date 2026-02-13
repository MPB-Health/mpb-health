import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PlanFeature,
  PlanFeatureCreateInput,
  PlanSharingDetails,
  PlanSharingDetailsInput,
  ServiceResult,
} from './planTypes';

export function createPlanFeatureService(supabase: SupabaseClient) {
  // -----------------------------------------------------------------------
  // Get features for a plan
  // -----------------------------------------------------------------------
  async function getFeatures(planId: string): Promise<PlanFeature[]> {
    const { data, error } = await supabase
      .from('plan_features')
      .select('*')
      .eq('plan_id', planId)
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('Error fetching plan features:', error);
      return [];
    }
    return (data || []) as PlanFeature[];
  }

  // -----------------------------------------------------------------------
  // Get distinct feature categories
  // -----------------------------------------------------------------------
  async function getCategories(): Promise<string[]> {
    const { data } = await supabase
      .from('plan_features')
      .select('category')
      .order('category');

    if (!data) return [];
    return [...new Set(data.map((d: { category: string }) => d.category))];
  }

  // -----------------------------------------------------------------------
  // Add a feature
  // -----------------------------------------------------------------------
  async function addFeature(
    input: PlanFeatureCreateInput
  ): Promise<ServiceResult<{ featureId: string }>> {
    const { data, error } = await supabase
      .from('plan_features')
      .insert({
        plan_id: input.plan_id,
        category: input.category,
        feature_name: input.feature_name,
        feature_value: input.feature_value || null,
        cost: input.cost || null,
        notes: input.notes || null,
        sort_order: input.sort_order ?? 0,
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { featureId: data.id } };
  }

  // -----------------------------------------------------------------------
  // Update a feature
  // -----------------------------------------------------------------------
  async function updateFeature(
    id: string,
    updates: Partial<Omit<PlanFeatureCreateInput, 'plan_id'>>
  ): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_features')
      .update(updates)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Delete a feature
  // -----------------------------------------------------------------------
  async function deleteFeature(id: string): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_features')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Bulk replace features for a plan
  // -----------------------------------------------------------------------
  async function replaceFeatures(
    planId: string,
    features: Omit<PlanFeatureCreateInput, 'plan_id'>[]
  ): Promise<ServiceResult> {
    const { error: deleteError } = await supabase
      .from('plan_features')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) return { success: false, error: deleteError.message };

    if (features.length > 0) {
      const rows = features.map((f, idx) => ({
        plan_id: planId,
        category: f.category,
        feature_name: f.feature_name,
        feature_value: f.feature_value || null,
        cost: f.cost || null,
        notes: f.notes || null,
        sort_order: f.sort_order ?? idx,
      }));

      const { error: insertError } = await supabase
        .from('plan_features')
        .insert(rows);

      if (insertError) return { success: false, error: insertError.message };
    }

    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Get sharing details
  // -----------------------------------------------------------------------
  async function getSharingDetails(
    planId: string
  ): Promise<PlanSharingDetails | null> {
    const { data, error } = await supabase
      .from('plan_sharing_details')
      .select('*')
      .eq('plan_id', planId)
      .maybeSingle();

    if (error) return null;
    return data as PlanSharingDetails | null;
  }

  // -----------------------------------------------------------------------
  // Upsert sharing details
  // -----------------------------------------------------------------------
  async function upsertSharingDetails(
    input: PlanSharingDetailsInput
  ): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_sharing_details')
      .upsert(
        {
          plan_id: input.plan_id,
          has_lifetime_cap: input.has_lifetime_cap ?? false,
          has_annual_cap: input.has_annual_cap ?? false,
          preexisting_lookback_months: input.preexisting_lookback_months ?? null,
          maternity_waiting_months: input.maternity_waiting_months ?? null,
          has_international_coverage: input.has_international_coverage ?? false,
          iua_options: input.iua_options ?? null,
        },
        { onConflict: 'plan_id' }
      );

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  return {
    getFeatures,
    getCategories,
    addFeature,
    updateFeature,
    deleteFeature,
    replaceFeatures,
    getSharingDetails,
    upsertSharingDetails,
  };
}

export type PlanFeatureServiceInstance = ReturnType<typeof createPlanFeatureService>;
