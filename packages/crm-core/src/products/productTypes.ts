// Product Types
export interface Product {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  unit_price: number;
  cost: number | null;
  currency: string;
  unit_of_measure: string | null;
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: number | null;
  sku: string | null;
  external_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  price_book_items?: PriceBookItem[];
}

export interface ProductFilters {
  search?: string;
  category?: string;
  is_active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductCreateInput {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  unit_price: number;
  cost?: number;
  currency?: string;
  unit_of_measure?: string;
  is_active?: boolean;
  is_taxable?: boolean;
  tax_rate?: number;
  sku?: string;
  external_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

// PriceBook Types
export interface PriceBook {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PriceBookWithRelations extends PriceBook {
  items?: PriceBookItem[];
  items_count?: number;
}

export interface PriceBookItem {
  id: string;
  price_book_id: string;
  product_id: string;
  list_price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  min_quantity: number | null;
  max_quantity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    code: string | null;
    unit_price: number;
  };
}

export interface PriceBookFilters {
  search?: string;
  is_active?: boolean;
  is_default?: boolean;
  effectiveDate?: string;
}

export interface PriceBookCreateInput {
  name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  effective_from?: string;
  effective_to?: string;
  currency?: string;
}

export interface PriceBookUpdateInput extends Partial<PriceBookCreateInput> {}

export interface PriceBookItemCreateInput {
  product_id: string;
  list_price: number;
  discount_percent?: number;
  discount_amount?: number;
  min_quantity?: number;
  max_quantity?: number;
  is_active?: boolean;
}
