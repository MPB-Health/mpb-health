// ============================================================================
// Billing & Usage Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  billingService,
  usageService,
  SubscriptionPlan,
  SubscriptionWithPlan,
  Invoice,
  PaymentMethod,
  BillingSummary,
  UsageSummary,
  UsageRecord,
  BillingEvent,
  BillingCycle,
} from '@mpbhealth/champion-core';
import { useOrganization } from './useOrganization';

// ============================================================================
// PLANS
// ============================================================================

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await billingService.getPlans();
        setPlans(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load plans'));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { plans, loading, error };
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export function useSubscription() {
  const { organization } = useOrganization();
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await billingService.getSubscription(organization.id);
      setSubscription(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load subscription'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, loading, error, refresh };
}

// ============================================================================
// BILLING SUMMARY
// ============================================================================

export function useBillingSummary() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await billingService.getBillingSummary(organization.id);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load billing summary'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}

// ============================================================================
// USAGE
// ============================================================================

export function useUsageSummary() {
  const { organization } = useOrganization();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await usageService.getUsageSummary(organization.id);
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load usage'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}

export function useUsageHistory(months: number = 12) {
  const { organization } = useOrganization();
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organization?.id) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const data = await usageService.getUsageHistory(organization.id, { months });
        setHistory(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load usage history'));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [organization?.id, months]);

  return { history, loading, error };
}

// ============================================================================
// INVOICES
// ============================================================================

export function useInvoices(options: { status?: string; limit?: number } = {}) {
  const { organization } = useOrganization();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await billingService.getInvoices(organization.id, options);
      setInvoices(data.invoices);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, options.status, options.limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { invoices, total, loading, error, refresh };
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export function usePaymentMethods() {
  const { organization } = useOrganization();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await billingService.getPaymentMethods(organization.id);
      setPaymentMethods(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load payment methods'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { paymentMethods, loading, error, refresh };
}

// ============================================================================
// BILLING EVENTS
// ============================================================================

export function useBillingEvents(limit: number = 20) {
  const { organization } = useOrganization();
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organization?.id) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const data = await billingService.getBillingEvents(organization.id, { limit });
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load billing events'));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [organization?.id, limit]);

  return { events, loading, error };
}

// ============================================================================
// BILLING ACTIONS
// ============================================================================

export function useBillingActions() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const changePlan = useCallback(async (planId: string) => {
    if (!organization?.id) return false;

    setLoading(true);
    setError(null);
    try {
      await billingService.updateSubscription(organization.id, { plan_id: planId });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to change plan'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const changeBillingCycle = useCallback(async (cycle: BillingCycle) => {
    if (!organization?.id) return false;

    setLoading(true);
    setError(null);
    try {
      await billingService.updateSubscription(organization.id, { billing_cycle: cycle });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to change billing cycle'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const cancelSubscription = useCallback(async (immediate: boolean = false) => {
    if (!organization?.id) return false;

    setLoading(true);
    setError(null);
    try {
      await billingService.cancelSubscription(organization.id, immediate);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const reactivateSubscription = useCallback(async () => {
    if (!organization?.id) return false;

    setLoading(true);
    setError(null);
    try {
      await billingService.reactivateSubscription(organization.id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reactivate subscription'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    if (!organization?.id) return false;

    setLoading(true);
    setError(null);
    try {
      await billingService.setDefaultPaymentMethod(organization.id, paymentMethodId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to set default payment method'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);
    try {
      await billingService.removePaymentMethod(paymentMethodId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove payment method'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    changePlan,
    changeBillingCycle,
    cancelSubscription,
    reactivateSubscription,
    setDefaultPaymentMethod,
    removePaymentMethod,
    loading,
    error,
  };
}

// ============================================================================
// USAGE LIMIT CHECK
// ============================================================================

export function useUsageLimitCheck() {
  const { organization } = useOrganization();

  const canPerformAction = useCallback(async (
    action: 'send_message' | 'add_lead' | 'add_sequence' | 'use_ai_assist'
  ) => {
    if (!organization?.id) return { allowed: true };
    return usageService.canPerformAction(organization.id, action);
  }, [organization?.id]);

  return { canPerformAction };
}
