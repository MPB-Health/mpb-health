// ============================================================================
// Billing Service — Manages subscriptions, invoices, and payment methods
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  SubscriptionPlan,
  OrganizationSubscription,
  SubscriptionWithPlan,
  Invoice,
  PaymentMethod,
  BillingEvent,
  BillingSummary,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  AddPaymentMethodInput,
  BillingCycle,
} from './types';

export class BillingService {
  // =========================================================================
  // PLANS
  // =========================================================================

  /**
   * Get all available subscription plans
   */
  async getPlans(options: { includePrivate?: boolean } = {}): Promise<SubscriptionPlan[]> {
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[BillingService] Failed to get plans:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single plan by ID or slug
   */
  async getPlan(idOrSlug: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[BillingService] Failed to get plan:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  /**
   * Get organization's subscription
   */
  async getSubscription(orgId: string): Promise<SubscriptionWithPlan | null> {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[BillingService] Failed to get subscription:', error);
      throw error;
    }

    return data as SubscriptionWithPlan | null;
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    orgId: string,
    input: CreateSubscriptionInput
  ): Promise<OrganizationSubscription> {
    const now = new Date();
    const periodEnd = new Date(now);

    if (input.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let trialStart = null;
    let trialEnd = null;
    let status: 'trialing' | 'active' = 'active';

    if (input.trial_days && input.trial_days > 0) {
      trialStart = now.toISOString();
      trialEnd = new Date(now.getTime() + input.trial_days * 24 * 60 * 60 * 1000).toISOString();
      status = 'trialing';
    }

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .insert({
        org_id: orgId,
        plan_id: input.plan_id,
        billing_cycle: input.billing_cycle,
        status,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: trialStart,
        trial_end: trialEnd,
        discount_percent: input.discount_percent || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[BillingService] Failed to create subscription:', error);
      throw error;
    }

    // Log event
    await this.logBillingEvent(orgId, data.id, null, 'subscription.created', 'Subscription created', {
      plan_id: input.plan_id,
      billing_cycle: input.billing_cycle,
    });

    return data;
  }

  /**
   * Update subscription (change plan, billing cycle, etc.)
   */
  async updateSubscription(
    orgId: string,
    input: UpdateSubscriptionInput
  ): Promise<OrganizationSubscription> {
    const current = await this.getSubscription(orgId);
    if (!current) {
      throw new Error('No subscription found');
    }

    const updateData: Record<string, unknown> = {};

    if (input.plan_id && input.plan_id !== current.plan_id) {
      updateData.plan_id = input.plan_id;
    }

    if (input.billing_cycle && input.billing_cycle !== current.billing_cycle) {
      updateData.billing_cycle = input.billing_cycle;
    }

    if (typeof input.cancel_at_period_end === 'boolean') {
      updateData.cancel_at_period_end = input.cancel_at_period_end;
      if (input.cancel_at_period_end) {
        updateData.canceled_at = new Date().toISOString();
      } else {
        updateData.canceled_at = null;
      }
    }

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update(updateData)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('[BillingService] Failed to update subscription:', error);
      throw error;
    }

    // Log event
    await this.logBillingEvent(orgId, data.id, null, 'subscription.updated', 'Subscription updated', updateData);

    return data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(orgId: string, immediate: boolean = false): Promise<void> {
    const current = await this.getSubscription(orgId);
    if (!current) {
      throw new Error('No subscription found');
    }

    const updateData: Record<string, unknown> = {
      canceled_at: new Date().toISOString(),
    };

    if (immediate) {
      updateData.status = 'canceled';
    } else {
      updateData.cancel_at_period_end = true;
    }

    const { error } = await supabase
      .from('organization_subscriptions')
      .update(updateData)
      .eq('org_id', orgId);

    if (error) {
      console.error('[BillingService] Failed to cancel subscription:', error);
      throw error;
    }

    await this.logBillingEvent(orgId, current.id, null, 'subscription.canceled', 'Subscription canceled', {
      immediate,
    });
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(orgId: string): Promise<OrganizationSubscription> {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update({
        status: 'active',
        canceled_at: null,
        cancel_at_period_end: false,
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('[BillingService] Failed to reactivate subscription:', error);
      throw error;
    }

    await this.logBillingEvent(orgId, data.id, null, 'subscription.reactivated', 'Subscription reactivated', {});

    return data;
  }

  // =========================================================================
  // INVOICES
  // =========================================================================

  /**
   * Get invoices for an organization
   */
  async getInvoices(
    orgId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ invoices: Invoice[]; total: number }> {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('invoice_date', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[BillingService] Failed to get invoices:', error);
      throw error;
    }

    return { invoices: data || [], total: count || 0 };
  }

  /**
   * Get a single invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[BillingService] Failed to get invoice:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create an invoice
   */
  async createInvoice(orgId: string): Promise<Invoice> {
    const { data, error } = await supabase.rpc('create_subscription_invoice', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[BillingService] Failed to create invoice:', error);
      throw error;
    }

    const invoice = await this.getInvoice(data);
    if (!invoice) {
      throw new Error('Failed to fetch created invoice');
    }

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, amountPaid?: number): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: amountPaid || invoice.total,
        amount_due: 0,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('[BillingService] Failed to mark invoice paid:', error);
      throw error;
    }

    await this.logBillingEvent(invoice.org_id, invoice.subscription_id, invoiceId, 'invoice.paid', 'Invoice paid', {
      amount: amountPaid || invoice.total,
    });
  }

  // =========================================================================
  // PAYMENT METHODS
  // =========================================================================

  /**
   * Get payment methods for an organization
   */
  async getPaymentMethods(orgId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BillingService] Failed to get payment methods:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(orgId: string): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[BillingService] Failed to get default payment method:', error);
      throw error;
    }

    return data;
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(
    orgId: string,
    input: AddPaymentMethodInput & {
      type: 'card' | 'bank_account';
      card_brand?: string;
      card_last4?: string;
      card_exp_month?: number;
      card_exp_year?: number;
      bank_name?: string;
      account_last4?: string;
    }
  ): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        org_id: orgId,
        type: input.type,
        stripe_payment_method_id: input.stripe_payment_method_id,
        card_brand: input.card_brand,
        card_last4: input.card_last4,
        card_exp_month: input.card_exp_month,
        card_exp_year: input.card_exp_year,
        bank_name: input.bank_name,
        account_last4: input.account_last4,
        is_default: input.set_as_default ?? false,
        is_verified: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[BillingService] Failed to add payment method:', error);
      throw error;
    }

    return data;
  }

  /**
   * Set payment method as default
   */
  async setDefaultPaymentMethod(orgId: string, paymentMethodId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('org_id', orgId)
      .eq('id', paymentMethodId);

    if (error) {
      console.error('[BillingService] Failed to set default payment method:', error);
      throw error;
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId);

    if (error) {
      console.error('[BillingService] Failed to remove payment method:', error);
      throw error;
    }
  }

  // =========================================================================
  // BILLING SUMMARY
  // =========================================================================

  /**
   * Get billing summary for an organization
   */
  async getBillingSummary(orgId: string): Promise<BillingSummary> {
    const [subscription, usageData, paymentMethod] = await Promise.all([
      this.getSubscription(orgId),
      supabase.rpc('get_usage_with_limits', { p_org_id: orgId }),
      this.getDefaultPaymentMethod(orgId),
    ]);

    const usage = usageData.data || [];

    let upcomingAmount = 0;
    if (subscription?.plan) {
      upcomingAmount = subscription.billing_cycle === 'yearly'
        ? subscription.plan.price_yearly
        : subscription.plan.price_monthly;

      if (subscription.discount_percent) {
        upcomingAmount *= (1 - subscription.discount_percent / 100);
      }
    }

    return {
      subscription,
      current_usage: usage,
      upcoming_invoice_amount: upcomingAmount,
      next_billing_date: subscription?.current_period_end || null,
      payment_method: paymentMethod,
    };
  }

  // =========================================================================
  // BILLING EVENTS
  // =========================================================================

  /**
   * Get billing events for an organization
   */
  async getBillingEvents(
    orgId: string,
    options: { limit?: number } = {}
  ): Promise<BillingEvent[]> {
    let query = supabase
      .from('billing_events')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[BillingService] Failed to get billing events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Log a billing event
   */
  private async logBillingEvent(
    orgId: string,
    subscriptionId: string | null,
    invoiceId: string | null,
    eventType: string,
    description: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('billing_events').insert({
      org_id: orgId,
      subscription_id: subscriptionId,
      invoice_id: invoiceId,
      event_type: eventType,
      description,
      data,
    });
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Calculate price with proration
   */
  calculateProration(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    billingCycle: BillingCycle,
    daysRemaining: number,
    totalDays: number
  ): { credit: number; charge: number; net: number } {
    const currentPrice = billingCycle === 'yearly' ? currentPlan.price_yearly : currentPlan.price_monthly;
    const newPrice = billingCycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly;

    const dailyCurrentRate = currentPrice / totalDays;
    const dailyNewRate = newPrice / totalDays;

    const credit = dailyCurrentRate * daysRemaining;
    const charge = dailyNewRate * daysRemaining;
    const net = charge - credit;

    return {
      credit: Math.round(credit * 100) / 100,
      charge: Math.round(charge * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  }

  /**
   * Check if feature is available on plan
   */
  isPlanFeatureAvailable(plan: SubscriptionPlan, feature: string): boolean {
    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
  }
}

export const billingService = new BillingService();
