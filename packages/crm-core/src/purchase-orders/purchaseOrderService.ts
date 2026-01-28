import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PurchaseOrder,
  PurchaseOrderWithRelations,
  POLineItem,
  POFilters,
  POCreateInput,
  POUpdateInput,
  POLineItemCreateInput,
  POLineItemUpdateInput,
} from './purchaseOrderTypes';

export class PurchaseOrderService {
  constructor(private supabase: SupabaseClient) {}

  async getPurchaseOrders(
    filters: POFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ purchaseOrders: PurchaseOrderWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_purchase_orders')
        .select(`
          *,
          vendor:crm_vendors(id, name, email)
        `, { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }
      if (filters.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }
      if (filters.orderFrom) {
        query = query.gte('order_date', filters.orderFrom);
      }
      if (filters.orderTo) {
        query = query.lte('order_date', filters.orderTo);
      }
      if (filters.expectedFrom) {
        query = query.gte('expected_date', filters.expectedFrom);
      }
      if (filters.expectedTo) {
        query = query.lte('expected_date', filters.expectedTo);
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
          `name.ilike.%${filters.search}%,po_number.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get purchase orders:', error);
        return { purchaseOrders: [], total: 0 };
      }

      return { purchaseOrders: data as PurchaseOrderWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get purchase orders error:', error);
      return { purchaseOrders: [], total: 0 };
    }
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_purchase_orders')
        .select(`
          *,
          vendor:crm_vendors(id, name, email),
          line_items:crm_purchase_order_line_items(
            *,
            product:crm_products(id, name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get purchase order:', error);
        return null;
      }

      if (data.line_items) {
        data.line_items.sort((a: POLineItem, b: POLineItem) => a.sort_order - b.sort_order);
      }

      return data as PurchaseOrderWithRelations;
    } catch (error) {
      console.error('Get purchase order error:', error);
      return null;
    }
  }

  async createPurchaseOrder(
    input: POCreateInput
  ): Promise<{ success: boolean; purchaseOrderId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_purchase_orders')
        .insert({
          ...input,
          status: input.status || 'draft',
          currency: input.currency || 'USD',
          subtotal: 0,
          total: 0,
          ship_to_address: input.ship_to_address || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, purchaseOrderId: data?.id };
    } catch (error) {
      console.error('Create purchase order error:', error);
      return { success: false, error: 'Failed to create purchase order' };
    }
  }

  async updatePurchaseOrder(
    id: string,
    updates: POUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_purchase_orders')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update purchase order error:', error);
      return { success: false, error: 'Failed to update purchase order' };
    }
  }

  async deletePurchaseOrder(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_purchase_orders')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete purchase order error:', error);
      return { success: false, error: 'Failed to delete purchase order' };
    }
  }

  async addLineItem(
    purchaseOrderId: string,
    input: POLineItemCreateInput
  ): Promise<{ success: boolean; lineItemId?: string; error?: string }> {
    try {
      const quantity = input.quantity || 1;
      const unitCost = input.unit_cost || 0;
      let subtotal = quantity * unitCost;

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
        .from('crm_purchase_order_line_items')
        .insert({
          purchase_order_id: purchaseOrderId,
          ...input,
          unit: input.unit || 'each',
          quantity_received: 0,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recalculateTotals(purchaseOrderId);

      return { success: true, lineItemId: data?.id };
    } catch (error) {
      console.error('Add line item error:', error);
      return { success: false, error: 'Failed to add line item' };
    }
  }

  async updateLineItem(
    lineItemId: string,
    updates: POLineItemUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: current } = await this.supabase
        .from('crm_purchase_order_line_items')
        .select('purchase_order_id, quantity, unit_cost, discount_percent, discount_amount, tax_rate')
        .eq('id', lineItemId)
        .single();

      if (!current) {
        return { success: false, error: 'Line item not found' };
      }

      const quantity = updates.quantity ?? current.quantity;
      const unitCost = updates.unit_cost ?? current.unit_cost;
      const discountPercent = updates.discount_percent ?? current.discount_percent;
      const discountAmount = updates.discount_amount ?? current.discount_amount;
      const taxRate = updates.tax_rate ?? current.tax_rate;

      let subtotal = quantity * unitCost;
      if (discountPercent) subtotal = subtotal * (1 - discountPercent / 100);
      if (discountAmount) subtotal = subtotal - discountAmount;

      let total = subtotal;
      if (taxRate) total = subtotal * (1 + taxRate / 100);

      const { error } = await this.supabase
        .from('crm_purchase_order_line_items')
        .update({
          ...updates,
          subtotal: Math.max(0, subtotal),
          total: Math.max(0, total),
        })
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recalculateTotals(current.purchase_order_id);

      return { success: true };
    } catch (error) {
      console.error('Update line item error:', error);
      return { success: false, error: 'Failed to update line item' };
    }
  }

  async removeLineItem(lineItemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: lineItem } = await this.supabase
        .from('crm_purchase_order_line_items')
        .select('purchase_order_id')
        .eq('id', lineItemId)
        .single();

      const { error } = await this.supabase
        .from('crm_purchase_order_line_items')
        .delete()
        .eq('id', lineItemId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (lineItem?.purchase_order_id) {
        await this.recalculateTotals(lineItem.purchase_order_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Remove line item error:', error);
      return { success: false, error: 'Failed to remove line item' };
    }
  }

  async submitForApproval(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updatePurchaseOrder(id, {
      status: 'pending_approval',
    } as any);
  }

  async approve(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();

      const { error } = await this.supabase
        .from('crm_purchase_orders')
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
      console.error('Approve PO error:', error);
      return { success: false, error: 'Failed to approve purchase order' };
    }
  }

  async reject(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();

      const { error } = await this.supabase
        .from('crm_purchase_orders')
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
      console.error('Reject PO error:', error);
      return { success: false, error: 'Failed to reject purchase order' };
    }
  }

  async send(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_purchase_orders')
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
      console.error('Send PO error:', error);
      return { success: false, error: 'Failed to send purchase order' };
    }
  }

  async markReceived(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updatePurchaseOrder(id, {
      status: 'received',
    } as any);
  }

  private async recalculateTotals(purchaseOrderId: string): Promise<void> {
    try {
      const { data: lineItems } = await this.supabase
        .from('crm_purchase_order_line_items')
        .select('subtotal, total')
        .eq('purchase_order_id', purchaseOrderId);

      if (!lineItems) return;

      const subtotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

      const { data: po } = await this.supabase
        .from('crm_purchase_orders')
        .select('discount_percent, discount_amount, shipping_amount')
        .eq('id', purchaseOrderId)
        .single();

      let total = lineItemsTotal;
      if (po?.discount_percent) total = total * (1 - po.discount_percent / 100);
      if (po?.discount_amount) total = total - po.discount_amount;
      if (po?.shipping_amount) total = total + po.shipping_amount;

      await this.supabase
        .from('crm_purchase_orders')
        .update({ subtotal, total: Math.max(0, total) })
        .eq('id', purchaseOrderId);
    } catch (error) {
      console.error('Recalculate totals error:', error);
    }
  }
}

export function createPurchaseOrderService(supabase: SupabaseClient): PurchaseOrderService {
  return new PurchaseOrderService(supabase);
}
