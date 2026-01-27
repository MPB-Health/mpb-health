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

export function BulkStageModal({ open, onClose, leadIds, onSuccess }: Props) {
  const { leadService, pipelineStages, automationService } = useCRM();
  const [stage, setStage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!stage) {
      toast.error('Please select a stage');
      return;
    }

    setSaving(true);
    try {
      const result = await leadService.bulkUpdateLeads(leadIds, { pipeline_stage: stage });
      // Fire automation events for each lead
      for (const leadId of leadIds) {
        automationService.evaluateEvent({
          type: 'stage_change',
          leadId,
          data: { to_stage: stage },
        }).catch(console.error);
      }
      const stageLabel = pipelineStages.find((s) => s.name === stage)?.display_name || stage;
      if (result.failed === 0) {
        toast.success(`Moved ${result.success} leads to ${stageLabel}`);
      } else {
        toast.success(`Moved ${result.success} leads, ${result.failed} failed`);
      }
      setStage('');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Change Stage for ${leadIds.length} Leads`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Move {leadIds.length} selected lead{leadIds.length !== 1 ? 's' : ''} to a new pipeline stage.
        </p>
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Pipeline Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select a stage...</option>
            {pipelineStages.map((s) => (
              <option key={s.id} value={s.name}>
                {s.display_name}
              </option>
            ))}
          </select>
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
            disabled={saving || !stage}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Change Stage'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
