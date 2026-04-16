import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Vendor,
  VendorWithRelations,
  VendorFilters,
  VendorCreateInput,
  VendorUpdateInput,
} from './vendorTypes';

export class VendorService {
  constructor(private supabase: SupabaseClient) {}

  async getVendors(
    filters: VendorFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ vendors: VendorWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_vendors')
        .select(`
        id, org_id, name, code, description, email, phone, website, address, vendor_type, payment_terms, tax_id, is_active, rating, primary_contact_id, owner_id, tags, metadata, created_by, created_at, updated_at,
          primary_contact:crm_contacts(id, first_name, last_name, email)
        `, { count: 'exact' });

      if (filters.vendor_type) {
        query = query.eq('vendor_type', filters.vendor_type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
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
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get vendors:', error);
        return { vendors: [], total: 0 };
      }

      return { vendors: data as unknown as VendorWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get vendors error:', error);
      return { vendors: [], total: 0 };
    }
  }

  async getVendor(id: string): Promise<VendorWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_vendors')
        .select(`
        id, org_id, name, code, description, email, phone, website, address, vendor_type, payment_terms, tax_id, is_active, rating, primary_contact_id, owner_id, tags, metadata, created_by, created_at, updated_at,
          primary_contact:crm_contacts(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get vendor:', error);
        return null;
      }

      return data as unknown as VendorWithRelations;
    } catch (error) {
      console.error('Get vendor error:', error);
      return null;
    }
  }

  async createVendor(
    input: VendorCreateInput
  ): Promise<{ success: boolean; vendorId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_vendors')
        .insert({
          ...input,
          vendor_type: input.vendor_type || 'supplier',
          is_active: input.is_active ?? true,
          address: input.address || {},
          tags: input.tags || [],
          metadata: input.metadata || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, vendorId: data?.id };
    } catch (error) {
      console.error('Create vendor error:', error);
      return { success: false, error: 'Failed to create vendor' };
    }
  }

  async updateVendor(
    id: string,
    updates: VendorUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_vendors')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update vendor error:', error);
      return { success: false, error: 'Failed to update vendor' };
    }
  }

  async deleteVendor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_vendors')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete vendor error:', error);
      return { success: false, error: 'Failed to delete vendor' };
    }
  }

  async toggleActive(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: vendor } = await this.supabase
        .from('crm_vendors')
        .select('is_active')
        .eq('id', id)
        .single();

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      const { error } = await this.supabase
        .from('crm_vendors')
        .update({ is_active: !vendor.is_active })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Toggle vendor active error:', error);
      return { success: false, error: 'Failed to toggle vendor status' };
    }
  }

  async getActiveVendors(): Promise<Vendor[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_vendors')
        .select('id, org_id, name, contact_name, email, phone, website, address, category, status, notes, is_active, created_by, created_at, updated_at')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to get active vendors:', error);
        return [];
      }

      return data as unknown as Vendor[];
    } catch (error) {
      console.error('Get active vendors error:', error);
      return [];
    }
  }

  async getVendorPurchaseOrders(vendorId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_purchase_orders')
        .select('id, org_id, vendor_id, order_number, status, total_amount, notes, ordered_by, ordered_at, received_at, created_at, updated_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get vendor purchase orders:', error);
        return [];
      }

      return (data || []) as any;
    } catch (error) {
      console.error('Get vendor purchase orders error:', error);
      return [];
    }
  }
}

export function createVendorService(supabase: SupabaseClient): VendorService {
  return new VendorService(supabase);
}
