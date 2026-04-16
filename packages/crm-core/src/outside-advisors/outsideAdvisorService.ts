import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  OutsideAdvisor,
  OutsideAdvisorInput,
  AdvisorProduction,
} from './types';

export class OutsideAdvisorService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getAdvisors(activeOnly = false): Promise<OutsideAdvisor[]> {
    let query = this.supabase
      .from('crm_outside_advisors')
      .select('id, org_id, name, email, phone, company, license_number, states_licensed, specialties, notes, is_active, created_by, created_at, updated_at')
      .eq('org_id', this.orgId)
      .order('name');

    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) {
      console.error('Failed to get outside advisors:', error);
      return [];
    }
    return data as unknown as OutsideAdvisor[];
  }

  async getAdvisor(id: string): Promise<OutsideAdvisor | null> {
    const { data, error } = await this.supabase
      .from('crm_outside_advisors')
      .select('id, org_id, name, email, phone, company, license_number, states_licensed, specialties, notes, is_active, created_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as unknown as OutsideAdvisor;
  }

  async createAdvisor(input: OutsideAdvisorInput): Promise<OutsideAdvisor | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_outside_advisors')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select('id, org_id, name, email, phone, company, is_active, notes, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to create outside advisor:', error);
      return null;
    }
    return data as unknown as OutsideAdvisor;
  }

  async updateAdvisor(
    id: string,
    input: Partial<OutsideAdvisorInput>
  ): Promise<OutsideAdvisor | null> {
    const { data, error } = await this.supabase
      .from('crm_outside_advisors')
      .update(input)
      .eq('id', id)
      .select('id, org_id, name, email, phone, company, is_active, notes, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to update outside advisor:', error);
      return null;
    }
    return data as unknown as OutsideAdvisor;
  }

  async deleteAdvisor(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_outside_advisors')
      .delete()
      .eq('id', id);
    return !error;
  }

  async getAdvisorProduction(
    month: number,
    year: number
  ): Promise<AdvisorProduction[]> {
    const advisors = await this.getAdvisors(true);
    const results: AdvisorProduction[] = [];

    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 0, 23, 59, 59).toISOString();
    const yearStart = new Date(year, 0, 1).toISOString();

    for (const advisor of advisors) {
      const { count: leadsMonth } = await this.supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', this.orgId)
        .eq('lead_source', 'outside_advisors')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
        .ilike('source_cta', `%${advisor.name}%`);

      const { count: closedMonth } = await this.supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', this.orgId)
        .eq('lead_source', 'outside_advisors')
        .in('pipeline_stage', ['won', 'converted', 'closed_won'])
        .gte('converted_at', monthStart)
        .lte('converted_at', monthEnd)
        .ilike('source_cta', `%${advisor.name}%`);

      const { count: leadsYtd } = await this.supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', this.orgId)
        .eq('lead_source', 'outside_advisors')
        .gte('created_at', yearStart)
        .lte('created_at', monthEnd)
        .ilike('source_cta', `%${advisor.name}%`);

      const { count: closedYtd } = await this.supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', this.orgId)
        .eq('lead_source', 'outside_advisors')
        .in('pipeline_stage', ['won', 'converted', 'closed_won'])
        .gte('converted_at', yearStart)
        .lte('converted_at', monthEnd)
        .ilike('source_cta', `%${advisor.name}%`);

      results.push({
        advisor_id: advisor.id,
        advisor_name: advisor.name,
        leads_month: leadsMonth || 0,
        closed_month: closedMonth || 0,
        leads_ytd: leadsYtd || 0,
        closed_ytd: closedYtd || 0,
      });
    }

    return results;
  }
}

export function createOutsideAdvisorService(
  supabase: SupabaseClient,
  orgId: string
): OutsideAdvisorService {
  return new OutsideAdvisorService(supabase, orgId);
}
