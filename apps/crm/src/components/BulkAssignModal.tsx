import { useState } from 'react';
import { Modal } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';

interface Props {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function BulkAssignModal({ open, onClose, leadIds, onSuccess }: Props) {
  const { leadService } = useCRM();
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!assignee.trim()) {
      toast.error('Please enter an assignee email');
      return;
    }

    setSaving(true);
    try {
      const result = await leadService.bulkUpdateLeads(leadIds, { assigned_to: assignee.trim() });
      if (result.failed === 0) {
        toast.success(`Assigned ${result.success} leads to ${assignee}`);
      } else {
        toast.success(`Assigned ${result.success} leads, ${result.failed} failed`);
      }
      setAssignee('');
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
          Assign {leadIds.length} selected lead{leadIds.length !== 1 ? 's' : ''} to a team member.
        </p>
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Assignee Email
          </label>
          <input
            type="email"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="user@mympb.com"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !assignee.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
