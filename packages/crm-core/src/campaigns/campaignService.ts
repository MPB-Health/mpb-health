import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Campaign,
  CampaignWithRelations,
  CampaignMember,
  CampaignFilters,
  CampaignCreateInput,
  CampaignUpdateInput,
  CampaignMemberCreateInput,
  CampaignStats,
  MemberStatus,
} from './campaignTypes';

export class CampaignService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get campaigns with optional filters and pagination
   */
  async getCampaigns(
    filters: CampaignFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ campaigns: CampaignWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_campaigns')
        .select(`
          *,
          parent_campaign:crm_campaigns!crm_campaigns_parent_campaign_id_fkey(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.parent_campaign_id) {
        query = query.eq('parent_campaign_id', filters.parent_campaign_id);
      }
      if (filters.startDateFrom) {
        query = query.gte('start_date', filters.startDateFrom);
      }
      if (filters.startDateTo) {
        query = query.lte('start_date', filters.startDateTo);
      }
      if (filters.endDateFrom) {
        query = query.gte('end_date', filters.endDateFrom);
      }
      if (filters.endDateTo) {
        query = query.lte('end_date', filters.endDateTo);
      }
      if (filters.minBudget !== undefined) {
        query = query.gte('budget', filters.minBudget);
      }
      if (filters.maxBudget !== undefined) {
        query = query.lte('budget', filters.maxBudget);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get campaigns:', error);
        return { campaigns: [], total: 0 };
      }

      return { campaigns: data as CampaignWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get campaigns error:', error);
      return { campaigns: [], total: 0 };
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(id: string): Promise<CampaignWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_campaigns')
        .select(`
          *,
          parent_campaign:crm_campaigns!crm_campaigns_parent_campaign_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get campaign:', error);
        return null;
      }

      // Get member counts
      const { count: membersCount } = await this.supabase
        .from('crm_campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id);

      const { count: leadsCount } = await this.supabase
        .from('crm_campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .not('lead_id', 'is', null);

      const { count: contactsCount } = await this.supabase
        .from('crm_campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .not('contact_id', 'is', null);

      return {
        ...data,
        members_count: membersCount || 0,
        leads_count: leadsCount || 0,
        contacts_count: contactsCount || 0,
      } as CampaignWithRelations;
    } catch (error) {
      console.error('Get campaign error:', error);
      return null;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    input: CampaignCreateInput
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_campaigns')
        .insert({
          ...input,
          campaign_type: input.campaign_type || 'email',
          status: input.status || 'draft',
          tags: input.tags || [],
          metadata: input.metadata || {},
          num_sent: 0,
          num_responses: 0,
          num_converted: 0,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, campaignId: data?.id };
    } catch (error) {
      console.error('Create campaign error:', error);
      return { success: false, error: 'Failed to create campaign' };
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    id: string,
    updates: CampaignUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update campaign error:', error);
      return { success: false, error: 'Failed to update campaign' };
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_campaigns')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete campaign error:', error);
      return { success: false, error: 'Failed to delete campaign' };
    }
  }

  /**
   * Get campaign members
   */
  async getCampaignMembers(
    campaignId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ members: CampaignMember[]; total: number }> {
    try {
      const { data, error, count } = await this.supabase
        .from('crm_campaign_members')
        .select(`
          *,
          lead:crm_leads(id, first_name, last_name, email, company),
          contact:crm_contacts(id, first_name, last_name, email, account_id)
        `, { count: 'exact' })
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get campaign members:', error);
        return { members: [], total: 0 };
      }

      return { members: data as CampaignMember[], total: count || 0 };
    } catch (error) {
      console.error('Get campaign members error:', error);
      return { members: [], total: 0 };
    }
  }

  /**
   * Add members to a campaign
   */
  async addMembers(
    campaignId: string,
    members: CampaignMemberCreateInput[]
  ): Promise<{ success: boolean; addedCount: number; error?: string }> {
    try {
      const membersToInsert = members.map(m => ({
        campaign_id: campaignId,
        lead_id: m.lead_id || null,
        contact_id: m.contact_id || null,
        status: m.status || 'pending',
        notes: m.notes || null,
      }));

      const { data, error } = await this.supabase
        .from('crm_campaign_members')
        .insert(membersToInsert)
        .select('id');

      if (error) {
        return { success: false, addedCount: 0, error: error.message };
      }

      return { success: true, addedCount: data?.length || 0 };
    } catch (error) {
      console.error('Add members error:', error);
      return { success: false, addedCount: 0, error: 'Failed to add members' };
    }
  }

  /**
   * Add leads to a campaign
   */
  async addLeadsToCampaign(
    campaignId: string,
    leadIds: string[]
  ): Promise<{ success: boolean; addedCount: number; error?: string }> {
    const members = leadIds.map(id => ({ lead_id: id }));
    return this.addMembers(campaignId, members);
  }

  /**
   * Add contacts to a campaign
   */
  async addContactsToCampaign(
    campaignId: string,
    contactIds: string[]
  ): Promise<{ success: boolean; addedCount: number; error?: string }> {
    const members = contactIds.map(id => ({ contact_id: id }));
    return this.addMembers(campaignId, members);
  }

  /**
   * Remove members from a campaign
   */
  async removeMembers(
    campaignId: string,
    memberIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_campaign_members')
        .delete()
        .eq('campaign_id', campaignId)
        .in('id', memberIds);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Remove members error:', error);
      return { success: false, error: 'Failed to remove members' };
    }
  }

  /**
   * Update member status
   */
  async updateMemberStatus(
    memberId: string,
    status: MemberStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: Partial<CampaignMember> = { status };
      const now = new Date().toISOString();

      // Set timestamp based on status
      switch (status) {
        case 'sent':
          updates.sent_at = now;
          break;
        case 'opened':
          updates.opened_at = now;
          break;
        case 'clicked':
          updates.clicked_at = now;
          break;
        case 'responded':
          updates.responded_at = now;
          break;
        case 'converted':
          updates.converted_at = now;
          break;
        case 'unsubscribed':
          updates.unsubscribed_at = now;
          break;
      }

      const { error } = await this.supabase
        .from('crm_campaign_members')
        .update(updates)
        .eq('id', memberId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update campaign counters
      const { data: member } = await this.supabase
        .from('crm_campaign_members')
        .select('campaign_id')
        .eq('id', memberId)
        .single();

      if (member?.campaign_id) {
        await this.updateCampaignCounters(member.campaign_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Update member status error:', error);
      return { success: false, error: 'Failed to update member status' };
    }
  }

  /**
   * Update campaign counters based on member statuses
   */
  private async updateCampaignCounters(campaignId: string): Promise<void> {
    try {
      const { data: members } = await this.supabase
        .from('crm_campaign_members')
        .select('status')
        .eq('campaign_id', campaignId);

      if (!members) return;

      let numSent = 0;
      let numResponses = 0;
      let numConverted = 0;

      for (const m of members) {
        if (['sent', 'opened', 'clicked', 'responded', 'converted'].includes(m.status)) {
          numSent++;
        }
        if (['responded', 'converted'].includes(m.status)) {
          numResponses++;
        }
        if (m.status === 'converted') {
          numConverted++;
        }
      }

      await this.supabase
        .from('crm_campaigns')
        .update({ num_sent: numSent, num_responses: numResponses, num_converted: numConverted })
        .eq('id', campaignId);
    } catch (error) {
      console.error('Update campaign counters error:', error);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      const { data: members } = await this.supabase
        .from('crm_campaign_members')
        .select('status')
        .eq('campaign_id', campaignId);

      const { data: campaign } = await this.supabase
        .from('crm_campaigns')
        .select('budget, actual_cost, actual_revenue')
        .eq('id', campaignId)
        .single();

      if (!members) {
        return this.emptyStats();
      }

      const totalMembers = members.length;
      const sentCount = members.filter(m =>
        ['sent', 'opened', 'clicked', 'responded', 'converted'].includes(m.status)
      ).length;
      const openedCount = members.filter(m =>
        ['opened', 'clicked', 'responded', 'converted'].includes(m.status)
      ).length;
      const clickedCount = members.filter(m =>
        ['clicked', 'responded', 'converted'].includes(m.status)
      ).length;
      const respondedCount = members.filter(m =>
        ['responded', 'converted'].includes(m.status)
      ).length;
      const convertedCount = members.filter(m => m.status === 'converted').length;
      const unsubscribedCount = members.filter(m => m.status === 'unsubscribed').length;
      const bouncedCount = members.filter(m => m.status === 'bounced').length;

      // Calculate rates
      const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0;
      const clickRate = sentCount > 0 ? (clickedCount / sentCount) * 100 : 0;
      const responseRate = sentCount > 0 ? (respondedCount / sentCount) * 100 : 0;
      const conversionRate = sentCount > 0 ? (convertedCount / sentCount) * 100 : 0;

      // Calculate ROI
      let roi: number | null = null;
      if (campaign?.actual_cost && campaign.actual_cost > 0 && campaign.actual_revenue !== null) {
        roi = ((campaign.actual_revenue - campaign.actual_cost) / campaign.actual_cost) * 100;
      }

      return {
        totalMembers,
        sentCount,
        openedCount,
        clickedCount,
        respondedCount,
        convertedCount,
        unsubscribedCount,
        bouncedCount,
        openRate,
        clickRate,
        responseRate,
        conversionRate,
        roi,
      };
    } catch (error) {
      console.error('Get campaign stats error:', error);
      return this.emptyStats();
    }
  }

  private emptyStats(): CampaignStats {
    return {
      totalMembers: 0,
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
      respondedCount: 0,
      convertedCount: 0,
      unsubscribedCount: 0,
      bouncedCount: 0,
      openRate: 0,
      clickRate: 0,
      responseRate: 0,
      conversionRate: 0,
      roi: null,
    };
  }

  /**
   * Start a campaign (set status to active)
   */
  async startCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateCampaign(id, {
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateCampaign(id, { status: 'paused' });
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateCampaign(id, {
      status: 'completed',
      end_date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_campaigns')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Failed to get active campaigns:', error);
        return [];
      }

      return data as Campaign[];
    } catch (error) {
      console.error('Get active campaigns error:', error);
      return [];
    }
  }

  /**
   * Get campaign types for filters
   */
  getCampaignTypes(): string[] {
    return ['email', 'social', 'event', 'webinar', 'advertisement', 'referral', 'other'];
  }
}

// Factory function
export function createCampaignService(supabase: SupabaseClient): CampaignService {
  return new CampaignService(supabase);
}
