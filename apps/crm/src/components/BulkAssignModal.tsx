import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrgReps } from '../hooks/useOrgReps';

interface Props {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

// ----------------------------------------------------------------------------
// CRM rebuild Section 6 / Round 3 — Leads list bulk-assign-to-salesperson
// ----------------------------------------------------------------------------
// Spec: "select leads → choose owner → confirm".
// Round 12 Addendum (2026-05-14) — active inside-sales roster is now Adam
// (part-time) + Tupac (full-time). Leo departed; references swept.
// "Bulk-assign preserves existing tasks and activity history on each lead."
//
// Activity history lives on `crm_activities` keyed to `lead_id`, and tasks
// live on `crm_tasks`. Reassigning the owner only mutates
// `lead_submissions.assigned_to` so neither table is touched — preservation
// is automatic.
//
// The owner is a UUID picked from `org_memberships` via useOrgReps so the
// dropdown shows actual reps in the active org. Plus an "Unassigned" option
// so admins can put a lead back into the round-robin pool.

export function BulkAssignModal({ open, onClose, leadIds, onSuccess }: Props) {
  const { leadService } = useCRM();
  const { data: reps = [], isLoading: loadingReps } = useOrgReps();
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset selection when the modal closes / reopens.
  useEffect(() => {
    if (!open) setAssigneeId('');
  }, [open]);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await leadService.bulkUpdateLeads(leadIds, {
        assigned_to: assigneeId === '' ? null : assigneeId,
      });
      const repName =
        assigneeId === ''
          ? 'Unassigned'
          : reps.find((r) => r.user_id === assigneeId)?.display_name ?? 'selected rep';
      if (result.failed === 0) {
        toast.success(`Assigned ${result.success} lead${result.success !== 1 ? 's' : ''} to ${repName}`);
      } else {
        toast.error(`Assigned ${result.success}, ${result.failed} failed`);
      }
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to assign leads');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${leadIds.length} Leads`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Choose the new owner for {leadIds.length} selected lead
          {leadIds.length !== 1 ? 's' : ''}. Tasks and activity history are preserved automatically
          — only the assigned owner changes.
        </p>
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">Owner</label>
          {loadingReps ? (
            <div className="flex items-center gap-2 text-sm text-th-text-tertiary py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading reps…
            </div>
          ) : (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">— Unassigned (return to round-robin pool) —</option>
              {reps.map((r) => (
                <option key={r.user_id} value={r.user_id}>
                  {r.display_name}
                  {r.email ? ` (${r.email})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loadingReps}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {saving ? 'Assigning…' : 'Confirm assignment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
