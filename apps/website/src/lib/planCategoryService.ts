import { supabase, HealthcarePlanCategory, HealthcarePlanCategoryWithDetails } from './supabase';

export async function getPlanCategories(): Promise<HealthcarePlanCategory[]> {
  const { data, error } = await supabase
    .from('healthcare_plan_categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching plan categories:', error);
    throw error;
  }

  return data || [];
}

export async function getPlanCategoryBySlug(slug: string): Promise<HealthcarePlanCategoryWithDetails | null> {
  const { data: category, error: categoryError } = await supabase
    .from('healthcare_plan_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError) {
    console.error('Error fetching plan category:', categoryError);
    throw categoryError;
  }

  if (!category) {
    return null;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('plan_category_profiles')
    .select('*')
    .eq('category_id', category.id)
    .order('order_index', { ascending: true });

  if (profilesError) {
    console.error('Error fetching category profiles:', profilesError);
  }

  const { data: features, error: featuresError } = await supabase
    .from('plan_category_features')
    .select('*')
    .eq('category_id', category.id)
    .order('order_index', { ascending: true });

  if (featuresError) {
    console.error('Error fetching category features:', featuresError);
  }

  const included_features = (features || []).filter(f => f.feature_type === 'included');
  const excluded_features = (features || []).filter(f => f.feature_type === 'excluded');

  return {
    ...category,
    profiles: profiles || [],
    included_features,
    excluded_features,
  };
}

export async function incrementCategoryView(slug: string): Promise<void> {
  try {
    await supabase.rpc('increment_category_views', { category_slug: slug });
  } catch (error) {
    console.error('Error incrementing category views:', error);
  }
}
