import { supabase } from './supabase';

export interface EducationalContentStep {
  title: string;
  body: string;
}

export interface EducationalContent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content_type: 'how_it_works' | 'guide' | 'tutorial' | 'overview';
  content_data: {
    steps?: EducationalContentStep[];
    [key: string]: unknown;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getEducationalContentBySlug(slug: string): Promise<EducationalContent | null> {
  const { data, error } = await supabase
    .from('educational_content')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching educational content:', error);
    return null;
  }

  return data;
}

export async function getEducationalContentByType(
  contentType: 'how_it_works' | 'guide' | 'tutorial' | 'overview'
): Promise<EducationalContent[]> {
  const { data, error } = await supabase
    .from('educational_content')
    .select('*')
    .eq('content_type', contentType)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching educational content by type:', error);
    return [];
  }

  return data || [];
}

export async function getHowItWorksContent(): Promise<EducationalContent | null> {
  return getEducationalContentBySlug('how-mpb-health-works');
}

export async function getAllEducationalContent(): Promise<EducationalContent[]> {
  const { data, error } = await supabase
    .from('educational_content')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all educational content:', error);
    return [];
  }

  return data || [];
}
