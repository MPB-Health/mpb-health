// ============================================================================
// Billing Dashboard — View subscription, usage, and invoices
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings,
  Download,
  ExternalLink,
  Zap,
  Users,
  MessageSquare,
  Sparkles,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  useBillingSummary,
  useInvoices,
  usePaymentMethods,
  useBillingActions,
} from '../hooks/useBilling';

const METRIC_ICONS: Record<string, typeof Users> = {
  users: Users,
  leads: Users,
  messages: MessageSquare,
  sequences: Zap,
  ai_assists: Sparkles,
  storage: HardDrive,
};

const METRIC_LABELS: Record<string, string> = {
  users: 'Team Members',
  leads: 'Leads',
  messages: 'Messages',
  sequences: 'Sequences',
  ai_assists: 'AI Assists',
  storage: 'Storage',
};

export default function Billing() {
  const { summary, loading: summaryLoading, refresh: refreshSummary } = useBillingSummary();
  const { invoices, loading: invoicesLoading } = useInvoices({ limit: 5 });
  const { paymentMethods, loading: paymentLoading } = usePaymentMethods();
  const { cancelSubscription, reactivateSubscription, loading: actionLoading } = useBillingActions();

  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = summary?.subscription;
  const plan = subscription?.plan;
  const defaultPayment = paymentMethods.find(p => p.is_default);

  const handleCancel = async () => {
    const success = await cancelSubscription(false);
    if (success) {
      setShowCancelModal(false);
      refreshSummary();
    }
  };

  const handleReactivate = async () => {
    const success = await reactivateSubscription();
    if (success) {
      refreshSummary();
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your plan, usage, and payment methods
          </p>
        </div>
        <Link
          to="/billing/plans"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Upgrade Plan
        </Link>
      </div>

      {/* Cancellation Warning */}
      {subscription?.cancel_at_period_end && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Subscription Canceling</p>
              <p className="text-sm text-yellow-600">
                Your subscription will end on {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <button
            onClick={handleReactivate}
            disabled={actionLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
          >
            Reactivate
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Plan</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {plan?.name || 'No Plan'}
                  </h2>
                  {plan?.description && (
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    ${subscription?.billing_cycle === 'yearly' ? plan?.price_yearly : plan?.price_monthly}
                  </p>
                  <p className="text-sm text-gray-500">
                    per {subscription?.billing_cycle === 'yearly' ? 'year' : 'month'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium flex items-center gap-1.5 mt-1">
                    {subscription?.status === 'active' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Active</span>
                      </>
                    )}
                    {subscription?.status === 'trialing' && (
                      <>
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-700">Trial</span>
                      </>
                    )}
                    {subscription?.status === 'past_due' && (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Past Due</span>
                      </>
                    )}
                    {subscription?.status === 'canceled' && (
                      <>
                        <AlertTriangle className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Canceled</span>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Billing Cycle</p>
                  <p className="font-medium capitalize mt-1">{subscription?.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Period</p>
                  <p className="font-medium mt-1">
                    {subscription && (
                      <>
                        {format(new Date(subscription.current_period_start), 'MMM d')} -{' '}
                        {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Next Billing</p>
                  <p className="font-medium mt-1">
                    {summary?.next_billing_date
                      ? format(new Date(summary.next_billing_date), 'MMMM d, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <Link
                  to="/billing/plans"
                  className="flex-1 py-2 text-center bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Change Plan
                </Link>
                {!subscription?.cancel_at_period_end && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Current Usage</h3>
              <span className="text-sm text-gray-500">
                Resets {summary?.next_billing_date
                  ? formatDistanceToNow(new Date(summary.next_billing_date), { addSuffix: true })
                  : 'soon'}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {summary?.current_usage.map((metric) => {
                const Icon = METRIC_ICONS[metric.metric] || TrendingUp;
                const label = METRIC_LABELS[metric.metric] || metric.metric;
                const isUnlimited = metric.limit_value === null;

                return (
                  <div key={metric.metric}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      <span className={`text-sm font-medium ${getUsageColor(metric.usage_percent)}`}>
                        {metric.current_value.toLocaleString()}
                        {!isUnlimited && ` / ${metric.limit_value?.toLocaleString()}`}
                        {isUnlimited && ' (Unlimited)'}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageBarColor(metric.usage_percent)} transition-all duration-500`}
                          style={{ width: `${Math.min(100, metric.usage_percent)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {(!summary?.current_usage || summary.current_usage.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No usage data available</p>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
              <Link
                to="/billing/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {invoicesLoading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : invoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${invoice.total.toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      {invoice.invoice_pdf_url && (
                        <a
                          href={invoice.invoice_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Payment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Payment</h3>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-gray-900">
                ${summary?.upcoming_invoice_amount.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Due {summary?.next_billing_date
                  ? format(new Date(summary.next_billing_date), 'MMMM d, yyyy')
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Payment Method</h3>
              <Link
                to="/billing/payment-methods"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage
              </Link>
            </div>
            {paymentLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : defaultPayment ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {defaultPayment.card_brand} •••• {defaultPayment.card_last4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires {defaultPayment.card_exp_month}/{defaultPayment.card_exp_year}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No payment method</p>
                <Link
                  to="/billing/payment-methods"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Add Payment Method
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to="/billing/plans"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Compare Plans</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                to="/billing/invoices"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Invoice History</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                to="/billing/usage"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Usage Analytics</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-4">
              Your subscription will remain active until the end of the current billing period
              ({subscription && format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}).
              You can reactivate anytime before then.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Canceling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
