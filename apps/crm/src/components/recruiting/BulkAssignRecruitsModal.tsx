import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../Modal';
import { supabase } from '../../lib/supabase';
import { useOrgReps } from '../../hooks/useOrgReps';

interface Props {
  open: boolean;
  onClose: () => void;
  recruitIds: string[];
  onSuccess: () => void;
}

// ----------------------------------------------------------------------------
// CRM rebuild Section 9 Round 5 — Recruiting clone parity
// ----------------------------------------------------------------------------
// Mirrors `BulkAssignModal` (Leads list) but writes to
// `crm_recruiting_records.assigned_to`. Tasks and activity history live on
// `crm_activities` keyed by `related_to_type='recruiting'` so reassigning
// the owner only touches the one column — preservation is automatic.
//
// The owner picker is a useOrgReps dropdown so admins select an actual
// rep UUID (or "Unassigned" to put the recruit back into the round-robin
// pool). Identical UX to the Leads list bulk-assign so reps don't have to
// re-learn the flow.

export function BulkAssignRecruitsModal({ open, onClose, recruitIds, onSuccess }: Props) {
  const { data: reps = [], isLoading: loadingReps } = useOrgReps();
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setAssigneeId('');
  }, [open]);

  const handleSubmit = async () => {
    if (saving || recruitIds.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('crm_recruiting_records')
        .update({
          assigned_to: assigneeId === '' ? null : assigneeId,
          last_touched_at: new Date().toISOString(),
        })
        .in('id', recruitIds);
      if (error) throw error;
      const repName =
        assigneeId === ''
          ? 'Unassigned'
          : reps.find((r) => r.user_id === assigneeId)?.display_name ?? 'selected rep';
      toast.success(
        `Assigned ${recruitIds.length} recruit${recruitIds.length !== 1 ? 's' : ''} to ${repName}`,
      );
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign recruits';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${recruitIds.length} Recruits`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Choose the new owner for {recruitIds.length} selected recruit
          {recruitIds.length !== 1 ? 's' : ''}. Activity history and tasks are preserved
          automatically — only the assigned owner changes.
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
              <option value="">— Unassigned (return to pool) —</option>
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
