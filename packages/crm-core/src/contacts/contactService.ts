import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Contact,
  ContactWithRelations,
  ContactFilters,
  ContactCreateInput,
  ContactUpdateInput,
  ConvertLeadInput,
} from './contactTypes';
import { sanitizeSearchInput } from '../utils/sanitize';

export class ContactService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get contacts with optional filters and pagination
   */
  async getContacts(
    filters: ContactFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ contacts: ContactWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_contacts')
        .select(`
        id, org_id, account_id, salutation, first_name, last_name, email, phone, mobile, fax, title, department, reports_to, mailing_address, other_address, lead_source, converted_from_lead_id, converted_at, do_not_call, do_not_email, email_opt_out, owner_id, tags, description, linkedin_url, twitter_handle, date_of_birth, created_by, created_at, updated_at, plan_type, carrier_id, original_effective_date, premium_amount, subsidy_amount, member_responsibility, tobacco_status, state, city,
          account:crm_accounts!crm_contacts_account_id_fkey(id, name),
          carrier:insurance_carriers!crm_contacts_carrier_id_fkey(id, name, carrier_type)
        `, { count: 'exact' });

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }
      if (filters.do_not_call !== undefined) {
        query = query.eq('do_not_call', filters.do_not_call);
      }
      if (filters.do_not_email !== undefined) {
        query = query.eq('do_not_email', filters.do_not_email);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        const safe = sanitizeSearchInput(filters.search);
        query = query.or(
          `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,mobile.ilike.%${safe}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.planType) {
        query = query.eq('plan_type', filters.planType);
      }
      if (filters.carrierId) {
        query = query.eq('carrier_id', filters.carrierId);
      }
      if (filters.tobaccoStatus) {
        query = query.eq('tobacco_status', filters.tobaccoStatus);
      }
      if (filters.state) {
        query = query.eq('state', filters.state);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get contacts:', error);
        return { contacts: [], total: 0 };
      }

      return { contacts: data as unknown as ContactWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get contacts error:', error);
      return { contacts: [], total: 0 };
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<ContactWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_contacts')
        .select(`
        id, org_id, account_id, salutation, first_name, last_name, email, phone, mobile, fax, title, department, reports_to, mailing_address, other_address, lead_source, converted_from_lead_id, converted_at, do_not_call, do_not_email, email_opt_out, owner_id, tags, description, linkedin_url, twitter_handle, date_of_birth, created_by, created_at, updated_at, plan_type, carrier_id, original_effective_date, premium_amount, subsidy_amount, member_responsibility, tobacco_status, state, city,
          account:crm_accounts!crm_contacts_account_id_fkey(id, name),
          reports_to_contact:crm_contacts!crm_contacts_reports_to_fkey(id, first_name, last_name),
          carrier:insurance_carriers!crm_contacts_carrier_id_fkey(id, name, carrier_type)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get contact:', error);
        return null;
      }

      return data as unknown as ContactWithRelations;
    } catch (error) {
      console.error('Get contact error:', error);
      return null;
    }
  }

  /**
   * Get deals for a contact
   */
  async getContactDeals(contactId: string): Promise<any[]> {
    try {
      // Get deals where contact is the primary contact
      const { data: directDeals } = await this.supabase
        .from('crm_deals')
        .select(`
        id, org_id, name, description, account_id, contact_id, amount, currency, stage_id, probability, expected_close_date, actual_close_date, deal_type, lead_source, next_step, owner_id, won_at, lost_at, lost_reason, tags, campaign_id, converted_from_lead_id, created_by, created_at, updated_at,
          stage:crm_deal_stages(id, name, display_name, color)
        `)
        .eq('contact_id', contactId);

      // Get deals via deal_contacts junction
      const { data: junctionDeals } = await this.supabase
        .from('crm_deal_contacts')
        .select(`
          deal:crm_deals(
            *,
            stage:crm_deal_stages(id, name, display_name, color)
          ),
          role,
          is_primary
        `)
        .eq('contact_id', contactId);

      const allDeals: any[] = [
        ...(directDeals || []),
        ...(junctionDeals?.map(j => ({ ...(j.deal as any), contact_role: j.role, is_primary: j.is_primary })) || [])
      ];

      const uniqueDeals = Array.from(
        new Map(allDeals.map(d => [d.id, d])).values()
      );

      return uniqueDeals;
    } catch (error) {
      console.error('Get contact deals error:', error);
      return [];
    }
  }

  /**
   * Create a new contact
   */
  async createContact(
    input: ContactCreateInput
  ): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_contacts')
        .insert({
          ...input,
          tags: input.tags || [],
          mailing_address: input.mailing_address || {},
          other_address: input.other_address || {},
          do_not_call: input.do_not_call || false,
          do_not_email: input.do_not_email || false,
          email_opt_out: input.email_opt_out || false,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, contactId: data?.id };
    } catch (error) {
      console.error('Create contact error:', error);
      return { success: false, error: 'Failed to create contact' };
    }
  }

  /**
   * Update a contact
   */
  async updateContact(
    id: string,
    updates: ContactUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update contact error:', error);
      return { success: false, error: 'Failed to update contact' };
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete contact error:', error);
      return { success: false, error: 'Failed to delete contact' };
    }
  }

  /**
   * Convert a lead to a contact
   */
  async convertLeadToContact(
    input: ConvertLeadInput
  ): Promise<{ success: boolean; contactId?: string; accountId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get the lead
      const { data: lead, error: leadError } = await this.supabase
        .from('lead_submissions')
        .select('id, org_id, first_name, last_name, email, phone, source, status, stage, priority, assigned_to, score, tags, metadata, notes, next_followup_at, created_by, created_at, updated_at, source_cta, utm_source, zip_code, plan_type, carrier_id, original_effective_date, premium_amount, subsidy_amount, member_responsibility, tobacco_status, state, city')
        .eq('id', input.leadId)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      let accountId = input.accountId;

      // Create account if requested
      if (input.createAccount && input.accountName) {
        const { data: account, error: accountError } = await this.supabase
          .from('crm_accounts')
          .insert({
            name: input.accountName,
            phone: lead.phone,
            account_type: 'prospect',
            created_by: user.user.id,
          })
          .select('id')
          .single();

        if (accountError) {
          return { success: false, error: `Failed to create account: ${accountError.message}` };
        }
        accountId = account.id;
      }

      const { data: contact, error: contactError } = await this.supabase
        .from('crm_contacts')
        .insert({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          account_id: accountId,
          lead_source: lead.source_cta || lead.utm_source,
          converted_from_lead_id: lead.id,
          converted_at: new Date().toISOString(),
          mailing_address: lead.zip_code ? { zip: lead.zip_code } : {},
          created_by: user.user.id,
          plan_type: lead.plan_type || null,
          carrier_id: lead.carrier_id || null,
          original_effective_date: lead.original_effective_date || null,
          premium_amount: lead.premium_amount ?? null,
          subsidy_amount: lead.subsidy_amount ?? null,
          member_responsibility: lead.member_responsibility ?? null,
          tobacco_status: lead.tobacco_status || null,
          state: lead.state || null,
          city: lead.city || null,
        })
        .select('id')
        .single();

      if (contactError) {
        return { success: false, error: `Failed to create contact: ${contactError.message}` };
      }

      // Update lead as unknown as converted
      await this.supabase
        .from('lead_submissions')
        .update({
          pipeline_stage: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', input.leadId);

      return {
        success: true,
        contactId: contact.id,
        accountId: accountId,
      };
    } catch (error) {
      console.error('Convert lead error:', error);
      return { success: false, error: 'Failed to convert lead' };
    }
  }

  /**
   * Get contacts for export
   */
  async getContactsForExport(
    contactIds?: string[],
    filters?: ContactFilters
  ): Promise<Contact[]> {
    try {
      let query = this.supabase.from('crm_contacts').select('id, org_id, account_id, first_name, last_name, email, phone, mobile, title, department, address, city, state, zip, country, date_of_birth, gender, source, owner_id, is_active, created_by, created_at, updated_at');

      if (contactIds && contactIds.length > 0) {
        query = query.in('id', contactIds);
      } else if (filters) {
        if (filters.account_id) {
          query = query.eq('account_id', filters.account_id);
        }
        if (filters.owner_id) {
          query = query.eq('owner_id', filters.owner_id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get contacts for export:', error);
        return [];
      }

      return data as unknown as Contact[];
    } catch (error) {
      console.error('Get contacts for export error:', error);
      return [];
    }
  }
}

// Factory function
export function createContactService(supabase: SupabaseClient): ContactService {
  return new ContactService(supabase);
}
