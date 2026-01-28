import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Invoice,
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoiceFilters,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceLineItemCreateInput,
  InvoiceLineItemUpdateInput,
  PaymentCreateInput,
  InvoicePayment,
} from './invoiceTypes';

export class InvoiceService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get invoices with optional filters and pagination
   */
  async getInvoices(
    filters: InvoiceFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_invoices')
        .select(`
          *,
          quote:crm_quotes!crm_invoices_quote_id_fkey(id, name, quote_number),
          deal:crm_deals!crm_invoices_deal_id_fkey(id, name),
          account:crm_accounts!crm_invoices_account_id_fkey(id, name),
          contact:crm_contacts!crm_invoices_contact_id_fkey(id, first_name, last_name, email)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.quote_id) {
        query = query.eq('quote_id', filters.quote_id);
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
      if (filters.issueFrom) {
        query = query.gte('issue_date', filters.issueFrom);
      }
      if (filters.issueTo) {
        query = query.lte('issue_date', filters.issueTo);
      }
      if (filters.dueFrom) {
        query = query.gte('due_date', filters.dueFrom);
      }
      if (filters.dueTo) {
        query = query.lte('due_date', filters.dueTo);
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
          `name.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get invoices:', error);
        return { invoices: [], total: 0 };
      }

      return { invoices: data as InvoiceWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get invoices error:', error);
      return { invoices: [], total: 0 };
    }
  }

  /**
   * Get a single invoice by ID with line items and payments
   */
  async getInvoice(id: string): Promise<InvoiceWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_invoices')
        .select(`
          *,
          quote:crm_quotes!crm_invoices_quote_id_fkey(id, name, quote_number),
          deal:crm_deals!crm_invoices_deal_id_fkey(id, name),
          account:crm_accounts!crm_invoices_account_id_fkey(id, name),
          contact:crm_contacts!crm_invoices_contact_id_fkey(id, first_name, last_name, email),
          line_items:crm_invoice_line_items(
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
          ),
          payments:crm_invoice_payments(
            id,
            amount,
            payment_method,
            payment_date,
            reference_number,
            notes,
            created_by,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get invoice:', error);
        return null;
      }

      // Sort line items by sort_order
      if (data.line_items) {
        data.line_items.sort((a: InvoiceLineItem, b: InvoiceLineItem) => a.sort_order - b.sort_order);
      }

      // Sort payments by date
      if (data.payments) {
        data.payments.sort((a: InvoicePayment, b: InvoicePayment) =>
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
      }

      return data as InvoiceWithRelations;
    } catch (error) {
      console.error('Get invoice error:', error);
      return null;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    input: InvoiceCreateInput
  ): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_invoices')
        .insert({
          ...input,
          status: input.status || 'draft',
          currency: input.currency || 'USD',
          subtotal: 0,
          total: 0,
          amount_paid: 0,
          amount_due: 0,
          billing_address: input.billing_address || {},
          shipping_address: input.shipping_address || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, invoiceId: data?.id };
    } catch (error) {
      console.error('Create invoice error:', error);
      return { success: false, error: 'Failed to create invoice' };
    }
  }

  /**
   * Create invoice from quote
   */
  async createFromQuote(quoteId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get quote with line items
      const { data: quote, error: quoteError } = await this.supabase
        .from('crm_quotes')
        .select(`
          *,
          line_items:crm_quote_line_items(*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        return { success: false, error: 'Quote not found' };
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('crm_invoices')
        .insert({
          name: quote.name,
          description: quote.description,
          quote_id: quoteId,
          deal_id: quote.deal_id,
          account_id: quote.account_id,
          contact_id: quote.contact_id,
          status: 'draft',
          subtotal: quote.subtotal,
          discount_percent: quote.discount_percent,
          discount_amount: quote.discount_amount,
          tax_amount: quote.tax_amount,
          shipping_amount: quote.shipping_amount,
          total: quote.total,
          amount_paid: 0,
          amount_due: quote.total,
          currency: quote.currency,
          terms_and_conditions: quote.terms_and_conditions,
          notes: quote.notes,
          billing_address: quote.billing_address,
          shipping_address: quote.shipping_address,
          price_book_id: quote.price_book_id,
          owner_id: quote.owner_id,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: invoiceError?.message || 'Failed to create invoice' };
      }

      // Copy line items
      if (quote.line_items && quote.line_items.length > 0) {
        const lineItems = quote.line_items.map((item: any) => ({
          invoice_id: invoice.id,
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

        await this.supabase.from('crm_invoice_line_items').insert(lineItems);
      }

      return { success: true, invoiceId: invoice.id };
    } catch (error) {
      console.error('Create invoice from quote error:', error);
      return { success: false, error: 'Failed to create invoice from quote' };
    }
  }

  /**
   * Update an invoice
   */
  async updateInvoice(
    id: string,
    updates: InvoiceUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_invoices')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update invoice error:', error);
      return { success: false, error: 'Failed to update invoice' };
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_invoices')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete invoice error:', error);
      return { success: false, error: 'Failed to delete invoice' };
    }
  }

  /**
   * Add a line item to an invoice
   */
  async addLineItem(
    invoiceId: string,
    input: InvoiceLineItemCreateInput
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
        .from('crm_invoice_line_items')
        .insert({
          invoice_id: invoiceId,
          ...input,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Recalculate invoice totals
      await this.recalculateInvoiceTotals(invoiceId);

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
    updates: InvoiceLineItemUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current line item
      const { data: current } = await this.supabase
        .from('crm_invoice_line_items')
        .select('invoice_id, quantity, unit_price, discount_percent, discount_amount, tax_rate')
        .eq('id', lineItemId)
        .single();

      if (!current) {
        return { success: false, error: 'Line item not found' };
      }

      // Merge updates
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
        .from('crm_invoice_line_items')
        .update({
          ...updates,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recalculateInvoiceTotals(current.invoice_id);

      return { success: true };
    } catch (error) {
      console.error('Update line item error:', error);
      return { success: false, error: 'Failed to update line item' };
    }
  }

  /**
   * Remove a line item
   */
  async removeLineItem(lineItemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: lineItem } = await this.supabase
        .from('crm_invoice_line_items')
        .select('invoice_id')
        .eq('id', lineItemId)
        .single();

      const { error } = await this.supabase
        .from('crm_invoice_line_items')
        .delete()
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (lineItem?.invoice_id) {
        await this.recalculateInvoiceTotals(lineItem.invoice_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Remove line item error:', error);
      return { success: false, error: 'Failed to remove line item' };
    }
  }

  /**
   * Send invoice
   */
  async sendInvoice(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_invoices')
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
      console.error('Send invoice error:', error);
      return { success: false, error: 'Failed to send invoice' };
    }
  }

  /**
   * Record payment
   */
  async recordPayment(
    invoiceId: string,
    input: PaymentCreateInput
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();

      const { data, error } = await this.supabase
        .from('crm_invoice_payments')
        .insert({
          invoice_id: invoiceId,
          amount: input.amount,
          payment_method: input.payment_method || null,
          payment_date: input.payment_date || new Date().toISOString(),
          reference_number: input.reference_number || null,
          notes: input.notes || null,
          created_by: user?.user?.id || null,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update invoice payment totals
      await this.recalculatePaymentTotals(invoiceId);

      return { success: true, paymentId: data?.id };
    } catch (error) {
      console.error('Record payment error:', error);
      return { success: false, error: 'Failed to record payment' };
    }
  }

  /**
   * Mark as paid (full payment)
   */
  async markPaid(invoiceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: invoice } = await this.supabase
        .from('crm_invoices')
        .select('total, amount_paid')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const remainingAmount = invoice.total - (invoice.amount_paid || 0);

      if (remainingAmount > 0) {
        // Record the final payment
        await this.recordPayment(invoiceId, { amount: remainingAmount });
      }

      return { success: true };
    } catch (error) {
      console.error('Mark paid error:', error);
      return { success: false, error: 'Failed to mark invoice as paid' };
    }
  }

  /**
   * Void invoice
   */
  async voidInvoice(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_invoices')
        .update({ status: 'void' })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Void invoice error:', error);
      return { success: false, error: 'Failed to void invoice' };
    }
  }

  /**
   * Recalculate invoice totals
   */
  private async recalculateInvoiceTotals(invoiceId: string): Promise<void> {
    try {
      const { data: lineItems } = await this.supabase
        .from('crm_invoice_line_items')
        .select('subtotal, total')
        .eq('invoice_id', invoiceId);

      if (!lineItems) return;

      const subtotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

      const { data: invoice } = await this.supabase
        .from('crm_invoices')
        .select('discount_percent, discount_amount, shipping_amount, amount_paid')
        .eq('id', invoiceId)
        .single();

      let total = lineItemsTotal;
      if (invoice?.discount_percent) {
        total = total * (1 - invoice.discount_percent / 100);
      }
      if (invoice?.discount_amount) {
        total = total - invoice.discount_amount;
      }
      if (invoice?.shipping_amount) {
        total = total + invoice.shipping_amount;
      }

      total = Math.max(0, total);
      const amountDue = Math.max(0, total - (invoice?.amount_paid || 0));

      await this.supabase
        .from('crm_invoices')
        .update({ subtotal, total, amount_due: amountDue })
        .eq('id', invoiceId);
    } catch (error) {
      console.error('Recalculate invoice totals error:', error);
    }
  }

  /**
   * Recalculate payment totals
   */
  private async recalculatePaymentTotals(invoiceId: string): Promise<void> {
    try {
      const { data: payments } = await this.supabase
        .from('crm_invoice_payments')
        .select('amount')
        .eq('invoice_id', invoiceId);

      const amountPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      const { data: invoice } = await this.supabase
        .from('crm_invoices')
        .select('total')
        .eq('id', invoiceId)
        .single();

      const amountDue = Math.max(0, (invoice?.total || 0) - amountPaid);
      let status: Invoice['status'] = 'sent';

      if (amountDue <= 0) {
        status = 'paid';
      } else if (amountPaid > 0) {
        status = 'partially_paid';
      }

      await this.supabase
        .from('crm_invoices')
        .update({
          amount_paid: amountPaid,
          amount_due: amountDue,
          status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', invoiceId);
    } catch (error) {
      console.error('Recalculate payment totals error:', error);
    }
  }
}

// Factory function
export function createInvoiceService(supabase: SupabaseClient): InvoiceService {
  return new InvoiceService(supabase);
}
