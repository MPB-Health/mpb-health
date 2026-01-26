import { supabase } from './supabase';

export interface RateConfiguration {
  id: string;
  plan_name: string;
  age_band: string;
  age_min: number;
  age_max: number;
  monthly_rate: number;
  tobacco_user: boolean;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getRateForPlanAndAge(
  planName: string,
  age: number,
  tobaccoUser: boolean = false
): Promise<number | null> {
  const { data, error } = await supabase
    .from('rate_configuration')
    .select('*')
    .eq('plan_name', planName)
    .eq('tobacco_user', tobaccoUser)
    .eq('is_active', true)
    .lte('age_min', age)
    .gte('age_max', age)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching rate:', error);
    return null;
  }

  return data?.monthly_rate || null;
}

export async function getRatesForPlan(planName: string): Promise<RateConfiguration[]> {
  const { data, error } = await supabase
    .from('rate_configuration')
    .select('*')
    .eq('plan_name', planName)
    .eq('is_active', true)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('age_min');

  if (error) {
    console.error('Error fetching rates for plan:', error);
    return [];
  }

  return data || [];
}

export async function getAllActivePlans(): Promise<string[]> {
  const { data, error } = await supabase
    .from('rate_configuration')
    .select('plan_name')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching active plans:', error);
    return [];
  }

  const uniquePlans = [...new Set(data?.map(r => r.plan_name) || [])];
  return uniquePlans.sort();
}

export async function getRatesByAgeBand(ageBand: string): Promise<RateConfiguration[]> {
  const { data, error } = await supabase
    .from('rate_configuration')
    .select('*')
    .eq('age_band', ageBand)
    .eq('is_active', true)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('plan_name');

  if (error) {
    console.error('Error fetching rates by age band:', error);
    return [];
  }

  return data || [];
}

export async function getAllRateConfigurations(): Promise<RateConfiguration[]> {
  const { data, error } = await supabase
    .from('rate_configuration')
    .select('*')
    .eq('is_active', true)
    .lte('effective_date', new Date().toISOString().split('T')[0])
    .order('plan_name, age_min');

  if (error) {
    console.error('Error fetching all rate configurations:', error);
    return [];
  }

  return data || [];
}
