// ============================================================================
// Billing & Subscription Types
// ============================================================================

export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type PaymentMethodType = 'card' | 'bank_account' | 'ach';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: PlanTier;

  // Pricing
  price_monthly: number;
  price_yearly: number;
  currency: string;

  // Limits
  max_users: number | null;
  max_leads: number | null;
  max_messages_per_month: number | null;
  max_sequences: number | null;
  max_ai_assists_per_month: number | null;
  storage_gb: number;

  // Features
  features: string[];

  // Status
  is_active: boolean;
  is_public: boolean;
  sort_order: number;

  // Stripe
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: string;
  org_id: string;
  plan_id: string;

  // Status
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;

  // Dates
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;

  // Stripe
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;

  // Overrides
  custom_limits: Record<string, number> | null;
  discount_percent: number;

  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithPlan extends OrganizationSubscription {
  plan: SubscriptionPlan;
}

export interface UsageRecord {
  id: string;
  org_id: string;
  subscription_id: string | null;

  // Period
  period_start: string;
  period_end: string;

  // Usage metrics
  users_count: number;
  leads_count: number;
  messages_sent: number;
  sequences_active: number;
  ai_assists_used: number;
  storage_used_mb: number;

  // Detailed breakdown
  messages_sms: number;
  messages_email: number;
  ai_message_assists: number;
  ai_score_adjustments: number;

  // Status
  is_current: boolean;
  finalized_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface UsageWithLimit {
  metric: string;
  current_value: number;
  limit_value: number | null;
  usage_percent: number;
}

export interface Invoice {
  id: string;
  org_id: string;
  subscription_id: string | null;

  // Details
  invoice_number: string;
  status: InvoiceStatus;

  // Amounts
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;

  // Period
  period_start: string | null;
  period_end: string | null;

  // Dates
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;

  // Line items
  line_items: InvoiceLineItem[];

  // Stripe
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;

  // Metadata
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  org_id: string;

  // Type
  type: PaymentMethodType;

  // Card details
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;

  // Bank details
  bank_name: string | null;
  account_last4: string | null;

  // Status
  is_default: boolean;
  is_verified: boolean;

  // Stripe
  stripe_payment_method_id: string;

  // Billing address
  billing_name: string | null;
  billing_email: string | null;
  billing_address: BillingAddress | null;

  created_at: string;
  updated_at: string;
}

export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface BillingEvent {
  id: string;
  org_id: string;
  subscription_id: string | null;
  invoice_id: string | null;

  event_type: string;
  description: string | null;
  data: Record<string, unknown>;

  stripe_event_id: string | null;

  created_at: string;
}

// Input types
export interface CreateSubscriptionInput {
  plan_id: string;
  billing_cycle: BillingCycle;
  trial_days?: number;
  discount_percent?: number;
}

export interface UpdateSubscriptionInput {
  plan_id?: string;
  billing_cycle?: BillingCycle;
  cancel_at_period_end?: boolean;
}

export interface AddPaymentMethodInput {
  stripe_payment_method_id: string;
  set_as_default?: boolean;
}

// Summary types
export interface BillingSummary {
  subscription: SubscriptionWithPlan | null;
  current_usage: UsageWithLimit[];
  upcoming_invoice_amount: number;
  next_billing_date: string | null;
  payment_method: PaymentMethod | null;
  active_addons: SubscriptionAddon[];
  total_monthly_cost: number;
}

export interface UsageSummary {
  period_start: string;
  period_end: string;
  metrics: UsageWithLimit[];
  limits_exceeded: string[];
  days_remaining: number;
}

// ============================================================================
// Modular Add-on Types (SaaS Packaging)
// ============================================================================

export interface SubscriptionAddon {
  id: string;
  org_id: string;
  module_slug: string;
  module_name: string;
  price_monthly: number;
  price_yearly: number;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  stripe_subscription_item_id: string | null;
  activated_at: string;
  canceled_at: string | null;
}

export interface AddAddonInput {
  module_slug: string;
  billing_cycle: BillingCycle;
}

export interface RemoveAddonInput {
  module_slug: string;
  immediate?: boolean;
}

export type MeteredBillingMetric = 'members' | 'enrollments' | 'tickets' | 'seats';

export interface MeteredUsageRecord {
  id: string;
  org_id: string;
  metric: MeteredBillingMetric;
  quantity: number;
  unit_price: number;
  total: number;
  period_start: string;
  period_end: string;
  stripe_usage_record_id: string | null;
  reported_at: string;
}

export interface ReportMeteredUsageInput {
  metric: MeteredBillingMetric;
  quantity: number;
  timestamp?: string;
}

export interface CheckoutSessionInput {
  plan_id: string;
  billing_cycle: BillingCycle;
  addon_slugs?: string[];
  success_url: string;
  cancel_url: string;
  trial_days?: number;
  coupon_code?: string;
}
