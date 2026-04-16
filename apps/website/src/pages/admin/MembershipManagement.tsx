import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Shield,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  List,
  Share2,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminPlans } from '../../hooks/useAdminPlans';
import type { Plan, PlanCreateInput, PlanUpdateInput } from '../../hooks/useAdminPlans';

// Sub-components
import { PlanForm } from '../../components/admin/PlanForm';
import { PlanDetail } from '../../components/admin/PlanDetail';
import { PricingManager } from '../../components/admin/PricingManager';
import { FeaturesManager } from '../../components/admin/FeaturesManager';
import { SharingDetailsForm } from '../../components/admin/SharingDetailsForm';

type ActiveTab = 'plans' | 'pricing' | 'features' | 'sharing';

const MembershipManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();

  const admin = useAdminPlans();
  const {
    plans,
    loading,
    error,
    stats,
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    toggleActive,
    getPlanDetails,
    PLAN_TYPE_LABELS,
  } = admin;

  const [activeTab, setActiveTab] = useState<ActiveTab>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal / overlay state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Toast-style messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // -----------------------------------------------------------------------
  // Auth gate
  // -----------------------------------------------------------------------
  if (authLoading) {
    return (
      <AdminLayout activeView="coverage" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <AdminLayout activeView="coverage" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600 max-w-md">
            You need admin privileges to manage membership plans. Contact a super admin if you
            believe this is an error.
          </p>
        </div>
      </AdminLayout>
    );
  }

  // -----------------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------------
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !searchQuery ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.tagline ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || plan.plan_type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? plan.is_active : !plan.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    const plan = plans.find((p) => p.id === deletingPlanId);
    const result = await deletePlan(deletingPlanId);
    if (result.success) {
      showMessage('success', `Plan "${plan?.name}" deleted`);
    } else {
      showMessage('error', result.error ?? 'Failed to delete plan');
    }
    setDeletingPlanId(null);
  };

  const handleToggleActive = async (id: string) => {
    const plan = plans.find((p) => p.id === id);
    const result = await toggleActive(id);
    if (result.success) {
      showMessage('success', `Plan "${plan?.name}" ${plan?.is_active ? 'deactivated' : 'activated'}`);
    } else {
      showMessage('error', result.error ?? 'Failed to toggle plan status');
    }
  };

  // Unique plan types for filter dropdown
  const allPlanTypes = [...new Set(plans.map((p) => p.plan_type))];

  // -----------------------------------------------------------------------
  // Render — Plans tab
  // -----------------------------------------------------------------------
  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search plans by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-neutral-600" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by plan type"
            >
              <option value="all">All Types</option>
              {allPlanTypes.map((t) => (
                <option key={t} value={t}>
                  {PLAN_TYPE_LABELS[t] || t}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              onClick={() => {
                setEditingPlan(null);
                setShowPlanForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No plans found</h3>
          <p className="text-neutral-600">
            {plans.length === 0
              ? 'Create your first plan to get started'
              : 'No plans match your filters'}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 hover:shadow-lg transition-shadow relative ${
                !plan.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        plan.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {plan.tagline && (
                <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{plan.tagline}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 mb-4">
                <div>
                  <span className="block text-neutral-400">Enrollment</span>
                  <span className="font-medium text-neutral-700">
                    ${plan.enrollment_fee}
                  </span>
                </div>
                <div>
                  <span className="block text-neutral-400">Annual Membership</span>
                  <span className="font-medium text-neutral-700">
                    ${plan.annual_membership_fee}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <button
                  onClick={() => handleToggleActive(plan.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    plan.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                  title={plan.is_active ? 'Click to deactivate' : 'Click to activate'}
                >
                  {plan.is_active ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingPlanId(plan.id)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanForm(true);
                    }}
                    title="Edit plan"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingPlanId(plan.id)}
                    title="Delete plan"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Tab definitions
  // -----------------------------------------------------------------------
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plans', label: 'Plans', icon: <Shield className="h-5 w-5" /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'features', label: 'Features', icon: <List className="h-5 w-5" /> },
    { id: 'sharing', label: 'Sharing Details', icon: <Share2 className="h-5 w-5" /> },
  ];

  return (
    <AdminLayout activeView="coverage" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Membership Management - Admin - MPB Health</title>
        <meta name="description" content="Manage membership plans, pricing, features and sharing details" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Membership Management" />

        {/* Toast message */}
        {message && (
          <div
            className={`fixed top-4 right-4 z-[60] px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
              message.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Membership Management</h1>
              <p className="mt-2 text-neutral-600">
                Manage plans, pricing, features and sharing details. Changes are reflected on the
                visitor-facing website.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPlans()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Total Plans</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.totalPlans}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Active Plans</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.activePlans}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-purple-50 border-l-4 border-purple-600">
            <div className="flex items-center gap-3">
              <List className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Plan Types</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.planTypes}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-amber-50 border-l-4 border-amber-600">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Inactive Plans</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.inactivePlans}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
            <Button variant="outline" size="sm" onClick={() => loadPlans()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 border-b-2 transition-colors inline-flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'plans' && renderPlansTab()}
            {activeTab === 'pricing' && (
              <PricingManager
                plans={plans}
                getPlanPricing={admin.getPlanPricing}
                getEffectiveDates={admin.getEffectiveDates}
                addPricingRows={admin.addPricingRows}
                updatePricingRow={admin.updatePricingRow}
                deletePricingRow={admin.deletePricingRow}
                replacePricing={admin.replacePricing}
              />
            )}
            {activeTab === 'features' && (
              <FeaturesManager
                plans={plans}
                getFeatures={admin.getFeatures}
                getCategories={admin.getCategories}
                addFeature={admin.addFeature}
                updateFeature={admin.updateFeature}
                deleteFeature={admin.deleteFeature}
              />
            )}
            {activeTab === 'sharing' && (
              <SharingDetailsForm
                plans={plans}
                getSharingDetails={admin.getSharingDetails}
                upsertSharingDetails={admin.upsertSharingDetails}
              />
            )}
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Modals / Overlays                                                  */}
      {/* ----------------------------------------------------------------- */}

      {/* Create / Edit Plan */}
      {showPlanForm && (
        <PlanForm
          plan={editingPlan}
          onSave={async (data, id) => {
            if (editingPlan && id) {
              const result = await updatePlan(id, data as unknown as PlanUpdateInput);
              if (result.success) {
                showMessage('success', `Plan "${editingPlan.name}" updated`);
                setEditingPlan(null);
              } else {
                showMessage('error', result.error ?? 'Failed to update plan');
              }
              return result;
            } else {
              const result = await createPlan(data as unknown as PlanCreateInput);
              if (result.success) {
                showMessage('success', `Plan "${(data as unknown as PlanCreateInput).name}" created`);
              } else {
                showMessage('error', result.error ?? 'Failed to create plan');
              }
              return result;
            }
          }}
          onClose={() => {
            setShowPlanForm(false);
            setEditingPlan(null);
          }}
        />
      )}

      {/* View Plan Detail */}
      {viewingPlanId && (
        <PlanDetail
          planId={viewingPlanId}
          getPlanDetails={getPlanDetails}
          onClose={() => setViewingPlanId(null)}
          onEditPlan={() => {
            const p = plans.find((pl) => pl.id === viewingPlanId);
            if (p) {
              setViewingPlanId(null);
              setEditingPlan(p);
              setShowPlanForm(true);
            }
          }}
          onEditPricing={() => {
            setViewingPlanId(null);
            setActiveTab('pricing');
          }}
          onEditFeatures={() => {
            setViewingPlanId(null);
            setActiveTab('features');
          }}
          onEditSharing={() => {
            setViewingPlanId(null);
            setActiveTab('sharing');
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPlanId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="p-6 bg-white max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Delete Plan</h3>
            </div>
            <p className="text-neutral-600 mb-2">
              Are you sure you want to delete{' '}
              <strong>{plans.find((p) => p.id === deletingPlanId)?.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This will also delete all associated pricing, features, and sharing details. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingPlanId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePlan}>
                Delete Plan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default MembershipManagement;

