export type SOStatus = 'draft' | 'pending_approval' | 'approved' | 'confirmed' | 'processing' | 'shipped' | 'partially_delivered' | 'delivered' | 'cancelled' | 'closed';
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface SalesOrder {
  id: string;
  org_id: string;
  so_number: string;
  name: string;
  description: string | null;
  account_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  quote_id: string | null;
  status: SOStatus;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  subtotal: number;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_amount: number | null;
  total: number;
  currency: string;
  order_date: string | null;
  requested_date: string | null;
  promised_date: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  shipping_method: string | null;
  tracking_number: string | null;
  carrier: string | null;
  payment_terms: string | null;
  terms_and_conditions: string | null;
  notes: string | null;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderWithRelations extends SalesOrder {
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
  deal?: {
    id: string;
    name: string;
  } | null;
  quote?: {
    id: string;
    name: string;
    quote_number: string;
  } | null;
  line_items?: SOLineItem[];
}

export interface SOLineItem {
  id: string;
  sales_order_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  quantity_shipped: number;
  quantity_delivered: number;
  unit: string;
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

export interface SOFilters {
  search?: string;
  status?: SOStatus;
  approval_status?: ApprovalStatus;
  account_id?: string;
  deal_id?: string;
  quote_id?: string;
  orderFrom?: string;
  orderTo?: string;
  requestedFrom?: string;
  requestedTo?: string;
  minTotal?: number;
  maxTotal?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SOCreateInput {
  name: string;
  description?: string;
  account_id?: string;
  contact_id?: string;
  deal_id?: string;
  quote_id?: string;
  status?: SOStatus;
  order_date?: string;
  requested_date?: string;
  promised_date?: string;
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  shipping_method?: string;
  carrier?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  notes?: string;
  owner_id?: string;
  currency?: string;
}

export interface SOUpdateInput extends Partial<SOCreateInput> {
  approval_status?: ApprovalStatus;
  shipped_date?: string;
  delivered_date?: string;
  discount_percent?: number;
  discount_amount?: number;
  shipping_amount?: number;
  tracking_number?: string;
}

export interface SOLineItemCreateInput {
  product_id?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  sort_order?: number;
}

export interface SOLineItemUpdateInput extends Partial<SOLineItemCreateInput> {
  quantity_shipped?: number;
  quantity_delivered?: number;
}
