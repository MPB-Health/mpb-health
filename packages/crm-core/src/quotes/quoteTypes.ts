export type QuoteStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'revised';

export interface Quote {
  id: string;
  org_id: string;
  quote_number: string;
  name: string;
  description: string | null;
  deal_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  status: QuoteStatus;
  subtotal: number;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_amount: number | null;
  total: number;
  currency: string;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  terms_and_conditions: string | null;
  notes: string | null;
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  price_book_id: string | null;
  template_id: string | null;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteWithRelations extends Quote {
  deal?: {
    id: string;
    name: string;
  } | null;
  account?: {
    id: string;
    name: string;
  } | null;
  contact?: {
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
  line_items?: QuoteLineItem[];
  line_items_count?: number;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_rate: number | null;
  subtotal: number;
  total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
}

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus;
  deal_id?: string;
  account_id?: string;
  contact_id?: string;
  owner_id?: string;
  validFrom?: string;
  validTo?: string;
  minTotal?: number;
  maxTotal?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuoteCreateInput {
  name: string;
  description?: string;
  deal_id?: string;
  account_id?: string;
  contact_id?: string;
  status?: QuoteStatus;
  discount_percent?: number;
  discount_amount?: number;
  tax_amount?: number;
  shipping_amount?: number;
  currency?: string;
  valid_until?: string;
  terms_and_conditions?: string;
  notes?: string;
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
  price_book_id?: string;
  template_id?: string;
  owner_id?: string;
}

export interface QuoteUpdateInput extends Partial<QuoteCreateInput> {}

export interface QuoteLineItemCreateInput {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  sort_order?: number;
}

export interface QuoteLineItemUpdateInput extends Partial<QuoteLineItemCreateInput> {}
