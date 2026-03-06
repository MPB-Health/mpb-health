export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'acknowledged' | 'partially_received' | 'received' | 'cancelled' | 'closed';
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface PurchaseOrder {
  id: string;
  org_id: string;
  po_number: string;
  name: string;
  description: string | null;
  vendor_id: string;
  status: POStatus;
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
  expected_date: string | null;
  received_date: string | null;
  ship_to_address: Record<string, unknown>;
  shipping_method: string | null;
  tracking_number: string | null;
  payment_terms: string | null;
  terms_and_conditions: string | null;
  notes: string | null;
  owner_id: string | null;
  sent_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  vendor?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  line_items?: POLineItem[];
}

export interface POLineItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  quantity_received: number;
  unit: string;
  unit_cost: number;
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

export interface POFilters {
  search?: string;
  status?: POStatus;
  approval_status?: ApprovalStatus;
  vendor_id?: string;
  orderFrom?: string;
  orderTo?: string;
  expectedFrom?: string;
  expectedTo?: string;
  minTotal?: number;
  maxTotal?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface POCreateInput {
  name: string;
  description?: string;
  vendor_id: string;
  status?: POStatus;
  order_date?: string;
  expected_date?: string;
  ship_to_address?: Record<string, unknown>;
  shipping_method?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  notes?: string;
  owner_id?: string;
  currency?: string;
}

export interface POUpdateInput extends Partial<POCreateInput> {
  approval_status?: ApprovalStatus;
  received_date?: string;
  discount_percent?: number;
  discount_amount?: number;
  shipping_amount?: number;
  tracking_number?: string;
}

export interface POLineItemCreateInput {
  product_id?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  unit_cost: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  sort_order?: number;
}

export interface POLineItemUpdateInput extends Partial<POLineItemCreateInput> {
  quantity_received?: number;
}
