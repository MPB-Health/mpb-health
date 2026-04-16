import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Account,
  AccountWithRelations,
  AccountFilters,
  AccountCreateInput,
  AccountUpdateInput,
} from './accountTypes';

/**
 * Sanitize a value for use inside a PostgREST filter string.
 * Escapes characters that have special meaning in PostgREST filter syntax
 * (commas, dots, parentheses, percent signs, backslashes, and asterisks)
 * to prevent filter-injection attacks.
 */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[\\%_*.,()]/g, (ch) => `\\${ch}`);
}

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
        .select('id, org_id, name, industry, website, phone, email, address, city, state, zip, country, employee_count, annual_revenue, owner_id, description, is_active, created_by, created_at, updated_at', { count: 'exact' });

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
        const safe = sanitizeFilterValue(filters.search);
        query = query.or(
          `name.ilike.%${safe}%,industry.ilike.%${safe}%,website.ilike.%${safe}%,phone.ilike.%${safe}%`
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

      // Fetch owner profiles separately (auth.users is not exposed via PostgREST)
      const accounts = (data || []) as unknown as AccountWithRelations[];
      const ownerIds = [...new Set(accounts.map(a => a.owner_id).filter(Boolean))] as string[];

      if (ownerIds.length > 0) {
        const { data: profiles } = await this.supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', ownerIds);

        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.id, p]));
          for (const account of accounts) {
            if (account.owner_id) {
              const profile = profileMap.get(account.owner_id);
              account.owner = profile
                ? { id: profile.id, email: profile.email || '', full_name: profile.full_name || null }
                : null;
            }
          }
        }
      }

      return { accounts, total: count || 0 };
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
        id, org_id, name, industry, website, phone, fax, address, billing_address, shipping_address, annual_revenue, employee_count, account_type, rating, owner_id, parent_account_id, tags, description, linkedin_url, twitter_handle, created_by, created_at, updated_at,
          parent_account:crm_accounts!crm_accounts_parent_account_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get account:', error);
        return null;
      }

      return data as unknown as AccountWithRelations;
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
        .select('id, org_id, account_id, first_name, last_name, email, phone, mobile, title, department, address, city, state, zip, country, date_of_birth, gender, source, owner_id, is_active, created_by, created_at, updated_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get account contacts:', error);
        return [];
      }

      return (data || []) as any;
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
        id, org_id, account_id, salutation, first_name, last_name, email, phone, mobile, fax, title, department, reports_to, mailing_address, other_address, lead_source, converted_from_lead_id, converted_at, do_not_call, do_not_email, email_opt_out, owner_id, tags, description, linkedin_url, twitter_handle, date_of_birth, created_by, created_at, updated_at, plan_type, carrier_id, original_effective_date, premium_amount, subsidy_amount, member_responsibility, tobacco_status, state, city,
          stage:crm_deal_stages(id, name, display_name, color)
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get account deals:', error);
        return [];
      }

      return (data || []) as any;
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
      let query = this.supabase.from('crm_accounts').select('id, org_id, name, industry, website, phone, email, address, city, state, zip, country, employee_count, annual_revenue, owner_id, description, is_active, created_by, created_at, updated_at');

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

      return data as unknown as Account[];
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
