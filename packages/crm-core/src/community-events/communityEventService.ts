import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CommunityEvent,
  CommunityEventInput,
  CommunityEventStats,
} from './types';

export class CommunityEventService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getEvents(
    filters: { dateFrom?: string; dateTo?: string; type?: string; repId?: string } = {},
    limit = 50,
    offset = 0
  ): Promise<{ events: CommunityEvent[]; total: number }> {
    let query = this.supabase
      .from('crm_community_events')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId);

    if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('event_date', filters.dateTo);
    if (filters.type) query = query.eq('event_type', filters.type);
    if (filters.repId) query = query.eq('rep_id', filters.repId);

    const { data, error, count } = await query
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to get community events:', error);
      return { events: [], total: 0 };
    }
    return { events: data as CommunityEvent[], total: count || 0 };
  }

  async getEvent(id: string): Promise<CommunityEvent | null> {
    const { data, error } = await this.supabase
      .from('crm_community_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as CommunityEvent;
  }

  async createEvent(input: CommunityEventInput): Promise<CommunityEvent | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_community_events')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create community event:', error);
      return null;
    }
    return data as CommunityEvent;
  }

  async updateEvent(
    id: string,
    input: Partial<CommunityEventInput>
  ): Promise<CommunityEvent | null> {
    const { data, error } = await this.supabase
      .from('crm_community_events')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update community event:', error);
      return null;
    }
    return data as CommunityEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_community_events')
      .delete()
      .eq('id', id);
    return !error;
  }

  async getEventStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<CommunityEventStats> {
    let query = this.supabase
      .from('crm_community_events')
      .select('event_type, contacts_captured, leads_generated')
      .eq('org_id', this.orgId);

    if (dateFrom) query = query.gte('event_date', dateFrom);
    if (dateTo) query = query.lte('event_date', dateTo);

    const { data, error } = await query;
    if (error || !data) {
      return { total_events: 0, total_contacts: 0, total_leads: 0, by_type: {} };
    }

    const byType: Record<string, number> = {};
    let totalContacts = 0;
    let totalLeads = 0;

    for (const row of data) {
      totalContacts += row.contacts_captured || 0;
      totalLeads += row.leads_generated || 0;
      byType[row.event_type] = (byType[row.event_type] || 0) + 1;
    }

    return {
      total_events: data.length,
      total_contacts: totalContacts,
      total_leads: totalLeads,
      by_type: byType,
    };
  }
}

export function createCommunityEventService(
  supabase: SupabaseClient,
  orgId: string
): CommunityEventService {
  return new CommunityEventService(supabase, orgId);
}
