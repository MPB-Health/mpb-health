import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PriceBook,
  PriceBookWithRelations,
  PriceBookItem,
  PriceBookFilters,
  PriceBookCreateInput,
  PriceBookUpdateInput,
  PriceBookItemCreateInput,
} from './productTypes';

export class PriceBookService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get price books with optional filters and pagination
   */
  async getPriceBooks(
    filters: PriceBookFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ priceBooks: PriceBookWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_price_books')
        .select(`
        id, org_id, name, description, is_default, is_active, effective_from, effective_to, currency, created_by, created_at, updated_at,
          items:crm_price_book_items(count)
        `, { count: 'exact' });

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.is_default !== undefined) {
        query = query.eq('is_default', filters.is_default);
      }
      if (filters.effectiveDate) {
        query = query
          .or(`effective_from.is.null,effective_from.lte.${filters.effectiveDate}`)
          .or(`effective_to.is.null,effective_to.gte.${filters.effectiveDate}`);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get price books:', error);
        return { priceBooks: [], total: 0 };
      }

      // Transform items count
      const priceBooks = (data || []).map((pb: any) => ({
        ...pb,
        items_count: pb.items?.[0]?.count || 0,
        items: undefined,
      }));

      return { priceBooks: priceBooks as unknown as PriceBookWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get price books error:', error);
      return { priceBooks: [], total: 0 };
    }
  }

  /**
   * Get a single price book by ID with items
   */
  async getPriceBook(id: string): Promise<PriceBookWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_price_books')
        .select(`
        id, org_id, name, description, is_default, is_active, effective_from, effective_to, currency, created_by, created_at, updated_at,
          items:crm_price_book_items(
            id,
            product_id,
            list_price,
            discount_percent,
            discount_amount,
            min_quantity,
            max_quantity,
            is_active,
            created_at,
            updated_at,
            product:crm_products(id, name, code, unit_price)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get price book:', error);
        return null;
      }

      return data as unknown as PriceBookWithRelations;
    } catch (error) {
      console.error('Get price book error:', error);
      return null;
    }
  }

  /**
   * Get the default price book
   */
  async getDefaultPriceBook(): Promise<PriceBookWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_price_books')
        .select(`
        id, org_id, name, description, is_default, is_active, effective_from, effective_to, currency, created_by, created_at, updated_at,
          items:crm_price_book_items(
            id,
            product_id,
            list_price,
            discount_percent,
            discount_amount,
            min_quantity,
            max_quantity,
            is_active,
            product:crm_products(id, name, code, unit_price)
          )
        `)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Failed to get default price book:', error);
        return null;
      }

      return data as unknown as PriceBookWithRelations;
    } catch (error) {
      console.error('Get default price book error:', error);
      return null;
    }
  }

  /**
   * Create a new price book
   */
  async createPriceBook(
    input: PriceBookCreateInput
  ): Promise<{ success: boolean; priceBookId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If this is set as unknown as default, unset other defaults first
      if (input.is_default) {
        await this.supabase
          .from('crm_price_books')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await this.supabase
        .from('crm_price_books')
        .insert({
          ...input,
          currency: input.currency || 'USD',
          is_active: input.is_active ?? true,
          is_default: input.is_default ?? false,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, priceBookId: data?.id };
    } catch (error) {
      console.error('Create price book error:', error);
      return { success: false, error: 'Failed to create price book' };
    }
  }

  /**
   * Update a price book
   */
  async updatePriceBook(
    id: string,
    updates: PriceBookUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // If setting as unknown as default, unset other defaults first
      if (updates.is_default) {
        await this.supabase
          .from('crm_price_books')
          .update({ is_default: false })
          .neq('id', id)
          .eq('is_default', true);
      }

      const { error } = await this.supabase
        .from('crm_price_books')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update price book error:', error);
      return { success: false, error: 'Failed to update price book' };
    }
  }

  /**
   * Delete a price book
   */
  async deletePriceBook(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_price_books')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete price book error:', error);
      return { success: false, error: 'Failed to delete price book' };
    }
  }

  /**
   * Add a product to a price book
   */
  async addProductToBook(
    priceBookId: string,
    input: PriceBookItemCreateInput
  ): Promise<{ success: boolean; itemId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_price_book_items')
        .insert({
          price_book_id: priceBookId,
          ...input,
          is_active: input.is_active ?? true,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, itemId: data?.id };
    } catch (error) {
      console.error('Add product to price book error:', error);
      return { success: false, error: 'Failed to add product to price book' };
    }
  }

  /**
   * Update a price book item
   */
  async updatePriceBookItem(
    itemId: string,
    updates: Partial<PriceBookItemCreateInput>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_price_book_items')
        .update(updates)
        .eq('id', itemId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update price book item error:', error);
      return { success: false, error: 'Failed to update price book item' };
    }
  }

  /**
   * Remove a product from a price book
   */
  async removeProduct(
    priceBookId: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_price_book_items')
        .delete()
        .eq('price_book_id', priceBookId)
        .eq('product_id', productId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Remove product from price book error:', error);
      return { success: false, error: 'Failed to remove product' };
    }
  }

  /**
   * Get price for a product from a specific price book
   */
  async getProductPrice(
    priceBookId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{ listPrice: number; finalPrice: number } | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_price_book_items')
        .select('list_price, discount_percent, discount_amount, min_quantity, max_quantity')
        .eq('price_book_id', priceBookId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .or(`min_quantity.is.null,min_quantity.lte.${quantity}`)
        .or(`max_quantity.is.null,max_quantity.gte.${quantity}`)
        .single();

      if (error || !data) {
        return null;
      }

      let finalPrice = data.list_price;
      if (data.discount_percent) {
        finalPrice = finalPrice * (1 - data.discount_percent / 100);
      }
      if (data.discount_amount) {
        finalPrice = finalPrice - data.discount_amount;
      }

      return {
        listPrice: data.list_price,
        finalPrice: Math.max(0, finalPrice),
      };
    } catch (error) {
      console.error('Get product price error:', error);
      return null;
    }
  }
}

// Factory function
export function createPriceBookService(supabase: SupabaseClient): PriceBookService {
  return new PriceBookService(supabase);
}
