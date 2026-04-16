import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductWithRelations,
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
} from './productTypes';

export class ProductService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get products with optional filters and pagination
   */
  async getProducts(
    filters: ProductFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ products: Product[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_products')
        .select('id, org_id, name, description, category, carrier_id, plan_type, premium_range_min, premium_range_max, is_active, metadata, created_at, updated_at', { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('unit_price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('unit_price', filters.maxPrice);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get products:', error);
        return { products: [], total: 0 };
      }

      return { products: data as unknown as Product[], total: count || 0 };
    } catch (error) {
      console.error('Get products error:', error);
      return { products: [], total: 0 };
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<ProductWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_products')
        .select(`
        id, org_id, name, code, description, category, unit_price, cost, currency, unit_of_measure, is_active, is_taxable, tax_rate, sku, external_id, metadata, created_by, created_at, updated_at,
          price_book_items:crm_price_book_items(
            id,
            price_book_id,
            list_price,
            discount_percent,
            discount_amount,
            is_active
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get product:', error);
        return null;
      }

      return data as unknown as ProductWithRelations;
    } catch (error) {
      console.error('Get product error:', error);
      return null;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(
    input: ProductCreateInput
  ): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_products')
        .insert({
          ...input,
          currency: input.currency || 'USD',
          is_active: input.is_active ?? true,
          is_taxable: input.is_taxable ?? false,
          metadata: input.metadata || {},
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, productId: data?.id };
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, error: 'Failed to create product' };
    }
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string,
    updates: ProductUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_products')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: 'Failed to update product' };
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_products')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: 'Failed to delete product' };
    }
  }

  /**
   * Toggle product active status
   */
  async toggleActive(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current status
      const { data: product, error: fetchError } = await this.supabase
        .from('crm_products')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError || !product) {
        return { success: false, error: 'Product not found' };
      }

      const { error } = await this.supabase
        .from('crm_products')
        .update({ is_active: !product.is_active })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Toggle product active error:', error);
      return { success: false, error: 'Failed to toggle product status' };
    }
  }

  /**
   * Get unique categories for filters
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_products')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        console.error('Failed to get categories:', error);
        return [];
      }

      const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
      return categories.sort();
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  /**
   * Get active products for selection
   */
  async getActiveProducts(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_products')
        .select('id, org_id, name, description, category, carrier_id, plan_type, premium_range_min, premium_range_max, is_active, metadata, created_at, updated_at')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to get active products:', error);
        return [];
      }

      return data as unknown as Product[];
    } catch (error) {
      console.error('Get active products error:', error);
      return [];
    }
  }
}

// Factory function
export function createProductService(supabase: SupabaseClient): ProductService {
  return new ProductService(supabase);
}
