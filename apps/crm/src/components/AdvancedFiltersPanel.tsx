import { useState, useEffect } from 'react';
import { InputField, SelectField } from './FormField';
import { supabase } from '../lib/supabase';
import {
  type LeadFilters,
  PLAN_TYPE_LABELS,
  TOBACCO_STATUS_LABELS,
  GROUP_TYPE_LABELS,
  createCarrierService,
  type InsuranceCarrier,
} from '@mpbhealth/crm-core';

const carrierService = createCarrierService(supabase);

interface AdvancedFiltersPanelProps {
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
}

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function AdvancedFiltersPanel({ filters, onChange }: AdvancedFiltersPanelProps) {
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);

  useEffect(() => {
    carrierService
      .getCarriers({ is_active: true })
      .then((data: InsuranceCarrier[]) => setCarriers(data))
      .catch(() => {});
  }, []);

  const update = (key: string, value: string) => {
    if (key === 'tags') {
      const tagArray = value ? value.split(',').map(t => t.trim()).filter(Boolean) : undefined;
      onChange({ ...filters, tags: tagArray });
    } else {
      onChange({ ...filters, [key]: value || undefined });
    }
  };

  const activeCount = [
    filters.priority,
    filters.dateFrom,
    filters.dateTo,
    filters.tags?.length,
    filters.planType,
    filters.carrierId,
  ].filter(Boolean).length;

  const planTypeOptions = [
    { value: '', label: 'All Plan Types' },
    ...Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => ({
      value,
      label: String(label),
    })),
  ];

  const tobaccoOptions = [
    { value: '', label: 'All Tobacco' },
    ...Object.entries(TOBACCO_STATUS_LABELS).map(([value, label]) => ({
      value,
      label: String(label),
    })),
  ];

  const groupTypeOptions = [
    { value: '', label: 'All Group Types' },
    ...Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => ({
      value,
      label: String(label),
    })),
  ];

  const carrierOptions = [
    { value: '', label: 'All Carriers' },
    ...carriers.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-th-text-primary">Advanced Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({})}
            className="text-xs text-th-accent-600 hover:text-th-accent-700 font-medium"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Row 1: Plan & Coverage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SelectField
          label="Plan Type"
          name="planType"
          value={(filters.planType as string) || ''}
          onChange={(e) => update('planType', e.target.value)}
          options={planTypeOptions}
        />
        <SelectField
          label="Carrier"
          name="carrierId"
          value={(filters.carrierId as string) || ''}
          onChange={(e) => update('carrierId', e.target.value)}
          options={carrierOptions}
        />
        <SelectField
          label="Priority"
          name="priority"
          value={(filters.priority as string) || ''}
          onChange={(e) => update('priority', e.target.value)}
          options={PRIORITY_OPTIONS}
        />
        <SelectField
          label="Tobacco Status"
          name="tobaccoStatus"
          value={(filters as Record<string, string>).tobaccoStatus || ''}
          onChange={(e) => update('tobaccoStatus', e.target.value)}
          options={tobaccoOptions}
        />
      </div>

      {/* Row 2: Dates & Group */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField
          label="From Date"
          name="dateFrom"
          type="date"
          value={(filters.dateFrom as string) || ''}
          onChange={(e) => update('dateFrom', e.target.value)}
        />
        <InputField
          label="To Date"
          name="dateTo"
          type="date"
          value={(filters.dateTo as string) || ''}
          onChange={(e) => update('dateTo', e.target.value)}
        />
        <SelectField
          label="Group Type"
          name="groupType"
          value={(filters as Record<string, string>).groupType || ''}
          onChange={(e) => update('groupType', e.target.value)}
          options={groupTypeOptions}
        />
        <InputField
          label="Tags (comma-separated)"
          name="tags"
          value={filters.tags?.join(', ') || ''}
          onChange={(e) => update('tags', e.target.value)}
          placeholder="e.g. family, urgent"
        />
      </div>
    </div>
  );
}
