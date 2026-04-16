import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReferralPartner,
  ReferralPartnerInput,
  Referral,
  ReferralInput,
  PartnerStats,
  RepReferralStats,
} from './types';

export class ReferralService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  // ── Partners ───────────────────────────────────────────────────────

  async getPartners(activeOnly = false): Promise<ReferralPartner[]> {
    let query = this.supabase
      .from('crm_referral_partners')
      .select('id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at')
      .eq('org_id', this.orgId)
      .order('name');

    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) {
      console.error('Failed to get referral partners:', error);
      return [];
    }
    return data as unknown as ReferralPartner[];
  }

  async getPartner(id: string): Promise<ReferralPartner | null> {
    const { data, error } = await this.supabase
      .from('crm_referral_partners')
      .select('id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as unknown as ReferralPartner;
  }

  async createPartner(input: ReferralPartnerInput): Promise<ReferralPartner | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_referral_partners')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select('id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to create referral partner:', error);
      return null;
    }
    return data as unknown as ReferralPartner;
  }

  async updatePartner(
    id: string,
    input: Partial<ReferralPartnerInput>
  ): Promise<ReferralPartner | null> {
    const { data, error } = await this.supabase
      .from('crm_referral_partners')
      .update(input)
      .eq('id', id)
      .select('id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to update referral partner:', error);
      return null;
    }
    return data as unknown as ReferralPartner;
  }

  async deletePartner(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_referral_partners')
      .delete()
      .eq('id', id);

    return !error;
  }

  // ── Referrals ──────────────────────────────────────────────────────

  async getReferrals(
    filters: { partner_id?: string; direction?: string; status?: string } = {},
    limit = 50,
    offset = 0
  ): Promise<{ referrals: Referral[]; total: number }> {
    let query = this.supabase
      .from('crm_referrals')
      .select('id, org_id, partner_id, lead_id, contact_id, referred_by, direction, status, notes, created_at, updated_at, partner:crm_referral_partners(id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at)', { count: 'exact' })
      .eq('org_id', this.orgId);

    if (filters.partner_id) query = query.eq('partner_id', filters.partner_id);
    if (filters.direction) query = query.eq('direction', filters.direction);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to get referrals:', error);
      return { referrals: [], total: 0 };
    }
    return { referrals: data as unknown as Referral[], total: count || 0 };
  }

  async createReferral(input: ReferralInput): Promise<Referral | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_referrals')
      .insert({
        org_id: this.orgId,
        ...input,
        referred_by: user?.id,
      })
      .select('id, org_id, partner_id, lead_id, contact_id, referred_by, direction, status, notes, created_at, updated_at, partner:crm_referral_partners(id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at)')
      .single();

    if (error) {
      console.error('Failed to create referral:', error);
      return null;
    }
    return data as unknown as Referral;
  }

  async updateReferral(
    id: string,
    input: Partial<ReferralInput>
  ): Promise<Referral | null> {
    const { data, error } = await this.supabase
      .from('crm_referrals')
      .update(input)
      .eq('id', id)
      .select('id, org_id, partner_id, lead_id, contact_id, referred_by, direction, status, notes, created_at, updated_at, partner:crm_referral_partners(id, org_id, name, partner_type, company, email, phone, notes, is_active, created_by, created_at, updated_at)')
      .single();

    if (error) {
      console.error('Failed to update referral:', error);
      return null;
    }
    return data as unknown as Referral;
  }

  async deleteReferral(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_referrals')
      .delete()
      .eq('id', id);
    return !error;
  }

  // ── Stats ──────────────────────────────────────────────────────────

  async getPartnerStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PartnerStats[]> {
    let query = this.supabase
      .from('crm_referrals')
      .select('partner_id, direction, status, partner:crm_referral_partners(name)')
      .eq('org_id', this.orgId);

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error || !data) return [];

    const map = new Map<string, PartnerStats>();
    for (const row of data as any[]) {
      const pid = row.partner_id;
      if (!map.has(pid)) {
        map.set(pid, {
          partner_id: pid,
          partner_name: row.partner?.name || 'Unknown',
          referrals_requested: 0,
          referrals_received: 0,
          converted: 0,
        });
      }
      const stats = map.get(pid)!;
      if (row.direction === 'requested') stats.referrals_requested++;
      if (row.direction === 'received') stats.referrals_received++;
      if (row.status === 'converted') stats.converted++;
    }

    return Array.from(map.values());
  }

  async getRepReferralStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<RepReferralStats[]> {
    let query = this.supabase
      .from('crm_referrals')
      .select('referred_by, direction, status')
      .eq('org_id', this.orgId);

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error || !data) return [];

    const map = new Map<string, RepReferralStats>();
    for (const row of data as any[]) {
      const rid = row.referred_by;
      if (!map.has(rid)) {
        map.set(rid, {
          rep_id: rid,
          rep_name: '',
          requested: 0,
          received: 0,
          converted: 0,
        });
      }
      const stats = map.get(rid)!;
      if (row.direction === 'requested') stats.requested++;
      if (row.direction === 'received') stats.received++;
      if (row.status === 'converted') stats.converted++;
    }

    return Array.from(map.values());
  }
}

export function createReferralService(
  supabase: SupabaseClient,
  orgId: string
): ReferralService {
  return new ReferralService(supabase, orgId);
}
