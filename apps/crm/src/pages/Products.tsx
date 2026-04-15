import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  Heart,
  Shield,
  DollarSign,
  ExternalLink,
  Users,
  Calculator,
  ToggleRight,
  ToggleLeft,
  Eye,
  EyeOff,
  BarChart3,
  ArrowLeftRight,
  Layers,
  MapPin,
  Swords,
  Brain,
  TrendingUp,
  PieChart,
  MessageSquare,
} from 'lucide-react';
import {
  ProductAnalyticsModal,
  ProductComparisonModal,
  PricingAnalyticsModal,
  ProductMixModal,
  RateCalculatorModal,
  ProductBundleModal,
  ProductAvailabilityModal,
  CompetitorPricingModal,
  ProductRecommendationModal,
  ProductTrendModal,
  ProductMarginModal,
  ProductFeedbackModal,
} from '../components/products';
import toast from 'react-hot-toast';
import { HelpBanner } from '../components/help';
import { supabase } from '../lib/supabase';
import {
  createPlanService,
  createPlanRateEngine,
  createPlanPricingService,
  MEMBER_TYPE_LABELS,
  PLAN_TYPE_LABELS,
  AGE_BANDS,
  type Plan,
  type PlanFilters,
  type PlanPricing,
} from '@mpbhealth/plans-core';

const planService = createPlanService(supabase);
const rateEngine = createPlanRateEngine(supabase);
const pricingService = createPlanPricingService(supabase);

// Plan type icon mapping
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Pricing Matrix Accordion
// ---------------------------------------------------------------------------
function PricingMatrix({ planId, isIuaPlan }: { planId: string; isIuaPlan: boolean }) {
  const [pricing, setPricing] = useState<PlanPricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await pricingService.getCurrentPricing(planId);
      setPricing(data);
      setLoading(false);
    })();
  }, [planId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (pricing.length === 0) {
    return <p className="text-sm text-th-text-tertiary py-4 text-center">No pricing data</p>;
  }

  if (isIuaPlan) {
    // Group by IUA amount
    const iuaGroups = new Map<number, PlanPricing[]>();
    for (const row of pricing) {
      const iua = Number(row.iua_amount) || 0;
      if (!iuaGroups.has(iua)) iuaGroups.set(iua, []);
      iuaGroups.get(iua)!.push(row);
    }

    return (
      <div className="space-y-4">
        {[...iuaGroups.entries()].sort(([a], [b]) => a - b).map(([iua, rows]) => (
          <div key={iua}>
            <h4 className="text-xs font-semibold text-th-accent-600 mb-2">${iua.toLocaleString()} IUA</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-tertiary">
                    <th className="text-left px-3 py-1.5 text-th-text-tertiary font-medium">Member Type</th>
                    {AGE_BANDS.map((b) => (
                      <th key={b.label} className="text-center px-3 py-1.5 text-th-text-tertiary font-medium">
                        {b.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {Object.entries(MEMBER_TYPE_LABELS).map(([mt, label]) => {
                    const mtRows = rows.filter((r) => r.member_type === mt);
                    if (mtRows.length === 0) return null;
                    return (
                      <tr key={mt}>
                        <td className="px-3 py-1.5 text-th-text-secondary">{label}</td>
                        {AGE_BANDS.map((band) => {
                          const match = mtRows.find(
                            (r) => r.age_min === band.min && r.age_max === band.max
                          );
                          return (
                            <td key={band.label} className="text-center px-3 py-1.5 font-medium text-th-text-primary">
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
          </div>
        ))}
      </div>
    );
  }

  // Flat-rate pricing
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-tertiary">
            <th className="text-left px-3 py-1.5 text-th-text-tertiary font-medium">Member Type</th>
            <th className="text-center px-3 py-1.5 text-th-text-tertiary font-medium">Monthly Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-th-border">
          {pricing.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-1.5 text-th-text-secondary">
                {MEMBER_TYPE_LABELS[row.member_type] || row.member_type}
              </td>
              <td className="text-center px-3 py-1.5 font-semibold text-th-text-primary">
                {formatCurrency(Number(row.monthly_contribution))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products (Plans) List Page
// ---------------------------------------------------------------------------
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function Products() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PlanFilters>({});
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [startingPrices, setStartingPrices] = useState<Record<string, number | null>>({});

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showPricingAnalytics, setShowPricingAnalytics] = useState(false);
  const [showMix, setShowMix] = useState(false);
  const [showRateCalc, setShowRateCalc] = useState(false);
  const [showBundle, setShowBundle] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showCompetitor, setShowCompetitor] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight, color: 'text-green-500', action: () => setShowComparison(true) },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, color: 'text-violet-500', action: () => setShowPricingAnalytics(true) },
    { id: 'mix', label: 'Plan Mix', icon: Layers, color: 'text-amber-500', action: () => setShowMix(true) },
    { id: 'calculator', label: 'Rate Calc', icon: Calculator, color: 'text-pink-500', action: () => setShowRateCalc(true) },
    { id: 'bundle', label: 'Bundle', icon: Package, color: 'text-cyan-500', action: () => setShowBundle(true) },
    { id: 'availability', label: 'Availability', icon: MapPin, color: 'text-emerald-500', action: () => setShowAvailability(true) },
    { id: 'competitor', label: 'Competitor', icon: Swords, color: 'text-red-500', action: () => setShowCompetitor(true) },
    { id: 'recommend', label: 'AI Recommend', icon: Brain, color: 'text-fuchsia-500', action: () => setShowRecommendation(true) },
    { id: 'trends', label: 'Trends', icon: TrendingUp, color: 'text-teal-500', action: () => setShowTrends(true) },
    { id: 'margin', label: 'Margins', icon: PieChart, color: 'text-orange-500', action: () => setShowMargin(true) },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-indigo-500', action: () => setShowFeedback(true) },
  ];

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { plans: data, total: count } = await planService.getPlans(filters, 100, 0);
      setPlans(data);
      setTotal(count);

      // Load starting prices
      const prices: Record<string, number | null> = {};
      await Promise.all(
        data.map(async (plan) => {
          prices[plan.id] = await pricingService.getStartingPrice(plan.id);
        })
      );
      setStartingPrices(prices);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleExport = () => {
    const csv = [
      ['Plan Name', 'Slug', 'Type', 'Active', 'Starting Price', 'Enrollment Fee', 'Annual Fee', 'Tobacco Surcharge', 'Enrollment URL'].join(','),
      ...plans.map((plan) =>
        [
          `"${plan.name}"`,
          plan.slug,
          plan.plan_type,
          plan.is_active ? 'Yes' : 'No',
          startingPrices[plan.id] ?? '',
          plan.enrollment_fee,
          plan.annual_membership_fee,
          plan.tobacco_surcharge_pct,
          plan.enroll_url || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plans-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const isIuaPlan = (planType: string) =>
    ['care_plus', 'direct', 'secure_hsa'].includes(planType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Products</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {total} health plan{total !== 1 ? 's' : ''} — synced with website
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <HelpBanner pageKey="products" title="Welcome to Products" tip="Manage your product catalog with pricing, descriptions, and categories. Products can be added to quotes and deals for accurate revenue tracking." />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search plans..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          <div className="relative">
            <select
              aria-label="Filter by plan type"
              value={filters.plan_type || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, plan_type: e.target.value || undefined }))}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Types</option>
              {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          <div className="relative">
            <select
              aria-label="Filter by status"
              value={filters.is_active === true ? 'active' : filters.is_active === false ? 'inactive' : ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  is_active: val === 'active' ? true : val === 'inactive' ? false : undefined,
                }));
              }}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Status</option>
              <option value="active">Active on Website</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-surface-primary rounded-xl border border-th-border flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>No plans found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          plans.map((plan) => {
            const Icon = getPlanTypeIcon(plan.plan_type);
            const isExpanded = expandedPlan === plan.id;
            const startingPrice = startingPrices[plan.id];

            return (
              <div
                key={plan.id}
                className="bg-surface-primary rounded-xl border border-th-border overflow-hidden"
              >
                {/* Plan Header Row */}
                <div
                  className="flex items-center px-5 py-4 cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                >
                  <button className="mr-3 p-0.5" aria-label={isExpanded ? 'Collapse pricing' : 'Expand pricing'}>
                    <ChevronRight
                      className={`w-4 h-4 text-th-text-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center shrink-0 mr-4">
                    <Icon className="w-5 h-5 text-th-accent-700" />
                  </div>

                  {/* Plan Info */}
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-th-text-primary truncate">{plan.name}</h3>
                      {plan.is_active ? (
                        <span className="shrink-0 flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          <Eye className="w-3 h-3" />
                          <span>Live</span>
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-th-text-tertiary mt-0.5">
                      {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                      {plan.target_audience ? ` — ${plan.target_audience}` : ''}
                    </p>
                  </div>

                  {/* Pricing Quick View */}
                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-th-text-tertiary">Starting at</p>
                      <p className="text-sm font-bold text-th-accent-600">
                        {startingPrice != null ? `${formatCurrency(startingPrice)}/mo` : '-'}
                      </p>
                    </div>

                    {plan.enrollment_fee > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-th-text-tertiary">Enrollment</p>
                        <p className="text-sm font-medium text-th-text-secondary">{formatCurrency(plan.enrollment_fee)}</p>
                      </div>
                    )}

                    {plan.tobacco_surcharge_pct > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-th-text-tertiary">Tobacco</p>
                        <p className="text-sm font-medium text-th-text-secondary">+{formatCurrency(plan.tobacco_surcharge_pct)}/mo</p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      {plan.enroll_url && (
                        <a
                          href={plan.enroll_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-surface-tertiary rounded-lg text-th-text-tertiary hover:text-th-accent-600 transition-colors"
                          title="Enrollment page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Pricing Matrix */}
                {isExpanded && (
                  <div className="border-t border-th-border bg-surface-secondary/30 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-th-text-primary flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-th-accent-600" />
                        <span>Pricing Matrix</span>
                      </h4>
                      <div className="flex items-center space-x-4">
                        {/* Plan badges */}
                        <div className="flex items-center space-x-2">
                          {plan.is_medical_cost_sharing && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Cost Sharing</span>
                          )}
                          {plan.is_mec_compliant && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">MEC</span>
                          )}
                          {plan.is_hsa_compatible && (
                            <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded font-medium">HSA</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <PricingMatrix
                      planId={plan.id}
                      isIuaPlan={isIuaPlan(plan.plan_type)}
                    />

                    {/* Fee Summary */}
                    <div className="mt-4 pt-3 border-t border-th-border flex items-center space-x-6 text-xs text-th-text-tertiary">
                      {plan.enrollment_fee > 0 && (
                        <span>Enrollment fee: <strong className="text-th-text-secondary">{formatCurrency(plan.enrollment_fee)}</strong></span>
                      )}
                      {plan.annual_membership_fee > 0 && (
                        <span>Annual membership: <strong className="text-th-text-secondary">{formatCurrency(plan.annual_membership_fee)}/yr</strong></span>
                      )}
                      {plan.tobacco_surcharge_pct > 0 && (
                        <span>Tobacco surcharge: <strong className="text-th-text-secondary">+{formatCurrency(plan.tobacco_surcharge_pct)}/mo</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ---- Product Power Modals ---- */}
      <ProductAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} planCount={total} />
      <ProductComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
      <PricingAnalyticsModal open={showPricingAnalytics} onClose={() => setShowPricingAnalytics(false)} />
      <ProductMixModal open={showMix} onClose={() => setShowMix(false)} />
      <RateCalculatorModal open={showRateCalc} onClose={() => setShowRateCalc(false)} />
      <ProductBundleModal open={showBundle} onClose={() => setShowBundle(false)} />
      <ProductAvailabilityModal open={showAvailability} onClose={() => setShowAvailability(false)} />
      <CompetitorPricingModal open={showCompetitor} onClose={() => setShowCompetitor(false)} />
      <ProductRecommendationModal open={showRecommendation} onClose={() => setShowRecommendation(false)} />
      <ProductTrendModal open={showTrends} onClose={() => setShowTrends(false)} />
      <ProductMarginModal open={showMargin} onClose={() => setShowMargin(false)} />
      <ProductFeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
