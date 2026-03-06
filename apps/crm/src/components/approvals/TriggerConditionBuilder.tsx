import { Plus, Trash2 } from 'lucide-react';
import type { TriggerCondition, ApprovalEntityType } from '@mpbhealth/crm-core';

interface TriggerConditionBuilderProps {
  entityType: ApprovalEntityType;
  conditions: TriggerCondition[];
  onChange: (conditions: TriggerCondition[]) => void;
}

const ENTITY_FIELDS: Record<ApprovalEntityType, { value: string; label: string }[]> = {
  deal: [
    { value: 'amount', label: 'Deal Amount' },
    { value: 'probability', label: 'Probability (%)' },
    { value: 'deal_type', label: 'Deal Type' },
    { value: 'stage', label: 'Stage' },
  ],
  quote: [
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'discount_percent', label: 'Discount (%)' },
    { value: 'status', label: 'Status' },
  ],
  invoice: [
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'status', label: 'Status' },
  ],
  discount: [
    { value: 'discount_percent', label: 'Discount (%)' },
    { value: 'discount_amount', label: 'Discount Amount' },
  ],
};

const OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'contains', label: 'Contains' },
];

export default function TriggerConditionBuilder({
  entityType,
  conditions,
  onChange,
}: TriggerConditionBuilderProps) {
  const fields = ENTITY_FIELDS[entityType] || [];

  const addCondition = () => {
    onChange([
      ...conditions,
      { field: fields[0]?.value || '', operator: 'gt', value: '' },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<TriggerCondition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-th-text-primary">
        Trigger Conditions
      </label>
      <p className="text-xs text-th-text-tertiary">
        All conditions must be met to trigger the approval workflow.
      </p>

      {conditions.map((condition, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {/* Field */}
          <select
            value={condition.field}
            onChange={(e) => updateCondition(idx, { field: e.target.value })}
            className="flex-1 text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {fields.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Operator */}
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(idx, { operator: e.target.value as TriggerCondition['operator'] })}
            className="w-24 text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>

          {/* Value */}
          <input
            type="text"
            value={String(condition.value)}
            onChange={(e) => {
              const val = e.target.value;
              // Try to parse as number
              const numVal = Number(val);
              updateCondition(idx, { value: isNaN(numVal) || val === '' ? val : numVal });
            }}
            placeholder="Value"
            className="w-32 text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          />

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeCondition(idx)}
            className="p-1 text-red-500 hover:text-red-700 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addCondition}
        className="flex items-center gap-1.5 text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </button>
    </div>
  );
}
