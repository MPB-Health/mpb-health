import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ApprovalStepCreateInput, ApproverType, RejectAction } from '@mpbhealth/crm-core';

interface ApprovalStepBuilderProps {
  steps: ApprovalStepCreateInput[];
  onChange: (steps: ApprovalStepCreateInput[]) => void;
}

const APPROVER_TYPES: { value: ApproverType; label: string }[] = [
  { value: 'user', label: 'Specific User' },
  { value: 'role', label: 'Role' },
  { value: 'manager', label: 'Manager' },
];

const REJECT_ACTIONS: { value: RejectAction; label: string }[] = [
  { value: 'reject', label: 'Reject Entire Request' },
  { value: 'go_back', label: 'Go Back One Step' },
  { value: 'notify', label: 'Notify Only' },
];

export default function ApprovalStepBuilder({ steps, onChange }: ApprovalStepBuilderProps) {
  const addStep = () => {
    onChange([
      ...steps,
      {
        step_order: steps.length + 1,
        approver_type: 'role',
        role_name: 'admin',
        action_on_reject: 'reject',
      },
    ]);
  };

  const updateStep = (index: number, updates: Partial<ApprovalStepCreateInput>) => {
    const updated = steps.map((s, i) => (i === index ? { ...s, ...updates } : s));
    onChange(updated);
  };

  const removeStep = (index: number) => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step_order: i + 1 }));
    onChange(updated);
  };

  const moveStep = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= steps.length) return;

    const updated = [...steps];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    onChange(updated.map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-th-text-primary">
        Approval Steps
      </label>
      <p className="text-xs text-th-text-tertiary">
        Define the ordered chain of approvers. Each step must be approved before the next.
      </p>

      {steps.map((step, idx) => (
        <div key={idx} className="border border-th-border rounded-lg p-3 space-y-2 bg-surface-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveStep(idx, 'up')}
                  className="text-th-text-tertiary hover:text-th-text-secondary disabled:opacity-30"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm font-medium text-th-text-primary">
                Step {step.step_order}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeStep(idx)}
              className="p-1 text-red-500 hover:text-red-700 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Approver Type */}
            <div>
              <label className="block text-xs text-th-text-tertiary mb-1">Approver Type</label>
              <select
                value={step.approver_type}
                onChange={(e) => updateStep(idx, { approver_type: e.target.value as ApproverType })}
                className="w-full text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              >
                {APPROVER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* On Reject */}
            <div>
              <label className="block text-xs text-th-text-tertiary mb-1">On Reject</label>
              <select
                value={step.action_on_reject || 'reject'}
                onChange={(e) => updateStep(idx, { action_on_reject: e.target.value as RejectAction })}
                className="w-full text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              >
                {REJECT_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional fields based on approver_type */}
          {step.approver_type === 'user' && (
            <div>
              <label className="block text-xs text-th-text-tertiary mb-1">User ID</label>
              <input
                type="text"
                value={step.approver_id || ''}
                onChange={(e) => updateStep(idx, { approver_id: e.target.value })}
                placeholder="Enter user UUID"
                className="w-full text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
          )}
          {step.approver_type === 'role' && (
            <div>
              <label className="block text-xs text-th-text-tertiary mb-1">Role Name</label>
              <select
                value={step.role_name || 'admin'}
                onChange={(e) => updateStep(idx, { role_name: e.target.value })}
                className="w-full text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="finance">Finance</option>
                <option value="sales_lead">Sales Lead</option>
              </select>
            </div>
          )}

          {/* Auto-approve */}
          <div>
            <label className="block text-xs text-th-text-tertiary mb-1">
              Auto-approve after (hours) &mdash; leave blank for manual only
            </label>
            <input
              type="number"
              min="0"
              value={step.auto_approve_after_hours ?? ''}
              onChange={(e) => updateStep(idx, {
                auto_approve_after_hours: e.target.value ? Number(e.target.value) : undefined,
              })}
              placeholder="e.g. 48"
              className="w-32 text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addStep}
        className="flex items-center gap-1.5 text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Step
      </button>
    </div>
  );
}
