import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SalesOrder,
  SalesOrderWithRelations,
  SOLineItem,
  SOFilters,
  SOCreateInput,
  SOUpdateInput,
  SOLineItemCreateInput,
  SOLineItemUpdateInput,
} from './salesOrderTypes';

export class SalesOrderService {
  constructor(private supabase: SupabaseClient) {}

  async getSalesOrders(
    filters: SOFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ salesOrders: SalesOrderWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_sales_orders')
        .select(`
          *,
          account:crm_accounts(id, name),
          contact:crm_contacts(id, first_name, last_name, email),
          deal:crm_deals(id, name),
          quote:crm_quotes(id, name, quote_number)
        `, { count: 'exact' });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.approval_status) query = query.eq('approval_status', filters.approval_status);
      if (filters.account_id) query = query.eq('account_id', filters.account_id);
      if (filters.deal_id) query = query.eq('deal_id', filters.deal_id);
      if (filters.quote_id) query = query.eq('quote_id', filters.quote_id);
      if (filters.orderFrom) query = query.gte('order_date', filters.orderFrom);
      if (filters.orderTo) query = query.lte('order_date', filters.orderTo);
      if (filters.requestedFrom) query = query.gte('requested_date', filters.requestedFrom);
      if (filters.requestedTo) query = query.lte('requested_date', filters.requestedTo);
      if (filters.minTotal !== undefined) query = query.gte('total', filters.minTotal);
      if (filters.maxTotal !== undefined) query = query.lte('total', filters.maxTotal);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,so_number.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get sales orders:', error);
        return { salesOrders: [], total: 0 };
      }

      return { salesOrders: data as SalesOrderWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get sales orders error:', error);
      return { salesOrders: [], total: 0 };
    }
  }

  async getSalesOrder(id: string): Promise<SalesOrderWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_sales_orders')
        .select(`
          *,
          account:crm_accounts(id, name),
          contact:crm_contacts(id, first_name, last_name, email),
          deal:crm_deals(id, name),
          quote:crm_quotes(id, name, quote_number),
          line_items:crm_sales_order_line_items(
            *,
            product:crm_products(id, name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get sales order:', error);
        return null;
      }

      if (data.line_items) {
        data.line_items.sort((a: SOLineItem, b: SOLineItem) => a.sort_order - b.sort_order);
      }

      return data as SalesOrderWithRelations;
    } catch (error) {
      console.error('Get sales order error:', error);
      return null;
    }
  }

  async createSalesOrder(
    input: SOCreateInput
  ): Promise<{ success: boolean; salesOrderId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_sales_orders')
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

      return { success: true, salesOrderId: data?.id };
    } catch (error) {
      console.error('Create sales order error:', error);
      return { success: false, error: 'Failed to create sales order' };
    }
  }

  async createFromQuote(quoteId: string): Promise<{ success: boolean; salesOrderId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data: quote, error: quoteError } = await this.supabase
        .from('crm_quotes')
        .select(`*, line_items:crm_quote_line_items(*)`)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        return { success: false, error: 'Quote not found' };
      }

      const { data: so, error: soError } = await this.supabase
        .from('crm_sales_orders')
        .insert({
          name: quote.name,
          description: quote.description,
          account_id: quote.account_id,
          contact_id: quote.contact_id,
          deal_id: quote.deal_id,
          quote_id: quoteId,
          status: 'draft',
          subtotal: quote.subtotal,
          discount_percent: quote.discount_percent,
          discount_amount: quote.discount_amount,
          tax_amount: quote.tax_amount,
          shipping_amount: quote.shipping_amount,
          total: quote.total,
          currency: quote.currency,
          billing_address: quote.billing_address,
          shipping_address: quote.shipping_address,
          terms_and_conditions: quote.terms_and_conditions,
          notes: quote.notes,
          owner_id: quote.owner_id,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (soError || !so) {
        return { success: false, error: soError?.message || 'Failed to create sales order' };
      }

      if (quote.line_items && quote.line_items.length > 0) {
        const lineItems = quote.line_items.map((item: any) => ({
          sales_order_id: so.id,
          product_id: item.product_id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          quantity_shipped: 0,
          quantity_delivered: 0,
          unit: 'each',
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          subtotal: item.subtotal,
          total: item.total,
          sort_order: item.sort_order,
        }));

        await this.supabase.from('crm_sales_order_line_items').insert(lineItems);
      }

      return { success: true, salesOrderId: so.id };
    } catch (error) {
      console.error('Create SO from quote error:', error);
      return { success: false, error: 'Failed to create sales order from quote' };
    }
  }

  async updateSalesOrder(
    id: string,
    updates: SOUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_sales_orders')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update sales order error:', error);
      return { success: false, error: 'Failed to update sales order' };
    }
  }

  async deleteSalesOrder(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_sales_orders')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete sales order error:', error);
      return { success: false, error: 'Failed to delete sales order' };
    }
  }

  async addLineItem(
    salesOrderId: string,
    input: SOLineItemCreateInput
  ): Promise<{ success: boolean; lineItemId?: string; error?: string }> {
    try {
      const quantity = input.quantity || 1;
      const unitPrice = input.unit_price || 0;
      let subtotal = quantity * unitPrice;

      if (input.discount_percent) subtotal = subtotal * (1 - input.discount_percent / 100);
      if (input.discount_amount) subtotal = subtotal - input.discount_amount;

      let total = subtotal;
      if (input.tax_rate) total = subtotal * (1 + input.tax_rate / 100);

      const { data, error } = await this.supabase
        .from('crm_sales_order_line_items')
        .insert({
          sales_order_id: salesOrderId,
          ...input,
          unit: input.unit || 'each',
          quantity_shipped: 0,
          quantity_delivered: 0,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recalculateTotals(salesOrderId);

      return { success: true, lineItemId: data?.id };
    } catch (error) {
      console.error('Add line item error:', error);
      return { success: false, error: 'Failed to add line item' };
    }
  }

  async updateLineItem(
    lineItemId: string,
    updates: SOLineItemUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: current } = await this.supabase
        .from('crm_sales_order_line_items')
        .select('sales_order_id, quantity, unit_price, discount_percent, discount_amount, tax_rate')
        .eq('id', lineItemId)
        .single();

      if (!current) {
        return { success: false, error: 'Line item not found' };
      }

      const quantity = updates.quantity ?? current.quantity;
      const unitPrice = updates.unit_price ?? current.unit_price;
      const discountPercent = updates.discount_percent ?? current.discount_percent;
      const discountAmount = updates.discount_amount ?? current.discount_amount;
      const taxRate = updates.tax_rate ?? current.tax_rate;

      let subtotal = quantity * unitPrice;
      if (discountPercent) subtotal = subtotal * (1 - discountPercent / 100);
      if (discountAmount) subtotal = subtotal - discountAmount;

      let total = subtotal;
      if (taxRate) total = subtotal * (1 + taxRate / 100);

      const { error } = await this.supabase
        .from('crm_sales_order_line_items')
        .update({
          ...updates,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recalculateTotals(current.sales_order_id);

      return { success: true };
    } catch (error) {
      console.error('Update line item error:', error);
      return { success: false, error: 'Failed to update line item' };
    }
  }

  async removeLineItem(lineItemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: lineItem } = await this.supabase
        .from('crm_sales_order_line_items')
        .select('sales_order_id')
        .eq('id', lineItemId)
        .single();

      const { error } = await this.supabase
        .from('crm_sales_order_line_items')
        .delete()
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (lineItem?.sales_order_id) {
        await this.recalculateTotals(lineItem.sales_order_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Remove line item error:', error);
      return { success: false, error: 'Failed to remove line item' };
    }
  }

  async submitForApproval(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateSalesOrder(id, { status: 'pending_approval' } as any);
  }

  async approve(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();

      const { error } = await this.supabase
        .from('crm_sales_orders')
        .update({
          status: 'approved',
          approval_status: 'approved',
          approved_by: user?.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Approve SO error:', error);
      return { success: false, error: 'Failed to approve sales order' };
    }
  }

  async reject(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();

      const { error } = await this.supabase
        .from('crm_sales_orders')
        .update({
          status: 'draft',
          approval_status: 'rejected',
          approved_by: user?.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reject SO error:', error);
      return { success: false, error: 'Failed to reject sales order' };
    }
  }

  async confirm(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateSalesOrder(id, { status: 'confirmed' } as any);
  }

  async markShipped(id: string, trackingNumber?: string): Promise<{ success: boolean; error?: string }> {
    return this.updateSalesOrder(id, {
      status: 'shipped',
      tracking_number: trackingNumber,
    } as any);
  }

  async markDelivered(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateSalesOrder(id, { status: 'delivered' } as any);
  }

  private async recalculateTotals(salesOrderId: string): Promise<void> {
    try {
      const { data: lineItems } = await this.supabase
        .from('crm_sales_order_line_items')
        .select('subtotal, total')
        .eq('sales_order_id', salesOrderId);

      if (!lineItems) return;

      const subtotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

      const { data: so } = await this.supabase
        .from('crm_sales_orders')
        .select('discount_percent, discount_amount, shipping_amount')
        .eq('id', salesOrderId)
        .single();

      let total = lineItemsTotal;
      if (so?.discount_percent) total = total * (1 - so.discount_percent / 100);
      if (so?.discount_amount) total = total - so.discount_amount;
      if (so?.shipping_amount) total = total + so.shipping_amount;

      await this.supabase
        .from('crm_sales_orders')
        .update({ subtotal, total: Math.max(0, total) })
        .eq('id', salesOrderId);
    } catch (error) {
      console.error('Recalculate totals error:', error);
    }
  }
}

export function createSalesOrderService(supabase: SupabaseClient): SalesOrderService {
  return new SalesOrderService(supabase);
}
