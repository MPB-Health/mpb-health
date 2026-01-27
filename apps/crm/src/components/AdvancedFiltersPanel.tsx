import { InputField, SelectField } from './FormField';
import type { LeadFilters } from '@mpbhealth/crm-core';

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

const ZOHO_STATUS_OPTIONS = [
  { value: '', label: 'All Sync Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'synced', label: 'Synced' },
  { value: 'failed', label: 'Failed' },
];

export function AdvancedFiltersPanel({ filters, onChange }: AdvancedFiltersPanelProps) {
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
    filters.zohoSyncStatus,
    filters.dateFrom,
    filters.dateTo,
    filters.tags?.length,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Advanced Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({})}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SelectField
          label="Priority"
          name="priority"
          value={(filters.priority as string) || ''}
          onChange={(e) => update('priority', e.target.value)}
          options={PRIORITY_OPTIONS}
        />

        <SelectField
          label="Zoho Sync"
          name="zohoSyncStatus"
          value={(filters.zohoSyncStatus as string) || ''}
          onChange={(e) => update('zohoSyncStatus', e.target.value)}
          options={ZOHO_STATUS_OPTIONS}
        />

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
      </div>

      <InputField
        label="Tags (comma-separated)"
        name="tags"
        value={filters.tags?.join(', ') || ''}
        onChange={(e) => update('tags', e.target.value)}
        placeholder="e.g. family, urgent"
      />
    </div>
  );
}
