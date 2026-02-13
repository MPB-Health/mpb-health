import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlanPricing, PlanPricingCreateInput, ServiceResult } from './planTypes';

export function createPlanPricingService(supabase: SupabaseClient) {
  // -----------------------------------------------------------------------
  // Get pricing for a plan
  // -----------------------------------------------------------------------
  async function getPlanPricing(
    planId: string,
    effectiveDate?: string
  ): Promise<PlanPricing[]> {
    let query = supabase
      .from('plan_pricing')
      .select('*')
      .eq('plan_id', planId)
      .order('effective_date', { ascending: false })
      .order('iua_amount')
      .order('member_type')
      .order('age_min');

    if (effectiveDate) {
      query = query.eq('effective_date', effectiveDate);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching plan pricing:', error);
      return [];
    }
    return (data || []) as PlanPricing[];
  }

  // -----------------------------------------------------------------------
  // Get current pricing for a plan (latest effective date <= today)
  // -----------------------------------------------------------------------
  async function getCurrentPricing(planId: string): Promise<PlanPricing[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('plan_pricing')
      .select('*')
      .eq('plan_id', planId)
      .lte('effective_date', today)
      .order('effective_date', { ascending: false })
      .order('iua_amount')
      .order('member_type')
      .order('age_min');

    if (error || !data) return [];

    // Group by latest effective_date
    if (data.length === 0) return [];
    const latestDate = data[0].effective_date;
    return data.filter((row: PlanPricing) => row.effective_date === latestDate);
  }

  // -----------------------------------------------------------------------
  // Get effective dates for a plan
  // -----------------------------------------------------------------------
  async function getEffectiveDates(planId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('plan_pricing')
      .select('effective_date')
      .eq('plan_id', planId)
      .order('effective_date', { ascending: false });

    if (error || !data) return [];
    return [...new Set(data.map((d: { effective_date: string }) => d.effective_date))];
  }

  // -----------------------------------------------------------------------
  // Add pricing rows
  // -----------------------------------------------------------------------
  async function addPricingRows(
    rows: PlanPricingCreateInput[]
  ): Promise<ServiceResult> {
    const insertRows = rows.map((r) => ({
      plan_id: r.plan_id,
      age_min: r.age_min,
      age_max: r.age_max,
      member_type: r.member_type,
      iua_amount: r.iua_amount ?? null,
      monthly_contribution: r.monthly_contribution,
      effective_date: r.effective_date,
    }));

    const { error } = await supabase.from('plan_pricing').insert(insertRows);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Update a single pricing row
  // -----------------------------------------------------------------------
  async function updatePricingRow(
    id: string,
    monthlyContribution: number
  ): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_pricing')
      .update({ monthly_contribution: monthlyContribution })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Delete pricing rows for a plan + effective date
  // -----------------------------------------------------------------------
  async function deletePricingForDate(
    planId: string,
    effectiveDate: string
  ): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_pricing')
      .delete()
      .eq('plan_id', planId)
      .eq('effective_date', effectiveDate);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Delete a single pricing row
  // -----------------------------------------------------------------------
  async function deletePricingRow(id: string): Promise<ServiceResult> {
    const { error } = await supabase
      .from('plan_pricing')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Bulk replace pricing for a plan + effective date (delete then insert)
  // -----------------------------------------------------------------------
  async function replacePricing(
    planId: string,
    effectiveDate: string,
    rows: Omit<PlanPricingCreateInput, 'plan_id' | 'effective_date'>[]
  ): Promise<ServiceResult> {
    // Delete existing
    const { error: deleteError } = await supabase
      .from('plan_pricing')
      .delete()
      .eq('plan_id', planId)
      .eq('effective_date', effectiveDate);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Insert new
    if (rows.length > 0) {
      const insertRows = rows.map((r) => ({
        plan_id: planId,
        age_min: r.age_min,
        age_max: r.age_max,
        member_type: r.member_type,
        iua_amount: r.iua_amount ?? null,
        monthly_contribution: r.monthly_contribution,
        effective_date: effectiveDate,
      }));

      const { error: insertError } = await supabase
        .from('plan_pricing')
        .insert(insertRows);

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Get starting price (lowest individual rate for current effective date)
  // -----------------------------------------------------------------------
  async function getStartingPrice(planId: string): Promise<number | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('plan_pricing')
      .select('monthly_contribution')
      .eq('plan_id', planId)
      .eq('member_type', 'individual')
      .lte('effective_date', today)
      .order('monthly_contribution')
      .limit(1)
      .maybeSingle();

    return data?.monthly_contribution ?? null;
  }

  return {
    getPlanPricing,
    getCurrentPricing,
    getEffectiveDates,
    addPricingRows,
    updatePricingRow,
    deletePricingRow,
    deletePricingForDate,
    replacePricing,
    getStartingPrice,
  };
}

export type PlanPricingServiceInstance = ReturnType<typeof createPlanPricingService>;
