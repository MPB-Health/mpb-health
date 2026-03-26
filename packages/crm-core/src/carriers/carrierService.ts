import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InsuranceCarrier,
  CarrierCreateInput,
  CarrierUpdateInput,
  CarrierFilters,
} from './carrierTypes';
import { sanitizeSearchInput } from '../utils/sanitize';

export class CarrierService {
  constructor(private supabase: SupabaseClient) {}

  async getCarriers(filters: CarrierFilters = {}): Promise<InsuranceCarrier[]> {
    try {
      let query = this.supabase
        .from('insurance_carriers')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (filters.carrier_type) {
        query = query.eq('carrier_type', filters.carrier_type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        const safe = sanitizeSearchInput(filters.search);
        query = query.ilike('name', `%${safe}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get carriers:', error);
        return [];
      }

      return data as InsuranceCarrier[];
    } catch (error) {
      console.error('Get carriers error:', error);
      return [];
    }
  }

  async getActiveCarriers(): Promise<InsuranceCarrier[]> {
    return this.getCarriers({ is_active: true });
  }

  async getCarrier(id: string): Promise<InsuranceCarrier | null> {
    try {
      const { data, error } = await this.supabase
        .from('insurance_carriers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as InsuranceCarrier;
    } catch {
      return null;
    }
  }

  async createCarrier(
    input: CarrierCreateInput
  ): Promise<{ success: boolean; carrier?: InsuranceCarrier; error?: string }> {
    try {
      const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error } = await this.supabase
        .from('insurance_carriers')
        .insert({
          name: input.name,
          slug,
          carrier_type: input.carrier_type,
          logo_url: input.logo_url || null,
          website_url: input.website_url || null,
          phone: input.phone || null,
          notes: input.notes || null,
          sort_order: input.sort_order ?? 0,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, carrier: data as InsuranceCarrier };
    } catch (error) {
      console.error('Create carrier error:', error);
      return { success: false, error: 'Failed to create carrier' };
    }
  }

  async updateCarrier(
    id: string,
    updates: CarrierUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.name && !updates.slug) {
        payload.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const { error } = await this.supabase
        .from('insurance_carriers')
        .update(payload)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Update carrier error:', error);
      return { success: false, error: 'Failed to update carrier' };
    }
  }

  async deleteCarrier(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('insurance_carriers')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Delete carrier error:', error);
      return { success: false, error: 'Failed to delete carrier' };
    }
  }
}

export function createCarrierService(supabase: SupabaseClient): CarrierService {
  return new CarrierService(supabase);
}
