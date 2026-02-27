import React, { useState, useEffect } from 'react';
import {
  X, Loader2, ExternalLink, CheckCircle, XCircle,
  Shield, DollarSign, List, Share2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import {
  PLAN_TYPE_LABELS,
  MEMBER_TYPE_LABELS,
  AGE_BANDS,
  IUA_OPTIONS,
  MEMBER_TYPES,
} from '@mpbhealth/plans-core';
import type {
  PlanWithDetails,
  PlanPricing,
} from '../../hooks/useAdminPlans';

interface PlanDetailProps {
  planId: string;
  getPlanDetails: (id: string) => Promise<PlanWithDetails | null>;
  onClose: () => void;
  onEditPlan?: () => void;
  onEditPricing?: () => void;
  onEditFeatures?: () => void;
  onEditSharing?: () => void;
}

const IUA_PLAN_TYPES = ['care_plus', 'direct', 'secure_hsa'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export const PlanDetail: React.FC<PlanDetailProps> = ({
  planId,
  getPlanDetails,
  onClose,
  onEditPlan,
  onEditPricing,
  onEditFeatures,
  onEditSharing,
}) => {
  const [plan, setPlan] = useState<PlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const details = await getPlanDetails(planId);
        setPlan(details);
      } catch (err) {
        console.error('Failed to load plan details:', err);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, getPlanDetails]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card className="p-12 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card className="p-8 bg-white text-center">
          <p className="text-neutral-600">Plan not found</p>
          <Button variant="outline" onClick={onClose} className="mt-4">Close</Button>
        </Card>
      </div>
    );
  }

  const isIuaBased = IUA_PLAN_TYPES.includes(plan.plan_type);

  // Group features by category
  const featureGroups = plan.features.reduce<Record<string, typeof plan.features>>((acc, f) => {
    const cat = f.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  // Group pricing into a matrix
  const pricingMatrix: Record<string, Record<string, PlanPricing[]>> = {};
  plan.pricing.forEach(p => {
    const bandKey = `${p.age_min}-${p.age_max}`;
    if (!pricingMatrix[bandKey]) pricingMatrix[bandKey] = {};
    const key = isIuaBased ? `${p.member_type}-${p.iua_amount}` : p.member_type;
    if (!pricingMatrix[bandKey][key]) pricingMatrix[bandKey][key] = [];
    pricingMatrix[bandKey][key].push(p);
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4 overflow-y-auto">
      <Card className="w-full max-w-4xl mx-4 mb-8 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-neutral-900">{plan.name}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type} &bull; Slug: {plan.slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {plan.enroll_url && (
              <a
                href={plan.enroll_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-neutral-100 rounded-lg text-blue-600"
                title="Open enrollment URL"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg" title="Close">
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Plan Info Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Plan Information
              </h3>
              {onEditPlan && (
                <Button variant="outline" size="sm" onClick={onEditPlan}>Edit Plan</Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {plan.tagline && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Tagline:</span>
                  <p className="font-medium">{plan.tagline}</p>
                </div>
              )}
              {plan.description && (
                <div className="col-span-2 md:col-span-4">
                  <span className="text-neutral-500">Description:</span>
                  <p className="text-neutral-700">{plan.description}</p>
                </div>
              )}
              <div>
                <span className="text-neutral-500">Enrollment Fee</span>
                <p className="font-medium">{formatCurrency(plan.enrollment_fee)}</p>
              </div>
              <div>
                <span className="text-neutral-500">Annual Membership</span>
                <p className="font-medium">{formatCurrency(plan.annual_membership_fee)}</p>
              </div>
              <div>
                <span className="text-neutral-500">Tobacco Surcharge</span>
                <p className="font-medium">{plan.tobacco_surcharge_pct}%</p>
              </div>
              <div>
                <span className="text-neutral-500">Sort Order</span>
                <p className="font-medium">{plan.sort_order}</p>
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-3 mt-4">
              {([
                { flag: plan.is_medical_cost_sharing, label: 'Medical Cost Sharing' },
                { flag: plan.is_mec_compliant, label: 'MEC Compliant' },
                { flag: plan.is_hsa_compatible, label: 'HSA Compatible' },
              ]).map(({ flag, label }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    flag ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {flag ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {label}
                </span>
              ))}
            </div>
          </section>

          {/* Pricing Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Current Pricing
                <span className="text-sm font-normal text-neutral-400">({plan.pricing.length} rows)</span>
              </h3>
              {onEditPricing && (
                <Button variant="outline" size="sm" onClick={onEditPricing}>Edit Pricing</Button>
              )}
            </div>

            {plan.pricing.length === 0 ? (
              <p className="text-neutral-500 text-sm">No pricing configured</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Age Band</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Member Type</th>
                      {isIuaBased && (
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">IUA</th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Monthly</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Effective</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {plan.pricing.slice(0, 50).map(p => (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-1.5 text-neutral-700">{p.age_min}-{p.age_max}</td>
                        <td className="px-3 py-1.5 text-neutral-700">{MEMBER_TYPE_LABELS[p.member_type] || p.member_type}</td>
                        {isIuaBased && (
                          <td className="px-3 py-1.5 text-neutral-700">{p.iua_amount ? `$${p.iua_amount.toLocaleString()}` : '-'}</td>
                        )}
                        <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(p.monthly_contribution)}</td>
                        <td className="px-3 py-1.5 text-neutral-500">{p.effective_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {plan.pricing.length > 50 && (
                  <p className="text-xs text-neutral-400 mt-2">Showing first 50 of {plan.pricing.length} rows</p>
                )}
              </div>
            )}
          </section>

          {/* Features Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <List className="h-5 w-5 text-purple-600" />
                Features
                <span className="text-sm font-normal text-neutral-400">({plan.features.length})</span>
              </h3>
              {onEditFeatures && (
                <Button variant="outline" size="sm" onClick={onEditFeatures}>Edit Features</Button>
              )}
            </div>

            {plan.features.length === 0 ? (
              <p className="text-neutral-500 text-sm">No features configured</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(featureGroups).map(([cat, feats]) => (
                  <div key={cat}>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs uppercase font-medium">
                      {cat}
                    </span>
                    <div className="mt-1 ml-2 text-sm text-neutral-700">
                      {feats.sort((a, b) => a.sort_order - b.sort_order).map(f => (
                        <div key={f.id} className="flex gap-2 py-0.5">
                          <span className="font-medium">{f.feature_name}</span>
                          {f.feature_value && <span className="text-neutral-500">— {f.feature_value}</span>}
                          {f.cost && <span className="text-green-600">({f.cost})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sharing Details Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-teal-600" />
                Sharing Details
              </h3>
              {onEditSharing && (
                <Button variant="outline" size="sm" onClick={onEditSharing}>Edit Sharing</Button>
              )}
            </div>

            {!plan.sharing_details ? (
              <p className="text-neutral-500 text-sm">No sharing details configured</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Annual Cap</span>
                  <p className="font-medium">{plan.sharing_details.has_annual_cap ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Lifetime Cap</span>
                  <p className="font-medium">{plan.sharing_details.has_lifetime_cap ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">International Coverage</span>
                  <p className="font-medium">{plan.sharing_details.has_international_coverage ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Pre-existing Lookback</span>
                  <p className="font-medium">{plan.sharing_details.preexisting_lookback_months != null ? `${plan.sharing_details.preexisting_lookback_months} months` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Maternity Waiting</span>
                  <p className="font-medium">{plan.sharing_details.maternity_waiting_months != null ? `${plan.sharing_details.maternity_waiting_months} months` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">IUA Options</span>
                  <p className="font-medium">
                    {plan.sharing_details.iua_options && plan.sharing_details.iua_options.length > 0
                      ? plan.sharing_details.iua_options.map(v => `$${v.toLocaleString()}`).join(', ')
                      : 'None'
                    }
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};
