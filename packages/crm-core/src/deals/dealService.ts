import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Deal,
  DealWithRelations,
  DealStage,
  DealFilters,
  DealCreateInput,
  DealUpdateInput,
  DealStageHistory,
} from './dealTypes';

export class DealService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get deals with optional filters and pagination
   */
  async getDeals(
    filters: DealFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ deals: DealWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_deals')
        .select(`
          *,
          account:crm_accounts!crm_deals_account_id_fkey(id, name),
          contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email),
          stage:crm_deal_stages!crm_deals_stage_id_fkey(id, name, display_name, color, probability, is_won_stage, is_lost_stage)
        `, { count: 'exact' });

      // Apply filters
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters.stage_id) {
        query = query.eq('stage_id', filters.stage_id);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.deal_type) {
        query = query.eq('deal_type', filters.deal_type);
      }
      if (filters.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }
      if (filters.closeFrom) {
        query = query.gte('expected_close_date', filters.closeFrom);
      }
      if (filters.closeTo) {
        query = query.lte('expected_close_date', filters.closeTo);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Exclude won/lost unless explicitly included
      if (!filters.includeWon) {
        query = query.is('won_at', null);
      }
      if (!filters.includeLost) {
        query = query.is('lost_at', null);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get deals:', error);
        return { deals: [], total: 0 };
      }

      return { deals: data as DealWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get deals error:', error);
      return { deals: [], total: 0 };
    }
  }

  /**
   * Get deals grouped by stage for pipeline view
   */
  async getDealsByStage(): Promise<Record<string, DealWithRelations[]>> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deals')
        .select(`
          *,
          account:crm_accounts!crm_deals_account_id_fkey(id, name),
          contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email),
          stage:crm_deal_stages!crm_deals_stage_id_fkey(id, name, display_name, color, probability, is_won_stage, is_lost_stage)
        `)
        .is('won_at', null)
        .is('lost_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get deals by stage:', error);
        return {};
      }

      const grouped: Record<string, DealWithRelations[]> = {};
      for (const deal of data || []) {
        const stageName = deal.stage?.name || 'unknown';
        if (!grouped[stageName]) {
          grouped[stageName] = [];
        }
        grouped[stageName].push(deal as DealWithRelations);
      }

      return grouped;
    } catch (error) {
      console.error('Get deals by stage error:', error);
      return {};
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<DealWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deals')
        .select(`
          *,
          account:crm_accounts!crm_deals_account_id_fkey(id, name),
          contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email),
          stage:crm_deal_stages!crm_deals_stage_id_fkey(id, name, display_name, color, probability, is_won_stage, is_lost_stage)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get deal:', error);
        return null;
      }

      return data as DealWithRelations;
    } catch (error) {
      console.error('Get deal error:', error);
      return null;
    }
  }

  /**
   * Get stage history for a deal
   */
  async getDealStageHistory(dealId: string): Promise<DealStageHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deal_stage_history')
        .select(`
          *,
          from_stage:crm_deal_stages!crm_deal_stage_history_from_stage_id_fkey(name, display_name, color),
          to_stage:crm_deal_stages!crm_deal_stage_history_to_stage_id_fkey(name, display_name, color)
        `)
        .eq('deal_id', dealId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Failed to get stage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get stage history error:', error);
      return [];
    }
  }

  /**
   * Get contacts for a deal
   */
  async getDealContacts(dealId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deal_contacts')
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, email, title, phone)
        `)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Failed to get deal contacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get deal contacts error:', error);
      return [];
    }
  }

  /**
   * Get products for a deal
   */
  async getDealProducts(dealId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deal_products')
        .select(`
          *,
          product:crm_products(id, name, code, unit_price)
        `)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Failed to get deal products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get deal products error:', error);
      return [];
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(
    input: DealCreateInput
  ): Promise<{ success: boolean; dealId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_deals')
        .insert({
          ...input,
          deal_type: input.deal_type || 'new_business',
          currency: input.currency || 'USD',
          tags: input.tags || [],
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, dealId: data?.id };
    } catch (error) {
      console.error('Create deal error:', error);
      return { success: false, error: 'Failed to create deal' };
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(
    id: string,
    updates: DealUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update deal error:', error);
      return { success: false, error: 'Failed to update deal' };
    }
  }

  /**
   * Update deal stage
   */
  async updateDealStage(
    id: string,
    stageId: string,
    lostReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const updates: DealUpdateInput = { stage_id: stageId };
    if (lostReason) {
      updates.lost_reason = lostReason;
    }
    return this.updateDeal(id, updates);
  }

  /**
   * Mark deal as won
   */
  async markDealWon(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the won stage
      const { data: wonStage } = await this.supabase
        .from('crm_deal_stages')
        .select('id')
        .eq('is_won_stage', true)
        .single();

      if (!wonStage) {
        return { success: false, error: 'No won stage configured' };
      }

      return this.updateDeal(id, { stage_id: wonStage.id });
    } catch (error) {
      console.error('Mark deal won error:', error);
      return { success: false, error: 'Failed to mark deal as won' };
    }
  }

  /**
   * Mark deal as lost
   */
  async markDealLost(
    id: string,
    lostReason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the lost stage
      const { data: lostStage } = await this.supabase
        .from('crm_deal_stages')
        .select('id')
        .eq('is_lost_stage', true)
        .single();

      if (!lostStage) {
        return { success: false, error: 'No lost stage configured' };
      }

      return this.updateDeal(id, { stage_id: lostStage.id, lost_reason: lostReason });
    } catch (error) {
      console.error('Mark deal lost error:', error);
      return { success: false, error: 'Failed to mark deal as lost' };
    }
  }

  /**
   * Add contact to deal
   */
  async addContactToDeal(
    dealId: string,
    contactId: string,
    role?: string,
    isPrimary?: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_deal_contacts')
        .insert({
          deal_id: dealId,
          contact_id: contactId,
          role,
          is_primary: isPrimary || false,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Add contact to deal error:', error);
      return { success: false, error: 'Failed to add contact' };
    }
  }

  /**
   * Add product to deal
   */
  async addProductToDeal(
    dealId: string,
    productId: string,
    quantity: number,
    unitPrice: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_deal_products')
        .insert({
          deal_id: dealId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          total: quantity * unitPrice,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Add product to deal error:', error);
      return { success: false, error: 'Failed to add product' };
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_deals')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete deal error:', error);
      return { success: false, error: 'Failed to delete deal' };
    }
  }

  /**
   * Get deal stages
   */
  async getStages(): Promise<DealStage[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deal_stages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get stages:', error);
        return [];
      }

      return data as DealStage[];
    } catch (error) {
      console.error('Get stages error:', error);
      return [];
    }
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(): Promise<{
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
    byStage: { stage: string; count: number; value: number }[];
  }> {
    try {
      const { data: deals } = await this.supabase
        .from('crm_deals')
        .select(`
          amount,
          probability,
          stage:crm_deal_stages(name, display_name)
        `)
        .is('won_at', null)
        .is('lost_at', null);

      if (!deals) {
        return { totalDeals: 0, totalValue: 0, weightedValue: 0, byStage: [] };
      }

      const stageMap: Record<string, { count: number; value: number }> = {};
      let totalValue = 0;
      let weightedValue = 0;

      for (const deal of deals) {
        const amount = deal.amount || 0;
        const prob = (deal.probability || 0) / 100;
        const stageData = deal.stage as unknown as { name: string; display_name: string } | { name: string; display_name: string }[] | null;
        const stageName = Array.isArray(stageData) ? stageData[0]?.name : stageData?.name || 'unknown';

        totalValue += amount;
        weightedValue += amount * prob;

        if (!stageMap[stageName]) {
          stageMap[stageName] = { count: 0, value: 0 };
        }
        stageMap[stageName].count++;
        stageMap[stageName].value += amount;
      }

      const byStage = Object.entries(stageMap).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value,
      }));

      return {
        totalDeals: deals.length,
        totalValue,
        weightedValue,
        byStage,
      };
    } catch (error) {
      console.error('Get pipeline stats error:', error);
      return { totalDeals: 0, totalValue: 0, weightedValue: 0, byStage: [] };
    }
  }
}

// Factory function
export function createDealService(supabase: SupabaseClient): DealService {
  return new DealService(supabase);
}
