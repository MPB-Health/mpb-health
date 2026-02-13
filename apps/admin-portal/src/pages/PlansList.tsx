import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronDown,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Copy,
  ExternalLink,
  DollarSign,
  Shield,
  Heart,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@mpbhealth/database';
import {
  createPlanService,
  createPlanPricingService,
  PLAN_TYPE_LABELS,
  type Plan,
  type PlanFilters,
} from '@mpbhealth/plans-core';

const planService = createPlanService(supabase);
const pricingService = createPlanPricingService(supabase);

function getPlanTypeIcon(planType: string) {
  switch (planType) {
    case 'care_plus':
    case 'direct':
      return Heart;
    case 'secure_hsa':
      return Shield;
    case 'mec_essentials':
      return Shield;
    default:
      return Package;
  }
}

function getStatusBadge(isActive: boolean) {
  return isActive
    ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' }
    : { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactive' };
}

export default function PlansList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PlanFilters>({});
  const [startingPrices, setStartingPrices] = useState<Record<string, number | null>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { plans: data, total: count } = await planService.getPlans(filters, 100, 0);
      setPlans(data);
      setTotal(count);

      // Load starting prices for all plans
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

  const handleToggleActive = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await planService.toggleActive(plan.id);
    if (result.success) {
      toast.success(plan.is_active ? 'Plan deactivated — hidden from website' : 'Plan activated — visible on website');
      loadPlans();
    } else {
      toast.error(result.error || 'Failed to toggle plan');
    }
  };

  const handleDelete = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;

    setDeletingId(plan.id);
    const result = await planService.deletePlan(plan.id);
    setDeletingId(null);

    if (result.success) {
      toast.success('Plan deleted');
      loadPlans();
    } else {
      toast.error(result.error || 'Failed to delete plan');
    }
  };

  const handleDuplicate = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await planService.createPlan({
      slug: `${plan.slug}-copy-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      tagline: plan.tagline || undefined,
      description: plan.description || undefined,
      plan_type: plan.plan_type,
      is_medical_cost_sharing: plan.is_medical_cost_sharing,
      is_mec_compliant: plan.is_mec_compliant,
      is_hsa_compatible: plan.is_hsa_compatible,
      target_audience: plan.target_audience || undefined,
      sort_order: plan.sort_order + 1,
      is_active: false,
      enrollment_fee: plan.enrollment_fee,
      annual_membership_fee: plan.annual_membership_fee,
      tobacco_surcharge_pct: plan.tobacco_surcharge_pct,
      currency: plan.currency,
      enroll_url: plan.enroll_url || undefined,
    });

    if (result.success) {
      toast.success('Plan duplicated (inactive draft)');
      loadPlans();
    } else {
      toast.error(result.error || 'Failed to duplicate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Plan Management</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {total} plan{total !== 1 ? 's' : ''} — changes here are reflected on the website immediately
          </p>
        </div>
        <button
          onClick={() => navigate('/plans/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search plans by name, slug, or description..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>No plans found</p>
            <p className="text-sm mt-1">Create a new plan to get started</p>
          </div>
        ) : (
          plans.map((plan) => {
            const Icon = getPlanTypeIcon(plan.plan_type);
            const status = getStatusBadge(plan.is_active);
            const startingPrice = startingPrices[plan.id];

            return (
              <div
                key={plan.id}
                onClick={() => navigate(`/plans/${plan.id}`)}
                className="bg-surface-primary rounded-xl border border-th-border p-5 hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Top row: icon, name, status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-th-accent-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-th-text-tertiary">{plan.slug}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                {/* Tagline */}
                {plan.tagline && (
                  <p className="text-xs text-th-text-tertiary mb-3 line-clamp-2">{plan.tagline}</p>
                )}

                {/* Pricing info */}
                <div className="flex items-center space-x-4 mb-4 text-xs">
                  <div className="flex items-center space-x-1 text-th-text-secondary">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      {startingPrice != null ? `From $${startingPrice}/mo` : 'No pricing set'}
                    </span>
                  </div>
                  {plan.enrollment_fee > 0 && (
                    <span className="text-th-text-tertiary">
                      ${plan.enrollment_fee} enrollment
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 bg-surface-tertiary rounded text-[10px] font-medium text-th-text-tertiary uppercase">
                    {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                  </span>
                  {plan.is_medical_cost_sharing && (
                    <span className="px-2 py-0.5 bg-blue-50 rounded text-[10px] font-medium text-blue-600">
                      Cost Sharing
                    </span>
                  )}
                  {plan.is_mec_compliant && (
                    <span className="px-2 py-0.5 bg-purple-50 rounded text-[10px] font-medium text-purple-600">
                      MEC
                    </span>
                  )}
                  {plan.is_hsa_compatible && (
                    <span className="px-2 py-0.5 bg-emerald-50 rounded text-[10px] font-medium text-emerald-600">
                      HSA
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 border-t border-th-border pt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/plans/${plan.id}`); }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleToggleActive(plan, e)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                    title={plan.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {plan.is_active ? (
                      <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    )}
                    <span>{plan.is_active ? 'Hide' : 'Show'}</span>
                  </button>
                  <button
                    onClick={(e) => handleDuplicate(plan, e)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Dup</span>
                  </button>
                  {plan.enroll_url && (
                    <a
                      href={plan.enroll_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                      aria-label="Open enrollment page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={(e) => handleDelete(plan, e)}
                    disabled={deletingId === plan.id}
                    className="flex items-center px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
