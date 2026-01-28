export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  name: string;
  description: string | null;
  quote_id: string | null;
  deal_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void';
  subtotal: number;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_amount: number | null;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  terms_and_conditions: string | null;
  notes: string | null;
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  owner_id: string | null;
  sent_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithRelations extends Invoice {
  quote?: {
    id: string;
    name: string;
    quote_number: string;
  } | null;
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
  line_items?: InvoiceLineItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
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

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string | null;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InvoiceFilters {
  search?: string;
  status?: string;
  quote_id?: string;
  deal_id?: string;
  account_id?: string;
  contact_id?: string;
  owner_id?: string;
  issueFrom?: string;
  issueTo?: string;
  dueFrom?: string;
  dueTo?: string;
  minTotal?: number;
  maxTotal?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceCreateInput {
  name: string;
  description?: string;
  quote_id?: string;
  deal_id?: string;
  account_id?: string;
  contact_id?: string;
  status?: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void';
  discount_percent?: number;
  discount_amount?: number;
  tax_amount?: number;
  shipping_amount?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  terms_and_conditions?: string;
  notes?: string;
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  owner_id?: string;
}

export interface InvoiceUpdateInput extends Partial<InvoiceCreateInput> {}

export interface InvoiceLineItemCreateInput {
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

export interface InvoiceLineItemUpdateInput extends Partial<InvoiceLineItemCreateInput> {}

export interface PaymentCreateInput {
  amount: number;
  payment_method?: string;
  payment_date?: string;
  reference_number?: string;
  notes?: string;
}
