import { useState } from 'react';
import toast from 'react-hot-toast';
import type {
  ApprovalEntityType,
  ApprovalProcessCreateInput,
  ApprovalStepCreateInput,
  TriggerCondition,
  ApprovalProcess,
} from '@mpbhealth/crm-core';
import { Modal } from '../Modal';
import TriggerConditionBuilder from './TriggerConditionBuilder';
import ApprovalStepBuilder from './ApprovalStepBuilder';

interface CreateProcessModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  editingProcess?: ApprovalProcess & { steps?: ApprovalStepCreateInput[] };
  onSave: (input: ApprovalProcessCreateInput) => Promise<void>;
}

const ENTITY_TYPES: { value: ApprovalEntityType; label: string }[] = [
  { value: 'deal', label: 'Deal' },
  { value: 'quote', label: 'Quote' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'discount', label: 'Discount' },
];

export default function CreateProcessModal({
  open,
  onClose,
  orgId,
  editingProcess,
  onSave,
}: CreateProcessModalProps) {
  const [name, setName] = useState(editingProcess?.name ?? '');
  const [description, setDescription] = useState(editingProcess?.description ?? '');
  const [entityType, setEntityType] = useState<ApprovalEntityType>(editingProcess?.entity_type ?? 'deal');
  const [isActive, setIsActive] = useState(editingProcess?.is_active ?? true);
  const [conditions, setConditions] = useState<TriggerCondition[]>(
    editingProcess?.trigger_conditions ?? [],
  );
  const [steps, setSteps] = useState<ApprovalStepCreateInput[]>(
    editingProcess?.steps ?? [
      { step_order: 1, approver_type: 'role', role_name: 'admin', action_on_reject: 'reject' },
    ],
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (steps.length === 0) {
      toast.error('At least one approval step is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        org_id: orgId,
        name: name.trim(),
        description: description.trim() || undefined,
        entity_type: entityType,
        trigger_conditions: conditions,
        is_active: isActive,
        steps,
      });
      onClose();
    } catch {
      toast.error('Failed to save approval process');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProcess ? 'Edit Approval Process' : 'Create Approval Process'}
      description="Define the conditions and approval chain for this workflow."
      size="xl"
      variant="slideOver"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-primary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Large Deal Approval"
            className="w-full text-sm px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-primary mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe when this process applies..."
            className="w-full text-sm px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500 resize-none"
          />
        </div>

        {/* Entity type */}
        <div>
          <label className="block text-sm font-medium text-th-text-primary mb-1">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as ApprovalEntityType)}
            className="w-full text-sm px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="processActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
          />
          <label htmlFor="processActive" className="text-sm text-th-text-primary">
            Active
          </label>
        </div>

        {/* Trigger conditions */}
        <TriggerConditionBuilder
          entityType={entityType}
          conditions={conditions}
          onChange={setConditions}
        />

        {/* Steps */}
        <ApprovalStepBuilder steps={steps} onChange={setSteps} />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:text-th-text-primary rounded-lg border border-th-border hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : editingProcess ? 'Update Process' : 'Create Process'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
