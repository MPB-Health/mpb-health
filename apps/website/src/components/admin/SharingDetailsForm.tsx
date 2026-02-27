import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import type {
  Plan,
  PlanSharingDetails,
  PlanSharingDetailsInput,
  ServiceResult,
} from '../../hooks/useAdminPlans';

interface SharingDetailsFormProps {
  plans: Plan[];
  getSharingDetails: (planId: string) => Promise<PlanSharingDetails | null>;
  upsertSharingDetails: (input: PlanSharingDetailsInput) => Promise<ServiceResult>;
}

export const SharingDetailsForm: React.FC<SharingDetailsFormProps> = ({
  plans,
  getSharingDetails,
  upsertSharingDetails,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const [form, setForm] = useState<PlanSharingDetailsInput>({
    plan_id: '',
    has_lifetime_cap: false,
    has_annual_cap: false,
    preexisting_lookback_months: undefined,
    maternity_waiting_months: undefined,
    has_international_coverage: false,
    iua_options: [],
  });

  // IUA input as comma-separated string for easy editing
  const [iuaInput, setIuaInput] = useState('');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const loadDetails = useCallback(async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    setError(null);
    try {
      const details = await getSharingDetails(selectedPlanId);
      if (details) {
        setForm({
          plan_id: selectedPlanId,
          has_lifetime_cap: details.has_lifetime_cap,
          has_annual_cap: details.has_annual_cap,
          preexisting_lookback_months: details.preexisting_lookback_months ?? undefined,
          maternity_waiting_months: details.maternity_waiting_months ?? undefined,
          has_international_coverage: details.has_international_coverage,
          iua_options: details.iua_options ?? [],
        });
        setIuaInput((details.iua_options ?? []).join(', '));
        setHasData(true);
      } else {
        setForm({
          plan_id: selectedPlanId,
          has_lifetime_cap: false,
          has_annual_cap: false,
          preexisting_lookback_months: undefined,
          maternity_waiting_months: undefined,
          has_international_coverage: false,
          iua_options: [],
        });
        setIuaInput('');
        setHasData(false);
      }
    } catch {
      setError('Failed to load sharing details');
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, getSharingDetails]);

  useEffect(() => {
    if (selectedPlanId) loadDetails();
  }, [selectedPlanId, loadDetails]);

  // Select first plan by default
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const handleSave = async () => {
    if (!selectedPlanId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Parse IUA options
    const iuaOptions = iuaInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0);

    try {
      const result = await upsertSharingDetails({
        ...form,
        plan_id: selectedPlanId,
        iua_options: iuaOptions,
      });

      if (result.success) {
        setSuccessMsg('Sharing details saved');
        setHasData(true);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save sharing details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan selector */}
      <Card className="p-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Select Plan</label>
          <select
            value={selectedPlanId}
            onChange={e => setSelectedPlanId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            title="Select plan"
          >
            <option value="">— Choose a plan —</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {!p.is_active ? '(inactive)' : ''}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-neutral-500">Loading sharing details...</p>
        </Card>
      )}

      {/* Form */}
      {selectedPlanId && !loading && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Sharing Details — {selectedPlan?.name}
              </h3>
              <p className="text-sm text-neutral-500">
                {hasData ? 'Edit existing sharing details' : 'No sharing details yet — fill in and save to create'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Caps */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Sharing Caps
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_annual_cap ?? false}
                    onChange={e => setForm(prev => ({ ...prev, has_annual_cap: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-700">Has Annual Cap</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_lifetime_cap ?? false}
                    onChange={e => setForm(prev => ({ ...prev, has_lifetime_cap: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-700">Has Lifetime Cap</span>
                </label>
              </div>
            </div>

            {/* Waiting periods */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Waiting Periods & Lookbacks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Pre-existing Condition Lookback (months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.preexisting_lookback_months ?? ''}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      preexisting_lookback_months: e.target.value ? parseInt(e.target.value) : undefined,
                    }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 36"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maternity Waiting Period (months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maternity_waiting_months ?? ''}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      maternity_waiting_months: e.target.value ? parseInt(e.target.value) : undefined,
                    }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Coverage Options
              </h4>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={form.has_international_coverage ?? false}
                  onChange={e => setForm(prev => ({ ...prev, has_international_coverage: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700">International Coverage</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  IUA Options (comma-separated amounts)
                </label>
                <input
                  type="text"
                  value={iuaInput}
                  onChange={e => setIuaInput(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 1250, 2500, 5000"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter IUA (Initial Unshareable Amount) options as comma-separated values.
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{hasData ? 'Update Details' : 'Save Details'}</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
