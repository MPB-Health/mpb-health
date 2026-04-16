// ============================================================================
// Health Quote Service
// Manages health-specific quotes for leads
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LeadHealthQuote,
  LeadHealthQuoteWithLead,
  HealthQuoteCreateInput,
  HealthQuoteUpdateInput,
  HealthQuoteFilters,
  QuoteLine,
} from './planInterestTypes';

export class HealthQuoteService {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // Get Quotes for a Lead
  // ============================================================================

  async getLeadHealthQuotes(leadId: string): Promise<LeadHealthQuote[]> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HealthQuoteService] Failed to get health quotes:', error);
      throw new Error(`Failed to get health quotes: ${error.message}`);
    }

    return (data || []) as any;
  }

  // ============================================================================
  // Get Single Quote
  // ============================================================================

  async getHealthQuote(id: string): Promise<LeadHealthQuoteWithLead | null> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .select(`
        id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by,
        lead:lead_submissions(id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[HealthQuoteService] Failed to get health quote:', error);
      throw new Error(`Failed to get health quote: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Get Quote by Number
  // ============================================================================

  async getHealthQuoteByNumber(quoteNumber: string): Promise<LeadHealthQuoteWithLead | null> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .select(`
        id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by,
        lead:lead_submissions(id, first_name, last_name, email, phone)
      `)
      .eq('quote_number', quoteNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[HealthQuoteService] Failed to get health quote by number:', error);
      throw new Error(`Failed to get health quote: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Create Health Quote
  // ============================================================================

  async createHealthQuote(input: HealthQuoteCreateInput): Promise<LeadHealthQuote> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Generate quote number
    const { data: quoteNumber } = await this.supabase
      .rpc('generate_health_quote_number');

    // Calculate totals
    const totalMonthly = input.quote_lines.reduce((sum, line) => sum + line.monthly_rate, 0);
    const totalAnnual = input.quote_lines.reduce((sum, line) => sum + line.annual_rate, 0);

    // Calculate valid until (default 30 days)
    const validUntil = input.valid_until || new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .insert({
        lead_id: input.lead_id,
        quote_number: quoteNumber || `HQ-${Date.now()}`,
        status: 'draft',
        household_type: input.household_type,
        member_count: input.member_count || this.calculateMemberCount(input),
        primary_age: input.primary_age,
        spouse_age: input.spouse_age,
        dependent_ages: input.dependent_ages,
        state: input.state,
        zip_code: input.zip_code,
        tobacco_user: input.tobacco_user || false,
        quote_lines: input.quote_lines,
        total_monthly: totalMonthly,
        total_annual: totalAnnual,
        valid_until: validUntil,
        source: input.source || 'crm',
        website_submission_id: input.website_submission_id,
        notes: input.notes,
        created_by: user?.id,
      })
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to create health quote:', error);
      throw new Error(`Failed to create health quote: ${error.message}`);
    }

    return data as any;
  }

  private calculateMemberCount(input: HealthQuoteCreateInput): number {
    let count = 1; // Primary member
    if (input.spouse_age) count++;
    if (input.dependent_ages) count += input.dependent_ages.length;
    return count;
  }

  // ============================================================================
  // Update Health Quote
  // ============================================================================

  async updateHealthQuote(
    id: string,
    input: HealthQuoteUpdateInput
  ): Promise<LeadHealthQuote> {
    const updateData: Record<string, unknown> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.quote_lines !== undefined) {
      updateData.quote_lines = input.quote_lines;
      updateData.total_monthly = input.quote_lines.reduce((sum, line) => sum + line.monthly_rate, 0);
      updateData.total_annual = input.quote_lines.reduce((sum, line) => sum + line.annual_rate, 0);
    }
    if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.decline_reason !== undefined) updateData.decline_reason = input.decline_reason;

    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update(updateData)
      .eq('id', id)
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to update health quote:', error);
      throw new Error(`Failed to update health quote: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Mark Quote as unknown as Sent
  // ============================================================================

  async markQuoteSent(id: string): Promise<LeadHealthQuote> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to mark quote as unknown as sent:', error);
      throw new Error(`Failed to mark quote as unknown as sent: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Mark Quote as unknown as Viewed
  // ============================================================================

  async markQuoteViewed(id: string): Promise<LeadHealthQuote> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'sent') // Only update if currently sent
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to mark quote as unknown as viewed:', error);
      throw new Error(`Failed to mark quote as unknown as viewed: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Accept/Decline Quote
  // ============================================================================

  async acceptQuote(id: string): Promise<LeadHealthQuote> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to accept quote:', error);
      throw new Error(`Failed to accept quote: ${error.message}`);
    }

    return data as any;
  }

  async declineQuote(id: string, reason?: string): Promise<LeadHealthQuote> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason,
      })
      .eq('id', id)
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('[HealthQuoteService] Failed to decline quote:', error);
      throw new Error(`Failed to decline quote: ${error.message}`);
    }

    return data as any;
  }

  // ============================================================================
  // Delete Health Quote
  // ============================================================================

  async deleteHealthQuote(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('crm_lead_health_quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HealthQuoteService] Failed to delete health quote:', error);
      throw new Error(`Failed to delete health quote: ${error.message}`);
    }
  }

  // ============================================================================
  // Query Health Quotes
  // ============================================================================

  async queryHealthQuotes(
    filters: HealthQuoteFilters,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ data: LeadHealthQuoteWithLead[]; total: number }> {
    let query = this.supabase
      .from('crm_lead_health_quotes')
      .select(`
        id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by,
        lead:lead_submissions(id, first_name, last_name, email, phone)
      `, { count: 'exact' });

    // Apply filters
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.household_type) {
      query = query.eq('household_type', filters.household_type);
    }
    if (filters.validOnly) {
      query = query.gte('valid_until', new Date().toISOString().split('T')[0]);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false });
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[HealthQuoteService] Failed to query health quotes:', error);
      throw new Error(`Failed to query health quotes: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // ============================================================================
  // Get Quote Statistics
  // ============================================================================

  async getQuoteStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalValue: number;
    avgQuoteValue: number;
    conversionRate: number;
  }> {
    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .select('status, total_monthly');

    if (error) {
      console.error('[HealthQuoteService] Failed to get quote stats:', error);
      throw new Error(`Failed to get quote stats: ${error.message}`);
    }

    const quotes = data || [];
    const byStatus: Record<string, number> = {};
    let totalValue = 0;

    quotes.forEach((q) => {
      byStatus[q.status] = (byStatus[q.status] || 0) + 1;
      if (q.total_monthly) totalValue += q.total_monthly;
    });

    const acceptedCount = byStatus['accepted'] || 0;
    const sentCount = byStatus['sent'] || 0;
    const viewedCount = byStatus['viewed'] || 0;
    const declinedCount = byStatus['declined'] || 0;

    const closedQuotes = acceptedCount + declinedCount;
    const conversionRate = closedQuotes > 0 ? (acceptedCount / closedQuotes) * 100 : 0;

    return {
      total: quotes.length,
      byStatus,
      totalValue,
      avgQuoteValue: quotes.length > 0 ? totalValue / quotes.length : 0,
      conversionRate,
    };
  }

  // ============================================================================
  // Expire Old Quotes
  // ============================================================================

  async expireOldQuotes(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('crm_lead_health_quotes')
      .update({ status: 'expired' })
      .lt('valid_until', today)
      .in('status', ['draft', 'sent', 'viewed'])
      .select('id, lead_id, org_id, quote_number, status, household_type, member_count, primary_age, spouse_age, dependent_ages, state, zip_code, tobacco_user, quote_lines, total_monthly, total_annual, valid_from, valid_until, source, website_submission_id, sent_at, viewed_at, accepted_at, declined_at, decline_reason, notes, created_at, updated_at, created_by');

    if (error) {
      console.error('[HealthQuoteService] Failed to expire old quotes:', error);
      throw new Error(`Failed to expire old quotes: ${error.message}`);
    }

    return data?.length || 0;
  }

  // ============================================================================
  // Duplicate Quote
  // ============================================================================

  async duplicateQuote(id: string): Promise<LeadHealthQuote> {
    const original = await this.getHealthQuote(id);
    if (!original) {
      throw new Error('Quote not found');
    }

    return this.createHealthQuote({
      lead_id: original.lead_id,
      household_type: original.household_type,
      member_count: original.member_count,
      primary_age: original.primary_age,
      spouse_age: original.spouse_age || undefined,
      dependent_ages: original.dependent_ages || undefined,
      state: original.state || undefined,
      zip_code: original.zip_code || undefined,
      tobacco_user: original.tobacco_user,
      quote_lines: original.quote_lines,
      notes: original.notes || undefined,
    });
  }
}

// Factory function
export function createHealthQuoteService(supabase: SupabaseClient): HealthQuoteService {
  return new HealthQuoteService(supabase);
}
