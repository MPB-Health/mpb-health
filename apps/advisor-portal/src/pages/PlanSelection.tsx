// ============================================================================
// Plan Selection — Compare and upgrade subscription plans
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Zap,
  ArrowLeft,
  Building2,
  Users,
  MessageSquare,
  Sparkles,
  HardDrive,
  ChevronDown,
} from 'lucide-react';
import { useSubscriptionPlans, useSubscription, useBillingActions } from '../hooks/useBilling';
import type { SubscriptionPlan, BillingCycle } from '@mpbhealth/champion-core';

const FEATURE_GROUPS = [
  {
    name: 'Core Features',
    features: [
      { key: 'max_users', label: 'Team members', format: (v: number | null) => v === null ? 'Unlimited' : v.toString() },
      { key: 'max_leads', label: 'Leads', format: (v: number | null) => v === null ? 'Unlimited' : v.toLocaleString() },
      { key: 'max_messages_per_month', label: 'Messages per month', format: (v: number | null) => v === null ? 'Unlimited' : v.toLocaleString() },
      { key: 'max_sequences', label: 'Automation sequences', format: (v: number | null) => v === null ? 'Unlimited' : v.toString() },
    ],
  },
  {
    name: 'AI & Advanced',
    features: [
      { key: 'max_ai_assists_per_month', label: 'AI assists per month', format: (v: number | null) => v === null ? 'Unlimited' : v.toLocaleString() },
      { key: 'storage_gb', label: 'Storage', format: (v: number | null) => v === null ? 'Unlimited' : `${v} GB` },
    ],
  },
];

export default function PlanSelection() {
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { subscription, refresh: refreshSubscription } = useSubscription();
  const { changePlan, loading: actionLoading } = useBillingActions();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billing_cycle || 'monthly'
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentPlanId = subscription?.plan_id;

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlanId) return;
    setSelectedPlan(planId);
    setShowConfirmModal(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;

    const success = await changePlan(selectedPlan);
    if (success) {
      setShowConfirmModal(false);
      refreshSubscription();
      navigate('/billing');
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return (plan.price_yearly / 12).toFixed(2);
    }
    return plan.price_monthly.toFixed(2);
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyCost = plan.price_monthly * 12;
    const yearlyCost = plan.price_yearly;
    const savings = monthlyCost - yearlyCost;
    const percent = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percent };
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const currentPlanDetails = plans.find(p => p.id === currentPlanId);

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/billing')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select the plan that best fits your needs
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 bg-gray-100 rounded-xl p-2 max-w-md mx-auto">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            billingCycle === 'yearly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Yearly
          <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            Save up to 20%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isEnterprise = plan.tier === 'enterprise';
          const savings = getSavings(plan);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular badge */}
              {plan.tier === 'professional' && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-br-lg">
                  Current Plan
                </div>
              )}

              <div className="p-6">
                {/* Plan name */}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 h-10">{plan.description}</p>

                {/* Price */}
                <div className="mt-6">
                  {isEnterprise ? (
                    <div>
                      <p className="text-3xl font-bold text-gray-900">Custom</p>
                      <p className="text-sm text-gray-500">Contact sales</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${getMonthlyEquivalent(plan)}
                        </span>
                        <span className="text-gray-500">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && savings.percent > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Save ${savings.amount.toFixed(0)}/year ({savings.percent}% off)
                        </p>
                      )}
                      {billingCycle === 'yearly' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Billed as ${getPrice(plan).toFixed(0)} annually
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-6">
                  {isEnterprise ? (
                    <a
                      href="mailto:sales@mpbhealth.com"
                      className="block w-full py-3 text-center bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Contact Sales
                    </a>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={actionLoading}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        plan.tier === 'professional'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50`}
                    >
                      {currentPlanDetails && plan.sort_order > currentPlanDetails.sort_order
                        ? 'Upgrade'
                        : 'Switch'}
                    </button>
                  )}
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {plan.features.slice(0, 6).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center px-4 py-3 text-sm font-medium text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((group) => (
                <>
                  <tr key={group.name} className="bg-gray-50">
                    <td colSpan={plans.length + 1} className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {group.name}
                    </td>
                  </tr>
                  {group.features.map((feature) => (
                    <tr key={feature.key} className="border-b border-gray-100">
                      <td className="px-6 py-3 text-sm text-gray-700">{feature.label}</td>
                      {plans.map((plan) => {
                        const value = (plan as any)[feature.key];
                        return (
                          <td key={plan.id} className="text-center px-4 py-3 text-sm text-gray-900">
                            {feature.format(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedPlanDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Plan Change
            </h3>
            <p className="text-gray-600 mb-4">
              You are switching from <strong>{currentPlanDetails?.name}</strong> to{' '}
              <strong>{selectedPlanDetails.name}</strong>.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">New plan price</span>
                <span className="font-semibold text-gray-900">
                  ${getPrice(selectedPlanDetails).toFixed(2)}/{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Changes will take effect immediately. You'll be charged or credited prorated amounts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
