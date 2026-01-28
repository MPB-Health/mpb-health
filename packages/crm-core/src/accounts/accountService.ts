import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Account,
  AccountWithRelations,
  AccountFilters,
  AccountCreateInput,
  AccountUpdateInput,
} from './accountTypes';

export class AccountService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get accounts with optional filters and pagination
   */
  async getAccounts(
    filters: AccountFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ accounts: AccountWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_accounts')
        .select(`
          *,
          owner:auth.users!crm_accounts_owner_id_fkey(id, email, raw_user_meta_data)
        `, { count: 'exact' });

      // Apply filters
      if (filters.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,website.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get accounts:', error);
        return { accounts: [], total: 0 };
      }

      return { accounts: data as AccountWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get accounts error:', error);
      return { accounts: [], total: 0 };
    }
  }

  /**
   * Get a single account by ID with related data
   */
  async getAccount(id: string): Promise<AccountWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_accounts')
        .select(`
          *,
          parent_account:crm_accounts!crm_accounts_parent_account_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get account:', error);
        return null;
      }

      return data as AccountWithRelations;
    } catch (error) {
      console.error('Get account error:', error);
      return null;
    }
  }

  /**
   * Get contacts for an account
   */
  async getAccountContacts(accountId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_contacts')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get account contacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get account contacts error:', error);
      return [];
    }
  }

  /**
   * Get deals for an account
   */
  async getAccountDeals(accountId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deals')
        .select(`
          *,
          stage:crm_deal_stages(id, name, display_name, color)
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get account deals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get account deals error:', error);
      return [];
    }
  }

  /**
   * Create a new account
   */
  async createAccount(
    input: AccountCreateInput
  ): Promise<{ success: boolean; accountId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_accounts')
        .insert({
          ...input,
          account_type: input.account_type || 'prospect',
          tags: input.tags || [],
          address: input.address || {},
          billing_address: input.billing_address || {},
          shipping_address: input.shipping_address || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, accountId: data?.id };
    } catch (error) {
      console.error('Create account error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  /**
   * Update an account
   */
  async updateAccount(
    id: string,
    updates: AccountUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update account error:', error);
      return { success: false, error: 'Failed to update account' };
    }
  }

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Failed to delete account' };
    }
  }

  /**
   * Get unique industries for filters
   */
  async getIndustries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_accounts')
        .select('industry')
        .not('industry', 'is', null);

      if (error) {
        console.error('Failed to get industries:', error);
        return [];
      }

      const industries = [...new Set(data.map(d => d.industry).filter(Boolean))];
      return industries.sort();
    } catch (error) {
      console.error('Get industries error:', error);
      return [];
    }
  }

  /**
   * Get accounts for export
   */
  async getAccountsForExport(
    accountIds?: string[],
    filters?: AccountFilters
  ): Promise<Account[]> {
    try {
      let query = this.supabase.from('crm_accounts').select('*');

      if (accountIds && accountIds.length > 0) {
        query = query.in('id', accountIds);
      } else if (filters) {
        if (filters.account_type) {
          query = query.eq('account_type', filters.account_type);
        }
        if (filters.industry) {
          query = query.eq('industry', filters.industry);
        }
        if (filters.owner_id) {
          query = query.eq('owner_id', filters.owner_id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get accounts for export:', error);
        return [];
      }

      return data as Account[];
    } catch (error) {
      console.error('Get accounts for export error:', error);
      return [];
    }
  }
}

// Factory function
export function createAccountService(supabase: SupabaseClient): AccountService {
  return new AccountService(supabase);
}
