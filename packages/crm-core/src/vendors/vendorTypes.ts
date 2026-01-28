export type VendorType = 'supplier' | 'manufacturer' | 'distributor' | 'contractor' | 'other';

export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: Record<string, unknown>;
  vendor_type: VendorType;
  payment_terms: string | null;
  tax_id: string | null;
  is_active: boolean;
  rating: number | null;
  primary_contact_id: string | null;
  owner_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VendorWithRelations extends Vendor {
  primary_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  purchase_orders_count?: number;
}

export interface VendorFilters {
  search?: string;
  vendor_type?: VendorType;
  is_active?: boolean;
  rating?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface VendorCreateInput {
  name: string;
  code?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Record<string, unknown>;
  vendor_type?: VendorType;
  payment_terms?: string;
  tax_id?: string;
  is_active?: boolean;
  rating?: number;
  primary_contact_id?: string;
  owner_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface VendorUpdateInput extends Partial<VendorCreateInput> {}
