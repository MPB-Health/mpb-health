import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  DollarSign,
  List,
  Shield,
  Eye,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@mpbhealth/database';
import {
  createPlanService,
  createPlanPricingService,
  createPlanFeatureService,
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  AGE_BANDS,
  IUA_OPTIONS,
  PLAN_TYPE_LABELS,
  type PlanWithDetails,
  type PlanCreateInput,
  type PlanPricing,
  type PlanFeature,
} from '@mpbhealth/plans-core';

const planService = createPlanService(supabase);
const pricingService = createPlanPricingService(supabase);
const featureService = createPlanFeatureService(supabase);

type TabId = 'basic' | 'pricing' | 'features' | 'sharing' | 'preview';

const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: 'basic', label: 'Basic Info', icon: Settings },
  { id: 'pricing', label: 'Pricing Matrix', icon: DollarSign },
  { id: 'features', label: 'Features', icon: List },
  { id: 'sharing', label: 'Sharing Details', icon: Shield },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const PLAN_TYPE_OPTIONS = [
  { value: 'essentials', label: 'Essentials' },
  { value: 'mec_essentials', label: 'MEC+ Essentials' },
  { value: 'care_plus', label: 'Care Plus' },
  { value: 'direct', label: 'Direct' },
  { value: 'secure_hsa', label: 'Secure HSA' },
];

export default function PlanEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<PlanWithDetails | null>(null);

  // Form state — Basic Info
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    plan_type: 'essentials',
    target_audience: '',
    is_medical_cost_sharing: false,
    is_mec_compliant: false,
    is_hsa_compatible: false,
    is_active: true,
    sort_order: 0,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    currency: 'USD',
    enroll_url: '',
    code: '',
    cost_basis: 0,
    external_product_id: '',
  });

  // Pricing state
  const [pricingRows, setPricingRows] = useState<PlanPricing[]>([]);
  const [effectiveDate, setEffectiveDate] = useState('2026-01-01');
  const [hasIuaTiers, setHasIuaTiers] = useState(false);

  // Features state
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [newFeature, setNewFeature] = useState({ category: '', feature_name: '', feature_value: '', cost: '', notes: '' });

  // Sharing state
  const [sharingDetails, setSharingDetails] = useState({
    has_lifetime_cap: false,
    has_annual_cap: false,
    preexisting_lookback_months: '',
    maternity_waiting_months: '',
    has_international_coverage: false,
    iua_options: '1250,2500,5000',
  });

  // Load plan data
  useEffect(() => {
    if (isNew) return;

    (async () => {
      setLoading(true);
      const planData = await planService.getPlan(id!);
      if (!planData) {
        toast.error('Plan not found');
        navigate('/plans');
        return;
      }

      setPlan(planData);
      setFormData({
        name: planData.name,
        slug: planData.slug,
        tagline: planData.tagline || '',
        description: planData.description || '',
        plan_type: planData.plan_type,
        target_audience: planData.target_audience || '',
        is_medical_cost_sharing: planData.is_medical_cost_sharing,
        is_mec_compliant: planData.is_mec_compliant,
        is_hsa_compatible: planData.is_hsa_compatible,
        is_active: planData.is_active,
        sort_order: planData.sort_order,
        enrollment_fee: Number(planData.enrollment_fee) || 0,
        annual_membership_fee: Number(planData.annual_membership_fee) || 0,
        tobacco_surcharge_pct: Number(planData.tobacco_surcharge_pct) || 0,
        currency: planData.currency || 'USD',
        enroll_url: planData.enroll_url || '',
        code: planData.code || '',
        cost_basis: Number(planData.cost_basis) || 0,
        external_product_id: planData.external_product_id || '',
      });

      // Set pricing
      const currentPricing = await pricingService.getCurrentPricing(planData.id);
      setPricingRows(currentPricing);
      if (currentPricing.length > 0) {
        setEffectiveDate(currentPricing[0].effective_date);
        setHasIuaTiers(currentPricing.some((r) => r.iua_amount != null));
      }

      // Set features
      setFeatures(planData.features || []);

      // Set sharing details
      if (planData.sharing_details) {
        const sd = planData.sharing_details;
        setSharingDetails({
          has_lifetime_cap: sd.has_lifetime_cap,
          has_annual_cap: sd.has_annual_cap,
          preexisting_lookback_months: sd.preexisting_lookback_months?.toString() || '',
          maternity_waiting_months: sd.maternity_waiting_months?.toString() || '',
          has_international_coverage: sd.has_international_coverage,
          iua_options: sd.iua_options?.join(',') || '',
        });
      }

      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isNew ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
    }));
  };

  // Save plan
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      let planId = plan?.id;

      if (isNew) {
        const result = await planService.createPlan(formData as PlanCreateInput);
        if (!result.success) {
          toast.error(result.error || 'Failed to create plan');
          return;
        }
        planId = result.data!.planId;
        toast.success('Plan created');
      } else {
        const result = await planService.updatePlan(plan!.id, formData);
        if (!result.success) {
          toast.error(result.error || 'Failed to update plan');
          return;
        }
        toast.success('Plan updated');
      }

      // Save sharing details
      if (planId) {
        const iuaArr = sharingDetails.iua_options
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0);

        await featureService.upsertSharingDetails({
          plan_id: planId,
          has_lifetime_cap: sharingDetails.has_lifetime_cap,
          has_annual_cap: sharingDetails.has_annual_cap,
          preexisting_lookback_months: sharingDetails.preexisting_lookback_months
            ? Number(sharingDetails.preexisting_lookback_months)
            : undefined,
          maternity_waiting_months: sharingDetails.maternity_waiting_months
            ? Number(sharingDetails.maternity_waiting_months)
            : undefined,
          has_international_coverage: sharingDetails.has_international_coverage,
          iua_options: iuaArr.length > 0 ? iuaArr : undefined,
        });
      }

      if (isNew && planId) {
        navigate(`/plans/${planId}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  // Pricing helpers
  const getPricingValue = (memberType: string, ageBand: string, iua?: number): number => {
    const [ageMin, ageMax] = ageBand.split('-').map(Number);
    const row = pricingRows.find(
      (r) =>
        r.member_type === memberType &&
        r.age_min === ageMin &&
        r.age_max === ageMax &&
        (iua == null ? r.iua_amount == null : Number(r.iua_amount) === iua)
    );
    return row ? Number(row.monthly_contribution) : 0;
  };

  const setPricingValue = (memberType: string, ageBand: string, iua: number | null, value: number) => {
    const [ageMin, ageMax] = ageBand.split('-').map(Number);
    setPricingRows((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.member_type === memberType &&
          r.age_min === ageMin &&
          r.age_max === ageMax &&
          (iua == null ? r.iua_amount == null : Number(r.iua_amount) === iua)
      );

      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], monthly_contribution: value };
        return updated;
      }

      // Add new row
      return [
        ...prev,
        {
          id: `new-${Date.now()}-${Math.random()}`,
          plan_id: plan?.id || '',
          age_min: ageMin,
          age_max: ageMax,
          member_type: memberType,
          iua_amount: iua,
          monthly_contribution: value,
          effective_date: effectiveDate,
          created_at: new Date().toISOString(),
        },
      ];
    });
  };

  const handleSavePricing = async () => {
    if (!plan?.id) {
      toast.error('Save the plan first before setting pricing');
      return;
    }

    const rows = pricingRows
      .filter((r) => r.monthly_contribution > 0)
      .map((r) => ({
        age_min: r.age_min,
        age_max: r.age_max,
        member_type: r.member_type,
        iua_amount: r.iua_amount,
        monthly_contribution: Number(r.monthly_contribution),
      }));

    const result = await pricingService.replacePricing(plan.id, effectiveDate, rows);
    if (result.success) {
      toast.success('Pricing saved');
      // Reload
      const updated = await pricingService.getCurrentPricing(plan.id);
      setPricingRows(updated);
    } else {
      toast.error(result.error || 'Failed to save pricing');
    }
  };

  // Feature helpers
  const handleAddFeature = async () => {
    if (!plan?.id || !newFeature.category || !newFeature.feature_name) {
      toast.error('Category and feature name are required');
      return;
    }

    const result = await featureService.addFeature({
      plan_id: plan.id,
      category: newFeature.category,
      feature_name: newFeature.feature_name,
      feature_value: newFeature.feature_value || undefined,
      cost: newFeature.cost || undefined,
      notes: newFeature.notes || undefined,
      sort_order: features.length,
    });

    if (result.success) {
      toast.success('Feature added');
      setNewFeature({ category: '', feature_name: '', feature_value: '', cost: '', notes: '' });
      const updated = await featureService.getFeatures(plan.id);
      setFeatures(updated);
    } else {
      toast.error(result.error || 'Failed to add feature');
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    const result = await featureService.deleteFeature(featureId);
    if (result.success) {
      setFeatures((prev) => prev.filter((f) => f.id !== featureId));
      toast.success('Feature removed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/plans')}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            aria-label="Back to plans list"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {isNew ? 'New Plan' : formData.name}
            </h1>
            {!isNew && (
              <p className="text-sm text-th-text-tertiary">/{formData.slug}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {formData.enroll_url && (
            <a
              href={formData.enroll_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Enrollment</span>
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Plan'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-th-border">
        <nav className="flex space-x-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-th-accent-600 text-th-accent-600'
                  : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        {/* ============= BASIC INFO TAB ============= */}
        {activeTab === 'basic' && (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Plan Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  placeholder="Care Plus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Slug *</label>
                <input
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  placeholder="care-plus"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Tagline</label>
              <input
                value={formData.tagline}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                placeholder="Comprehensive coverage for individuals and families"
              />
            </div>

            <div>
              <label htmlFor="plan-description" className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
              <textarea
                id="plan-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="plan-type" className="block text-sm font-medium text-th-text-secondary mb-1">Plan Type</label>
                <select
                  id="plan-type"
                  value={formData.plan_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, plan_type: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                >
                  {PLAN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Target Audience</label>
                <input
                  value={formData.target_audience}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  placeholder="Individuals and families"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="enrollment-fee" className="block text-sm font-medium text-th-text-secondary mb-1">Enrollment Fee ($)</label>
                <input
                  id="enrollment-fee"
                  type="number"
                  value={formData.enrollment_fee}
                  onChange={(e) => setFormData((prev) => ({ ...prev, enrollment_fee: Number(e.target.value) }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label htmlFor="annual-fee" className="block text-sm font-medium text-th-text-secondary mb-1">Annual Membership Fee ($)</label>
                <input
                  id="annual-fee"
                  type="number"
                  value={formData.annual_membership_fee}
                  onChange={(e) => setFormData((prev) => ({ ...prev, annual_membership_fee: Number(e.target.value) }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label htmlFor="tobacco-surcharge" className="block text-sm font-medium text-th-text-secondary mb-1">Tobacco Surcharge ($/mo)</label>
                <input
                  id="tobacco-surcharge"
                  type="number"
                  value={formData.tobacco_surcharge_pct}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tobacco_surcharge_pct: Number(e.target.value) }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="enroll-url" className="block text-sm font-medium text-th-text-secondary mb-1">Enrollment URL</label>
                <input
                  id="enroll-url"
                  value={formData.enroll_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, enroll_url: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  placeholder="https://plan.enrollmpb.com/"
                />
              </div>
              <div>
                <label htmlFor="sort-order" className="block text-sm font-medium text-th-text-secondary mb-1">Sort Order</label>
                <input
                  id="sort-order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-code" className="block text-sm font-medium text-th-text-secondary mb-1">Product Code</label>
                <input
                  id="product-code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label htmlFor="external-product-id" className="block text-sm font-medium text-th-text-secondary mb-1">External Product ID</label>
                <input
                  id="external-product-id"
                  value={formData.external_product_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, external_product_id: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-th-text-primary">Plan Flags</h3>
              {[
                { key: 'is_active', label: 'Active (visible on website)' },
                { key: 'is_medical_cost_sharing', label: 'Medical Cost Sharing' },
                { key: 'is_mec_compliant', label: 'MEC Compliant' },
                { key: 'is_hsa_compatible', label: 'HSA Compatible' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as Record<string, unknown>)[key] as boolean}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ============= PRICING TAB ============= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {!plan?.id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                Save the plan first before configuring pricing.
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="effective-date" className="block text-xs font-medium text-th-text-tertiary mb-1">Effective Date</label>
                  <input
                    id="effective-date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="border border-th-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={hasIuaTiers}
                    onChange={(e) => setHasIuaTiers(e.target.checked)}
                    className="w-4 h-4 rounded border-th-border"
                    aria-label="Plan has IUA tiers"
                  />
                  <span className="text-sm text-th-text-secondary">Has IUA tiers</span>
                </label>
              </div>
              <button
                onClick={handleSavePricing}
                disabled={!plan?.id}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Pricing</span>
              </button>
            </div>

            {/* Pricing Matrix */}
            {hasIuaTiers ? (
              // IUA-based pricing (3 tiers x member types x age bands)
              <div className="space-y-8">
                {IUA_OPTIONS.map((iua) => (
                  <div key={iua}>
                    <h3 className="text-sm font-semibold text-th-text-primary mb-3">
                      ${iua.toLocaleString()} IUA
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-secondary">
                            <th className="text-left px-4 py-2 text-xs font-medium text-th-text-tertiary">Member Type</th>
                            {AGE_BANDS.map((band) => (
                              <th key={band.label} className="text-center px-4 py-2 text-xs font-medium text-th-text-tertiary">
                                Age {band.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-th-border">
                          {MEMBER_TYPES.map((mt) => (
                            <tr key={mt}>
                              <td className="px-4 py-2 text-th-text-secondary font-medium">
                                {MEMBER_TYPE_LABELS[mt]}
                              </td>
                              {AGE_BANDS.map((band) => (
                                <td key={band.label} className="px-4 py-2">
                                  <div className="flex items-center">
                                    <span className="text-th-text-tertiary mr-1">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      aria-label={`Rate for ${MEMBER_TYPE_LABELS[mt]} age ${band.label} at $${iua} IUA`}
                                      value={getPricingValue(mt, band.label, iua) || ''}
                                      onChange={(e) => setPricingValue(mt, band.label, iua, Number(e.target.value))}
                                      className="w-24 border border-th-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Flat-rate pricing (member types only, single age band)
              <div>
                <h3 className="text-sm font-semibold text-th-text-primary mb-3">Flat Rate Pricing</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-secondary">
                        <th className="text-left px-4 py-2 text-xs font-medium text-th-text-tertiary">Member Type</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-th-text-tertiary">Monthly Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                      {MEMBER_TYPES.map((mt) => (
                        <tr key={mt}>
                          <td className="px-4 py-2 text-th-text-secondary font-medium">
                            {MEMBER_TYPE_LABELS[mt]}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center">
                              <span className="text-th-text-tertiary mr-1">$</span>
                              <input
                                type="number"
                                step="0.01"
                                aria-label={`Monthly rate for ${MEMBER_TYPE_LABELS[mt]}`}
                                value={getPricingValue(mt, '18-64', undefined) || ''}
                                onChange={(e) => setPricingValue(mt, '18-64', null, Number(e.target.value))}
                                className="w-32 border border-th-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============= FEATURES TAB ============= */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {!plan?.id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                Save the plan first before adding features.
              </div>
            )}

            {/* Add feature form */}
            <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-th-text-primary">Add Feature</h3>
              <div className="grid grid-cols-5 gap-3">
                <input
                  value={newFeature.category}
                  onChange={(e) => setNewFeature((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Category"
                  className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <input
                  value={newFeature.feature_name}
                  onChange={(e) => setNewFeature((prev) => ({ ...prev, feature_name: e.target.value }))}
                  placeholder="Feature name"
                  className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <input
                  value={newFeature.feature_value}
                  onChange={(e) => setNewFeature((prev) => ({ ...prev, feature_value: e.target.value }))}
                  placeholder="Value (optional)"
                  className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <input
                  value={newFeature.cost}
                  onChange={(e) => setNewFeature((prev) => ({ ...prev, cost: e.target.value }))}
                  placeholder="Cost (e.g. $0)"
                  className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <button
                  onClick={handleAddFeature}
                  disabled={!plan?.id}
                  className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Features list */}
            {features.length === 0 ? (
              <p className="text-sm text-th-text-tertiary text-center py-8">No features yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  features.reduce((acc, f) => {
                    if (!acc[f.category]) acc[f.category] = [];
                    acc[f.category].push(f);
                    return acc;
                  }, {} as Record<string, PlanFeature[]>)
                ).map(([category, catFeatures]) => (
                  <div key={category} className="border border-th-border rounded-lg overflow-hidden">
                    <div className="bg-surface-secondary px-4 py-2">
                      <h4 className="text-xs font-semibold text-th-text-tertiary uppercase">{category}</h4>
                    </div>
                    <div className="divide-y divide-th-border">
                      {catFeatures.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex-1">
                            <span className="text-sm text-th-text-primary">{feature.feature_name}</span>
                            {feature.feature_value && (
                              <span className="text-sm text-th-text-tertiary ml-2">— {feature.feature_value}</span>
                            )}
                            {feature.cost && (
                              <span className="ml-2 text-xs bg-surface-tertiary rounded px-2 py-0.5 text-th-text-tertiary">
                                {feature.cost}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteFeature(feature.id)}
                            className="p-1 text-th-text-tertiary hover:text-red-500 transition-colors"
                            aria-label={`Delete feature ${feature.feature_name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============= SHARING DETAILS TAB ============= */}
        {activeTab === 'sharing' && (
          <div className="space-y-6 max-w-xl">
            <div className="space-y-3">
              {[
                { key: 'has_lifetime_cap', label: 'Has Lifetime Cap' },
                { key: 'has_annual_cap', label: 'Has Annual Cap' },
                { key: 'has_international_coverage', label: 'International Coverage' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(sharingDetails as Record<string, unknown>)[key] as boolean}
                    onChange={(e) => setSharingDetails((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-th-border"
                  />
                  <span className="text-sm text-th-text-secondary">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="preexisting-lookback" className="block text-sm font-medium text-th-text-secondary mb-1">Pre-existing Lookback (months)</label>
                <input
                  id="preexisting-lookback"
                  type="number"
                  value={sharingDetails.preexisting_lookback_months}
                  onChange={(e) => setSharingDetails((prev) => ({ ...prev, preexisting_lookback_months: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label htmlFor="maternity-waiting" className="block text-sm font-medium text-th-text-secondary mb-1">Maternity Waiting (months)</label>
                <input
                  id="maternity-waiting"
                  type="number"
                  value={sharingDetails.maternity_waiting_months}
                  onChange={(e) => setSharingDetails((prev) => ({ ...prev, maternity_waiting_months: e.target.value }))}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="iua-options" className="block text-sm font-medium text-th-text-secondary mb-1">IUA Options (comma-separated)</label>
              <input
                id="iua-options"
                value={sharingDetails.iua_options}
                onChange={(e) => setSharingDetails((prev) => ({ ...prev, iua_options: e.target.value }))}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                placeholder="1250,2500,5000"
              />
            </div>
          </div>
        )}

        {/* ============= PREVIEW TAB ============= */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <p className="text-sm text-th-text-tertiary mb-4">Preview how this plan will appear on the website.</p>

            {/* Simulated plan card */}
            <div className="max-w-sm bg-surface-primary rounded-2xl border border-th-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-th-text-primary">{formData.name || 'Plan Name'}</h3>
                {formData.tagline && (
                  <p className="text-sm text-th-text-tertiary mt-1">{formData.tagline}</p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-bold text-th-accent-600">
                    {pricingRows.length > 0
                      ? `$${Math.min(...pricingRows.filter((r) => r.monthly_contribution > 0).map((r) => Number(r.monthly_contribution)))}`
                      : '$0'}
                  </span>
                  <span className="text-th-text-tertiary text-sm">/month</span>
                </div>
                <p className="text-xs text-th-text-tertiary mt-1">Starting at</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {formData.is_medical_cost_sharing && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Cost Sharing</span>
                )}
                {formData.is_mec_compliant && (
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">MEC Compliant</span>
                )}
                {formData.is_hsa_compatible && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">HSA Compatible</span>
                )}
              </div>

              {formData.enrollment_fee > 0 && (
                <p className="text-xs text-th-text-tertiary mb-2">${formData.enrollment_fee} enrollment fee</p>
              )}

              <button className="w-full py-2.5 bg-th-accent-600 text-white rounded-lg text-sm font-medium">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
