import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Heart,
  Shield,
  ExternalLink,
  Eye,
  EyeOff,
  Users,
  Calendar,
  Info,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {
  createPlanService,
  createPlanPricingService,
  createPlanFeatureService,
  MEMBER_TYPE_LABELS,
  PLAN_TYPE_LABELS,
  AGE_BANDS,
  type PlanWithDetails,
  type PlanPricing,
} from '@mpbhealth/plans-core';

const planService = createPlanService(supabase);
const pricingService = createPlanPricingService(supabase);
const featureService = createPlanFeatureService(supabase);

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getPlanTypeIcon(planType: string) {
  switch (planType) {
    case 'care_plus':
    case 'direct':
      return Heart;
    case 'secure_hsa':
      return Shield;
    default:
      return Package;
  }
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<PlanWithDetails | null>(null);
  const [currentPricing, setCurrentPricing] = useState<PlanPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIua, setSelectedIua] = useState<string>('all');

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const planData = await planService.getPlan(id);
      if (!planData) {
        toast.error('Plan not found');
        navigate('/products');
        return;
      }
      setPlan(planData);

      const pricing = await pricingService.getCurrentPricing(id);
      setCurrentPricing(pricing);

      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!plan) return null;

  const Icon = getPlanTypeIcon(plan.plan_type);
  const isIuaPlan = ['care_plus', 'direct', 'secure_hsa'].includes(plan.plan_type);
  const startingPrice = currentPricing.length > 0
    ? Math.min(...currentPricing.map((r) => Number(r.monthly_contribution)))
    : null;

  // Get IUA options from pricing
  const iuaOptions = [...new Set(currentPricing.filter((r) => r.iua_amount != null).map((r) => Number(r.iua_amount)))].sort((a, b) => a - b);

  // Filter pricing by selected IUA
  const filteredPricing = selectedIua === 'all'
    ? currentPricing
    : currentPricing.filter((r) =>
        selectedIua === 'flat'
          ? r.iua_amount == null
          : Number(r.iua_amount) === Number(selectedIua)
      );

  // Group features by category
  const featuresByCategory = plan.features.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, typeof plan.features>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-secondary" />
          </button>
          <div className="w-12 h-12 bg-th-accent-100 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-th-accent-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-th-text-primary">{plan.name}</h1>
              {plan.is_active ? (
                <span className="flex items-center space-x-1 text-xs font-medium px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                  <Eye className="w-3 h-3" />
                  <span>Live on Website</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-medium px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  <EyeOff className="w-3 h-3" />
                  <span>Hidden</span>
                </span>
              )}
            </div>
            <p className="text-sm text-th-text-tertiary mt-0.5">
              {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
              {plan.tagline ? ` — ${plan.tagline}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {plan.enroll_url && (
            <a
              href={plan.enroll_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Enrollment Page</span>
            </a>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-2 text-th-text-tertiary mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Starting Price</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">
            {startingPrice != null ? `${formatCurrency(startingPrice)}` : '-'}
          </p>
          <p className="text-xs text-th-text-tertiary mt-0.5">/month</p>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-2 text-th-text-tertiary mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Enrollment Fee</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">
            {formatCurrency(Number(plan.enrollment_fee) || 0)}
          </p>
          <p className="text-xs text-th-text-tertiary mt-0.5">one-time</p>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-2 text-th-text-tertiary mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Annual Membership</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">
            {formatCurrency(Number(plan.annual_membership_fee) || 0)}
          </p>
          <p className="text-xs text-th-text-tertiary mt-0.5">/year</p>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-2 text-th-text-tertiary mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Tobacco Surcharge</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">
            {Number(plan.tobacco_surcharge_pct) > 0 ? `+${formatCurrency(Number(plan.tobacco_surcharge_pct))}` : '$0'}
          </p>
          <p className="text-xs text-th-text-tertiary mt-0.5">/month</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Pricing Matrix */}
        <div className="col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-xl border border-th-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-th-accent-600" />
                <span>Pricing Matrix</span>
              </h2>
              {isIuaPlan && iuaOptions.length > 0 && (
                <div className="relative">
                  <select
                    aria-label="Filter by IUA tier"
                    value={selectedIua}
                    onChange={(e) => setSelectedIua(e.target.value)}
                    className="appearance-none bg-surface-tertiary border-none rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  >
                    <option value="all">All IUA Tiers</option>
                    {iuaOptions.map((iua) => (
                      <option key={iua} value={iua}>${iua.toLocaleString()} IUA</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
                </div>
              )}
            </div>

            {isIuaPlan ? (
              // IUA pricing grouped by tier
              <div className="space-y-6">
                {(selectedIua === 'all' ? iuaOptions : [Number(selectedIua)]).map((iua) => {
                  const iuaRows = filteredPricing.filter((r) => Number(r.iua_amount) === iua);
                  if (iuaRows.length === 0) return null;

                  return (
                    <div key={iua}>
                      <h3 className="text-sm font-semibold text-th-accent-600 mb-2">${iua.toLocaleString()} IUA</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-tertiary">
                            <th className="text-left px-4 py-2 text-xs font-medium text-th-text-tertiary">Member Type</th>
                            {AGE_BANDS.map((b) => (
                              <th key={b.label} className="text-center px-4 py-2 text-xs font-medium text-th-text-tertiary">
                                Age {b.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-th-border">
                          {Object.entries(MEMBER_TYPE_LABELS).map(([mt, label]) => {
                            const mtRows = iuaRows.filter((r) => r.member_type === mt);
                            if (mtRows.length === 0) return null;
                            return (
                              <tr key={mt} className="hover:bg-surface-secondary/50">
                                <td className="px-4 py-2.5 text-th-text-secondary font-medium">{label}</td>
                                {AGE_BANDS.map((band) => {
                                  const match = mtRows.find((r) => r.age_min === band.min && r.age_max === band.max);
                                  return (
                                    <td key={band.label} className="text-center px-4 py-2.5 font-semibold text-th-text-primary">
                                      {match ? formatCurrency(Number(match.monthly_contribution)) : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Flat rate pricing
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-tertiary">
                    <th className="text-left px-4 py-2 text-xs font-medium text-th-text-tertiary">Member Type</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-th-text-tertiary">Monthly Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {currentPricing.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-secondary/50">
                      <td className="px-4 py-2.5 text-th-text-secondary font-medium">
                        {MEMBER_TYPE_LABELS[row.member_type] || row.member_type}
                      </td>
                      <td className="text-center px-4 py-2.5 font-semibold text-th-text-primary">
                        {formatCurrency(Number(row.monthly_contribution))}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column: Details & Features */}
        <div className="space-y-6">
          {/* Plan Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5">
            <h2 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Plan Details</span>
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-th-text-tertiary">Slug</dt>
                <dd className="text-th-text-primary font-medium">{plan.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-th-text-tertiary">Plan Type</dt>
                <dd className="text-th-text-primary font-medium">{PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}</dd>
              </div>
              {plan.code && (
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">Code</dt>
                  <dd className="text-th-text-primary font-medium">{plan.code}</dd>
                </div>
              )}
              {plan.external_product_id && (
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">External ID</dt>
                  <dd className="text-th-text-primary font-medium">{plan.external_product_id}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-th-text-tertiary">Currency</dt>
                <dd className="text-th-text-primary font-medium">{plan.currency}</dd>
              </div>
            </dl>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-th-border">
              {plan.is_medical_cost_sharing && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Medical Cost Sharing</span>
              )}
              {plan.is_mec_compliant && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">MEC Compliant</span>
              )}
              {plan.is_hsa_compatible && (
                <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded font-medium">HSA Compatible</span>
              )}
            </div>
          </div>

          {/* Features */}
          {Object.keys(featuresByCategory).length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-5">
              <h2 className="text-sm font-semibold text-th-text-primary mb-4">Plan Features</h2>
              <div className="space-y-4">
                {Object.entries(featuresByCategory).map(([category, catFeatures]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-th-text-tertiary uppercase mb-2">{category}</h3>
                    <ul className="space-y-1.5">
                      {catFeatures.map((feature) => (
                        <li key={feature.id} className="text-sm text-th-text-secondary flex justify-between">
                          <span>{feature.feature_name}</span>
                          {feature.cost && (
                            <span className="text-th-text-tertiary text-xs">{feature.cost}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sharing Details */}
          {plan.sharing_details && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-5">
              <h2 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Sharing Details</span>
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">Lifetime Cap</dt>
                  <dd className="text-th-text-primary">{plan.sharing_details.has_lifetime_cap ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">Annual Cap</dt>
                  <dd className="text-th-text-primary">{plan.sharing_details.has_annual_cap ? 'Yes' : 'No'}</dd>
                </div>
                {plan.sharing_details.preexisting_lookback_months && (
                  <div className="flex justify-between">
                    <dt className="text-th-text-tertiary">Pre-existing Lookback</dt>
                    <dd className="text-th-text-primary">{plan.sharing_details.preexisting_lookback_months} months</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">International Coverage</dt>
                  <dd className="text-th-text-primary">{plan.sharing_details.has_international_coverage ? 'Yes' : 'No'}</dd>
                </div>
                {plan.sharing_details.iua_options && (
                  <div className="flex justify-between">
                    <dt className="text-th-text-tertiary">IUA Options</dt>
                    <dd className="text-th-text-primary">
                      {(plan.sharing_details.iua_options as number[]).map((iua) => `$${iua.toLocaleString()}`).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
