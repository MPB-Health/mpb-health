import { supabase } from './supabase';

export interface Advisor {
  id: string;
  advisor_id: string;
  display_name: string;
  city: string;
  state: string;
  landing_url: string;
  phone: string;
  email: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export async function getAllAdvisors(): Promise<Advisor[]> {
  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (error) {
    console.error('Error fetching advisors:', error);
    return [];
  }

  return data || [];
}

export async function getAdvisorsByState(state: string): Promise<Advisor[]> {
  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .eq('is_active', true)
    .eq('state', state.toUpperCase())
    .order('order_index');

  if (error) {
    console.error('Error fetching advisors by state:', error);
    return [];
  }

  return data || [];
}

export async function getAdvisorById(advisorId: string): Promise<Advisor | null> {
  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching advisor:', error);
    return null;
  }

  return data;
}

export async function getUniqueStates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('advisors')
    .select('state')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching states:', error);
    return [];
  }

  const uniqueStates = [...new Set(data?.map(a => a.state) || [])];
  return uniqueStates.sort();
}
