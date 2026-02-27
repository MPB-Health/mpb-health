import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import {
  PLAN_TYPES,
  PLAN_TYPE_LABELS,
} from '@mpbhealth/plans-core';
import type {
  Plan,
  PlanCreateInput,
  PlanUpdateInput,
  ServiceResult,
} from '../../hooks/useAdminPlans';

interface PlanFormProps {
  plan?: Plan | null;
  onSave: (input: PlanCreateInput | PlanUpdateInput, id?: string) => Promise<ServiceResult<any>>;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const PlanForm: React.FC<PlanFormProps> = ({ plan, onSave, onClose }) => {
  const isEditing = !!plan;

  const [form, setForm] = useState<PlanCreateInput>({
    slug: plan?.slug ?? '',
    name: plan?.name ?? '',
    tagline: plan?.tagline ?? '',
    description: plan?.description ?? '',
    plan_type: plan?.plan_type ?? PLAN_TYPES[0],
    is_medical_cost_sharing: plan?.is_medical_cost_sharing ?? false,
    is_mec_compliant: plan?.is_mec_compliant ?? false,
    is_hsa_compatible: plan?.is_hsa_compatible ?? false,
    target_audience: plan?.target_audience ?? '',
    sort_order: plan?.sort_order ?? 0,
    is_active: plan?.is_active ?? true,
    code: plan?.code ?? '',
    enrollment_fee: plan?.enrollment_fee ?? 0,
    annual_membership_fee: plan?.annual_membership_fee ?? 0,
    tobacco_surcharge_pct: plan?.tobacco_surcharge_pct ?? 0,
    currency: plan?.currency ?? 'USD',
    enroll_url: plan?.enroll_url ?? '',
    cost_basis: plan?.cost_basis ?? undefined,
    external_product_id: plan?.external_product_id ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (autoSlug && !isEditing) {
      setForm(prev => ({ ...prev, slug: slugify(prev.name ?? '') }));
    }
  }, [form.name, autoSlug, isEditing]);

  const handleChange = (field: keyof PlanCreateInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name?.trim()) {
      setErrorMsg('Plan name is required');
      return;
    }
    if (!form.slug?.trim()) {
      setErrorMsg('Slug is required');
      return;
    }
    if (!form.plan_type) {
      setErrorMsg('Plan type is required');
      return;
    }

    setSaving(true);
    try {
      const result = isEditing
        ? await onSave(form as PlanUpdateInput, plan!.id)
        : await onSave(form, undefined);

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to save plan');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 overflow-y-auto">
      <Card className="w-full max-w-2xl mx-4 mb-8 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg" title="Close">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Care Plus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Slug *
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className="ml-2 text-xs text-blue-600 hover:underline"
                    >
                      {autoSlug ? 'Manual' : 'Auto'}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => {
                    setAutoSlug(false);
                    handleChange('slug', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="care-plus"
                  readOnly={autoSlug && !isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline ?? ''}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Short marketing tagline"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea
                value={form.description ?? ''}
                onChange={e => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                placeholder="Detailed plan description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Type *</label>
                <select
                  value={form.plan_type}
                  onChange={e => handleChange('plan_type', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Plan type"
                >
                  {PLAN_TYPES.map(pt => (
                    <option key={pt} value={pt}>{PLAN_TYPE_LABELS[pt] || pt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={form.target_audience ?? ''}
                  onChange={e => handleChange('target_audience', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Individuals, Families"
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Plan Characteristics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: 'is_medical_cost_sharing', label: 'Medical Cost Sharing' },
                { key: 'is_mec_compliant', label: 'MEC Compliant' },
                { key: 'is_hsa_compatible', label: 'HSA Compatible' },
                { key: 'is_active', label: 'Active (visible on site)' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(form as any)[key]}
                    onChange={e => handleChange(key as keyof PlanCreateInput, e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing & Fees */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Fees & Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Enrollment Fee ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.enrollment_fee ?? 0}
                  onChange={e => handleChange('enrollment_fee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Enrollment fee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Annual Membership Fee ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.annual_membership_fee ?? 0}
                  onChange={e => handleChange('annual_membership_fee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Annual membership fee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tobacco Surcharge (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.tobacco_surcharge_pct ?? 0}
                  onChange={e => handleChange('tobacco_surcharge_pct', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Tobacco surcharge percentage"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Enrollment URL</label>
                <input
                  type="url"
                  value={form.enroll_url ?? ''}
                  onChange={e => handleChange('enroll_url', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">External Product ID</label>
                <input
                  type="text"
                  value={form.external_product_id ?? ''}
                  onChange={e => handleChange('external_product_id', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="External system ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Code</label>
                <input
                  type="text"
                  value={form.code ?? ''}
                  onChange={e => handleChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Internal code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order ?? 0}
                  onChange={e => handleChange('sort_order', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Sort order"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Cost Basis</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.cost_basis ?? ''}
                  onChange={e => handleChange('cost_basis', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Plan' : 'Create Plan'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
