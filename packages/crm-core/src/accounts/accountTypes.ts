export interface Account {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  fax: string | null;
  address: Record<string, string>;
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  annual_revenue: number | null;
  employee_count: number | null;
  account_type: 'prospect' | 'customer' | 'partner' | 'vendor' | 'other';
  rating: 'hot' | 'warm' | 'cold' | null;
  owner_id: string | null;
  parent_account_id: string | null;
  tags: string[];
  description: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AccountWithRelations extends Account {
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  parent_account?: {
    id: string;
    name: string;
  } | null;
  contacts_count?: number;
  deals_count?: number;
  open_deals_amount?: number;
}

export interface AccountFilters {
  search?: string;
  account_type?: string;
  industry?: string;
  owner_id?: string;
  rating?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface AccountCreateInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  fax?: string;
  address?: Record<string, string>;
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
  annual_revenue?: number;
  employee_count?: number;
  account_type?: 'prospect' | 'customer' | 'partner' | 'vendor' | 'other';
  rating?: 'hot' | 'warm' | 'cold';
  owner_id?: string;
  parent_account_id?: string;
  tags?: string[];
  description?: string;
  linkedin_url?: string;
  twitter_handle?: string;
}

export interface AccountUpdateInput extends Partial<AccountCreateInput> {}
