import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Plus, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import {
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  IUA_OPTIONS,
  AGE_BANDS,
} from '@mpbhealth/plans-core';
import type {
  Plan,
  PlanPricing,
  PlanPricingCreateInput,
  ServiceResult,
} from '../../hooks/useAdminPlans';

interface PricingManagerProps {
  plans: Plan[];
  getPlanPricing: (planId: string, effectiveDate?: string) => Promise<PlanPricing[]>;
  getEffectiveDates: (planId: string) => Promise<string[]>;
  addPricingRows: (rows: PlanPricingCreateInput[]) => Promise<ServiceResult>;
  updatePricingRow: (id: string, monthlyContribution: number) => Promise<ServiceResult>;
  deletePricingRow: (id: string) => Promise<ServiceResult>;
  replacePricing: (
    planId: string,
    effectiveDate: string,
    rows: Omit<PlanPricingCreateInput, 'plan_id' | 'effective_date'>[]
  ) => Promise<ServiceResult>;
}

// Plans with IUA-based pricing
const IUA_PLAN_TYPES = ['care_plus', 'direct', 'secure_hsa'];

export const PricingManager: React.FC<PricingManagerProps> = ({
  plans,
  getPlanPricing,
  getEffectiveDates,
  addPricingRows,
  updatePricingRow,
  deletePricingRow,
  replacePricing,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [pricing, setPricing] = useState<PlanPricing[]>([]);
  const [effectiveDates, setEffectiveDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable pricing matrix: map of `${memberType}-${ageMin}-${iuaAmount}` => value
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // New effective date for creating a new pricing version
  const [newDate, setNewDate] = useState('');
  const [showNewDateForm, setShowNewDateForm] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isIuaBased = selectedPlan ? IUA_PLAN_TYPES.includes(selectedPlan.plan_type) : false;

  // Load pricing when plan or date changes
  const loadPricing = useCallback(async (dateOverride?: string) => {
    if (!selectedPlanId) return;
    setLoading(true);
    setError(null);
    try {
      const dates = await getEffectiveDates(selectedPlanId);
      setEffectiveDates(dates);

      const dateToUse = dateOverride ?? (selectedDate || dates[0] || '');
      if (dateToUse && dateToUse !== selectedDate) setSelectedDate(dateToUse);

      const rows = dateToUse
        ? await getPlanPricing(selectedPlanId, dateToUse)
        : await getPlanPricing(selectedPlanId);
      setPricing(rows);

      // Build edit map from existing prices
      const map: Record<string, number> = {};
      rows.forEach(row => {
        const key = `${row.member_type}-${row.age_min}-${row.iua_amount ?? 'flat'}`;
        map[key] = row.monthly_contribution;
      });
      setEditedPrices(map);
      setHasChanges(false);
    } catch {
      setError('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, selectedDate, getPlanPricing, getEffectiveDates]);

  useEffect(() => {
    if (selectedPlanId) loadPricing();
  // Only re-fetch when plan or date changes — loadPricing is excluded
  // to avoid the double-fetch loop when it sets selectedDate internally.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId, selectedDate]);

  // Select first plan by default
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const priceKey = (memberType: string, ageMin: number, iuaAmount: number | null) =>
    `${memberType}-${ageMin}-${iuaAmount ?? 'flat'}`;

  const handlePriceChange = (memberType: string, ageMin: number, iuaAmount: number | null, value: string) => {
    const key = priceKey(memberType, ageMin, iuaAmount);
    setEditedPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    setHasChanges(true);
  };

  const findExistingRow = (memberType: string, ageMin: number, iuaAmount: number | null): PlanPricing | undefined => {
    return pricing.find(r =>
      r.member_type === memberType &&
      r.age_min === ageMin &&
      (r.iua_amount ?? null) === iuaAmount
    );
  };

  const handleSaveAll = async () => {
    if (!selectedPlanId || !selectedDate) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Build full set of rows from the matrix
      const rows: Omit<PlanPricingCreateInput, 'plan_id' | 'effective_date'>[] = [];

      for (const memberType of MEMBER_TYPES) {
        for (const band of AGE_BANDS) {
          if (isIuaBased) {
            for (const iua of IUA_OPTIONS) {
              const key = priceKey(memberType, band.min, iua);
              const val = editedPrices[key];
              if (val !== undefined && val >= 0) {
                rows.push({
                  age_min: band.min,
                  age_max: band.max,
                  member_type: memberType,
                  iua_amount: iua,
                  monthly_contribution: val,
                });
              }
            }
          } else {
            const key = priceKey(memberType, band.min, null);
            const val = editedPrices[key];
            if (val !== undefined && val >= 0) {
              rows.push({
                age_min: band.min,
                age_max: band.max,
                member_type: memberType,
                iua_amount: null,
                monthly_contribution: val,
              });
            }
          }
        }
      }

      const result = await replacePricing(selectedPlanId, selectedDate, rows);
      if (result.success) {
        setSuccessMsg('Pricing saved successfully');
        setHasChanges(false);
        await loadPricing();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error || 'Failed to save pricing');
      }
    } catch {
      setError('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewDate = async () => {
    if (!selectedPlanId || !newDate) return;
    setSaving(true);
    setError(null);

    try {
      // If there's existing pricing, copy it to the new date
      const existingRows: Omit<PlanPricingCreateInput, 'plan_id' | 'effective_date'>[] = pricing.map(r => ({
        age_min: r.age_min,
        age_max: r.age_max,
        member_type: r.member_type,
        iua_amount: r.iua_amount,
        monthly_contribution: r.monthly_contribution,
      }));

      if (existingRows.length > 0) {
        const fullRows: PlanPricingCreateInput[] = existingRows.map(r => ({
          ...r,
          plan_id: selectedPlanId,
          effective_date: newDate,
        }));
        await addPricingRows(fullRows);
      }

      setShowNewDateForm(false);
      setNewDate('');
      setSuccessMsg('New pricing version created');
      setSelectedDate(newDate);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to create new pricing version');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      {/* Plan & Date selectors */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Select Plan</label>
            <select
              value={selectedPlanId}
              onChange={e => { setSelectedPlanId(e.target.value); setSelectedDate(''); }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

          {selectedPlanId && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Effective Date</label>
              <div className="flex gap-2">
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Effective date"
                >
                  {effectiveDates.length === 0 && <option value="">No pricing data</option>}
                  {effectiveDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewDateForm(!showNewDateForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Version
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* New date form */}
        {showNewDateForm && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Create new pricing version:</span>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                title="New effective date"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!newDate || saving}
                onClick={handleCreateNewDate}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowNewDateForm(false); setNewDate(''); }}
              >
                Cancel
              </Button>
            </div>
            {pricing.length > 0 && (
              <p className="mt-2 text-xs text-blue-600">
                Current pricing will be copied to the new effective date. You can then edit the rates.
              </p>
            )}
          </div>
        )}
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

      {/* Pricing Matrix */}
      {selectedPlanId && !loading && selectedDate && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Pricing Matrix — {selectedPlan?.name}
              </h3>
              <p className="text-sm text-neutral-500">
                Effective: {selectedDate} | {isIuaBased ? 'IUA-based pricing' : 'Flat-rate pricing'}
              </p>
            </div>
            {hasChanges && (
              <Button
                type="button"
                variant="primary"
                disabled={saving}
                onClick={handleSaveAll}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save All Changes</>
                )}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-neutral-500 uppercase text-xs">Age Band</th>
                  {MEMBER_TYPES.map(mt => (
                    isIuaBased ? (
                      IUA_OPTIONS.map(iua => (
                        <th key={`${mt}-${iua}`} className="px-3 py-2 text-center font-medium text-neutral-500 uppercase text-xs">
                          <div>{MEMBER_TYPE_LABELS[mt]}</div>
                          <div className="text-xs font-normal text-neutral-400">IUA ${iua.toLocaleString()}</div>
                        </th>
                      ))
                    ) : (
                      <th key={mt} className="px-3 py-2 text-center font-medium text-neutral-500 uppercase text-xs">
                        {MEMBER_TYPE_LABELS[mt]}
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {AGE_BANDS.map(band => (
                  <tr key={band.label} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 font-medium text-neutral-700 whitespace-nowrap">
                      {band.label}
                    </td>
                    {MEMBER_TYPES.map(mt => (
                      isIuaBased ? (
                        IUA_OPTIONS.map(iua => {
                          const key = priceKey(mt, band.min, iua);
                          const val = editedPrices[key] ?? '';
                          return (
                            <td key={`${mt}-${iua}`} className="px-2 py-1">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={val}
                                onChange={e => handlePriceChange(mt, band.min, iua, e.target.value)}
                                className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="$0.00"
                              />
                            </td>
                          );
                        })
                      ) : (
                        <td key={mt} className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editedPrices[priceKey(mt, band.min, null)] ?? ''}
                            onChange={e => handlePriceChange(mt, band.min, null, e.target.value)}
                            className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="$0.00"
                          />
                        </td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs text-neutral-500">
            <p>All values are monthly contributions in USD. Changes are saved as a batch when you click "Save All Changes".</p>
            {isIuaBased && <p className="mt-1">IUA = Initial Unshareable Amount (deductible equivalent).</p>}
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-neutral-500">Loading pricing data...</p>
        </Card>
      )}

      {/* Empty state */}
      {selectedPlanId && !loading && effectiveDates.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No pricing configured</h3>
          <p className="text-neutral-600 mb-4">This plan has no pricing data yet. Create a new pricing version to get started.</p>
          <Button
            variant="primary"
            onClick={() => {
              setShowNewDateForm(true);
              setNewDate(new Date().toISOString().split('T')[0]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Pricing
          </Button>
        </Card>
      )}
    </div>
  );
};
