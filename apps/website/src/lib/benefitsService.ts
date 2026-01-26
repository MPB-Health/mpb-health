import { supabase } from './supabase';

export interface Benefit {
  id: string;
  benefit_key: string;
  icon: string;
  title: string;
  description: string;
  angle: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface MaternityMembershipStage {
  id: string;
  maternity_membership_id: string;
  stage_key: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
  order_index: number;
  created_at: string;
}

export interface MaternityMembership {
  id: string;
  headline: string;
  description: string;
  waiting_period: string;
  eligible_plans: string[];
  highlights: string[];
  prenatal_care: string;
  delivery_hospital: string;
  postnatal_care: string;
  additional_benefits: string[];
  created_at: string;
  updated_at: string;
}

export interface MaternityMembershipWithStages extends MaternityMembership {
  stages: MaternityMembershipStage[];
}

export async function getAllBenefits(): Promise<Benefit[]> {
  const { data, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (error) {
    console.error('Error fetching benefits:', error);
    return [];
  }

  return data || [];
}

export async function getBenefitByKey(key: string): Promise<Benefit | null> {
  const { data, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('benefit_key', key)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching benefit:', error);
    return null;
  }

  return data;
}

export async function getMaternityMembership(): Promise<MaternityMembershipWithStages | null> {
  const { data: membershipData, error: membershipError } = await supabase
    .from('maternity_coverage')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (membershipError || !membershipData) {
    console.error('Error fetching maternity membership:', membershipError);
    return null;
  }

  const { data: stagesData, error: stagesError } = await supabase
    .from('maternity_coverage_stages')
    .select('*')
    .eq('maternity_coverage_id', membershipData.id)
    .order('order_index');

  if (stagesError) {
    console.error('Error fetching maternity stages:', stagesError);
    return {
      ...membershipData,
      stages: [],
    };
  }

  return {
    ...membershipData,
    stages: stagesData || [],
  };
}
