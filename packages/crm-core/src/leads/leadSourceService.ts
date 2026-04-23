import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Row from `public.crm_lead_source_types`. The DB-side trigger
 * `crm_validate_lead_source` enforces that every `lead_submissions.lead_source`
 * matches a slug in this table and derives `is_self_generated` from the lookup.
 *
 * The UI intake picker MUST source its options from this service — never from
 * a hardcoded list — so that operators adding a new source row in the DB
 * surfaces automatically.
 */
export interface LeadSourceType {
  id: string;
  slug: string;
  label: string;
  is_self_generated: boolean;
  sort_order: number;
  is_active: boolean;
}

export class LeadSourceService {
  constructor(private supabase: SupabaseClient) {}

  async listActive(): Promise<LeadSourceType[]> {
    const { data, error } = await this.supabase
      .from('crm_lead_source_types')
      .select('id, slug, label, is_self_generated, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to load lead source types:', error);
      return [];
    }

    return (data ?? []) as LeadSourceType[];
  }

  async findBySlug(slug: string): Promise<LeadSourceType | null> {
    const { data, error } = await this.supabase
      .from('crm_lead_source_types')
      .select('id, slug, label, is_self_generated, sort_order, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch lead source type:', error);
      return null;
    }
    return (data as LeadSourceType | null) ?? null;
  }
}

export function createLeadSourceService(supabase: SupabaseClient): LeadSourceService {
  return new LeadSourceService(supabase);
}
