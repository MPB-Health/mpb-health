import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Quote,
  QuoteWithRelations,
  QuoteLineItem,
  QuoteFilters,
  QuoteCreateInput,
  QuoteUpdateInput,
  QuoteLineItemCreateInput,
  QuoteLineItemUpdateInput,
} from './quoteTypes';

export class QuoteService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get quotes with optional filters and pagination
   */
  async getQuotes(
    filters: QuoteFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ quotes: QuoteWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_quotes')
        .select(`
        id, org_id, quote_number, name, description, deal_id, account_id, contact_id, status, subtotal, discount_percent, discount_amount, tax_amount, shipping_amount, total, currency, valid_until, sent_at, accepted_at, rejected_at, rejection_reason, terms_and_conditions, notes, billing_address, shipping_address, price_book_id, template_id, owner_id, created_by, created_at, updated_at,
          deal:crm_deals!crm_quotes_deal_id_fkey(id, name),
          account:crm_accounts!crm_quotes_account_id_fkey(id, name),
          contact:crm_contacts!crm_quotes_contact_id_fkey(id, first_name, last_name, email)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.deal_id) {
        query = query.eq('deal_id', filters.deal_id);
      }
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.validFrom) {
        query = query.gte('valid_until', filters.validFrom);
      }
      if (filters.validTo) {
        query = query.lte('valid_until', filters.validTo);
      }
      if (filters.minTotal !== undefined) {
        query = query.gte('total', filters.minTotal);
      }
      if (filters.maxTotal !== undefined) {
        query = query.lte('total', filters.maxTotal);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,quote_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get quotes:', error);
        return { quotes: [], total: 0 };
      }

      return { quotes: data as unknown as QuoteWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get quotes error:', error);
      return { quotes: [], total: 0 };
    }
  }

  /**
   * Get a single quote by ID with line items
   */
  async getQuote(id: string): Promise<QuoteWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_quotes')
        .select(`
        id, org_id, quote_number, name, description, deal_id, account_id, contact_id, status, subtotal, discount_percent, discount_amount, tax_amount, shipping_amount, total, currency, valid_until, sent_at, accepted_at, rejected_at, rejection_reason, terms_and_conditions, notes, billing_address, shipping_address, price_book_id, template_id, owner_id, created_by, created_at, updated_at,
          deal:crm_deals!crm_quotes_deal_id_fkey(id, name),
          account:crm_accounts!crm_quotes_account_id_fkey(id, name),
          contact:crm_contacts!crm_quotes_contact_id_fkey(id, first_name, last_name, email),
          line_items:crm_quote_line_items(
            id,
            product_id,
            name,
            description,
            quantity,
            unit_price,
            discount_percent,
            discount_amount,
            tax_rate,
            subtotal,
            total,
            sort_order,
            created_at,
            updated_at,
            product:crm_products(id, name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get quote:', error);
        return null;
      }

      // Sort line items by sort_order
      if (data.line_items) {
        (data.line_items as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order);
      }

      return data as unknown as QuoteWithRelations;
    } catch (error) {
      console.error('Get quote error:', error);
      return null;
    }
  }

  /**
   * Get line items for a quote
   */
  async getQuoteLineItems(quoteId: string): Promise<QuoteLineItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_quote_line_items')
        .select(`
        id, quote_id, product_id, name, description, quantity, unit_price, discount_percent, discount_amount, tax_rate, subtotal, total, sort_order, created_at, updated_at,
          product:crm_products(id, name, code)
        `)
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get quote line items:', error);
        return [];
      }

      return data as unknown as QuoteLineItem[];
    } catch (error) {
      console.error('Get quote line items error:', error);
      return [];
    }
  }

  /**
   * Create a new quote
   */
  async createQuote(
    input: QuoteCreateInput
  ): Promise<{ success: boolean; quoteId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_quotes')
        .insert({
          ...input,
          status: input.status || 'draft',
          currency: input.currency || 'USD',
          subtotal: 0,
          total: 0,
          billing_address: input.billing_address || {},
          shipping_address: input.shipping_address || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, quoteId: data?.id };
    } catch (error) {
      console.error('Create quote error:', error);
      return { success: false, error: 'Failed to create quote' };
    }
  }

  /**
   * Update a quote
   */
  async updateQuote(
    id: string,
    updates: QuoteUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quotes')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update quote error:', error);
      return { success: false, error: 'Failed to update quote' };
    }
  }

  /**
   * Delete a quote
   */
  async deleteQuote(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quotes')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete quote error:', error);
      return { success: false, error: 'Failed to delete quote' };
    }
  }

  /**
   * Add a line item to a quote
   */
  async addLineItem(
    quoteId: string,
    input: QuoteLineItemCreateInput
  ): Promise<{ success: boolean; lineItemId?: string; error?: string }> {
    try {
      // Calculate subtotal and total
      const quantity = input.quantity || 1;
      const unitPrice = input.unit_price || 0;
      let subtotal = quantity * unitPrice;

      if (input.discount_percent) {
        subtotal = subtotal * (1 - input.discount_percent / 100);
      }
      if (input.discount_amount) {
        subtotal = subtotal - input.discount_amount;
      }

      let total = subtotal;
      if (input.tax_rate) {
        total = subtotal * (1 + input.tax_rate / 100);
      }

      const { data, error } = await this.supabase
        .from('crm_quote_line_items')
        .insert({
          quote_id: quoteId,
          ...input,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Recalculate quote totals
      await this.recalculateQuoteTotals(quoteId);

      return { success: true, lineItemId: data?.id };
    } catch (error) {
      console.error('Add line item error:', error);
      return { success: false, error: 'Failed to add line item' };
    }
  }

  /**
   * Update a line item
   */
  async updateLineItem(
    lineItemId: string,
    updates: QuoteLineItemUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current line item to recalculate totals
      const { data: current } = await this.supabase
        .from('crm_quote_line_items')
        .select('quote_id, quantity, unit_price, discount_percent, discount_amount, tax_rate')
        .eq('id', lineItemId)
        .single();

      if (!current) {
        return { success: false, error: 'Line item not found' };
      }

      // Merge updates with current values
      const quantity = updates.quantity ?? current.quantity;
      const unitPrice = updates.unit_price ?? current.unit_price;
      const discountPercent = updates.discount_percent ?? current.discount_percent;
      const discountAmount = updates.discount_amount ?? current.discount_amount;
      const taxRate = updates.tax_rate ?? current.tax_rate;

      // Recalculate
      let subtotal = quantity * unitPrice;
      if (discountPercent) {
        subtotal = subtotal * (1 - discountPercent / 100);
      }
      if (discountAmount) {
        subtotal = subtotal - discountAmount;
      }

      let total = subtotal;
      if (taxRate) {
        total = subtotal * (1 + taxRate / 100);
      }

      const { error } = await this.supabase
        .from('crm_quote_line_items')
        .update({
          ...updates,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Recalculate quote totals
      await this.recalculateQuoteTotals(current.quote_id);

      return { success: true };
    } catch (error) {
      console.error('Update line item error:', error);
      return { success: false, error: 'Failed to update line item' };
    }
  }

  /**
   * Remove a line item from a quote
   */
  async removeLineItem(lineItemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get quote_id before deleting
      const { data: lineItem } = await this.supabase
        .from('crm_quote_line_items')
        .select('quote_id')
        .eq('id', lineItemId)
        .single();

      const { error } = await this.supabase
        .from('crm_quote_line_items')
        .delete()
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Recalculate quote totals
      if (lineItem?.quote_id) {
        await this.recalculateQuoteTotals(lineItem.quote_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Remove line item error:', error);
      return { success: false, error: 'Failed to remove line item' };
    }
  }

  /**
   * Send a quote (change status to sent)
   */
  async sendQuote(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Send quote error:', error);
      return { success: false, error: 'Failed to send quote' };
    }
  }

  /**
   * Mark quote as unknown as accepted
   */
  async markAccepted(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark quote accepted error:', error);
      return { success: false, error: 'Failed to mark quote as unknown as accepted' };
    }
  }

  /**
   * Mark quote as unknown as rejected
   */
  async markRejected(id: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark quote rejected error:', error);
      return { success: false, error: 'Failed to mark quote as unknown as rejected' };
    }
  }

  /**
   * Recalculate quote totals based on line items
   */
  private async recalculateQuoteTotals(quoteId: string): Promise<void> {
    try {
      // Get all line items
      const { data: lineItems } = await this.supabase
        .from('crm_quote_line_items')
        .select('subtotal, total')
        .eq('quote_id', quoteId);

      if (!lineItems) return;

      const subtotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

      // Get quote for discount and shipping
      const { data: quote } = await this.supabase
        .from('crm_quotes')
        .select('discount_percent, discount_amount, shipping_amount')
        .eq('id', quoteId)
        .single();

      let total = lineItemsTotal;
      if (quote?.discount_percent) {
        total = total * (1 - quote.discount_percent / 100);
      }
      if (quote?.discount_amount) {
        total = total - quote.discount_amount;
      }
      if (quote?.shipping_amount) {
        total = total + quote.shipping_amount;
      }

      await this.supabase
        .from('crm_quotes')
        .update({ subtotal, total: Math.max(0, total) })
        .eq('id', quoteId);
    } catch (error) {
      console.error('Recalculate quote totals error:', error);
    }
  }

  /**
   * Clone a quote
   */
  async cloneQuote(id: string): Promise<{ success: boolean; quoteId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get original quote with line items
      const original = await this.getQuote(id);
      if (!original) {
        return { success: false, error: 'Quote not found' };
      }

      // Create new quote
      const { data: newQuote, error: createError } = await this.supabase
        .from('crm_quotes')
        .insert({
          name: `${original.name} (Copy)`,
          description: original.description,
          deal_id: original.deal_id,
          account_id: original.account_id,
          contact_id: original.contact_id,
          status: 'draft',
          subtotal: original.subtotal,
          discount_percent: original.discount_percent,
          discount_amount: original.discount_amount,
          tax_amount: original.tax_amount,
          shipping_amount: original.shipping_amount,
          total: original.total,
          currency: original.currency,
          terms_and_conditions: original.terms_and_conditions,
          notes: original.notes,
          billing_address: original.billing_address,
          shipping_address: original.shipping_address,
          price_book_id: original.price_book_id,
          owner_id: original.owner_id,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (createError || !newQuote) {
        return { success: false, error: createError?.message || 'Failed to create quote' };
      }

      // Clone line items
      if (original.line_items && original.line_items.length > 0) {
        const lineItems = original.line_items.map(item => ({
          quote_id: newQuote.id,
          product_id: item.product_id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          subtotal: item.subtotal,
          total: item.total,
          sort_order: item.sort_order,
        }));

        await this.supabase.from('crm_quote_line_items').insert(lineItems);
      }

      return { success: true, quoteId: newQuote.id };
    } catch (error) {
      console.error('Clone quote error:', error);
      return { success: false, error: 'Failed to clone quote' };
    }
  }
}

// Factory function
export function createQuoteService(supabase: SupabaseClient): QuoteService {
  return new QuoteService(supabase);
}
