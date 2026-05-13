import { useState } from 'react';
import { Modal } from '../Modal';
import toast from 'react-hot-toast';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ----------------------------------------------------------------------------
// CRM rebuild Section 8 — Admin correction modal
// ----------------------------------------------------------------------------
// Spec: "Auto rows: read-only for reps; admin can correct/delete with audit
// trail." Both correction RPCs require a non-empty reason which lands in
// crm_daily_log_corrections alongside the before/after image.

interface DailyLogEvent {
  id: string;
  user_id: string;
  section: string;
  activity_type: string;
  activity_subtype: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  manual: boolean;
  source: string;
  occurred_at: string;
}

const SECTIONS = [
  'lead_communication',
  'linkedin_activity',
  'pipeline',
  'deals_closed',
  'activities',
  'content_creation',
  'special_projects',
] as const;

interface Props {
  event: DailyLogEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminCorrectionModal({ event, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'edit' | 'delete'>('edit');
  const [description, setDescription] = useState(event?.description ?? '');
  const [section, setSection] = useState<string>(event?.section ?? 'pipeline');
  const [activityType, setActivityType] = useState<string>(event?.activity_type ?? '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!event) return null;

  const handleSubmit = async () => {
    if (reason.trim().length < 3) {
      toast.error('A reason of at least 3 characters is required');
      return;
    }
    setSaving(true);
    if (mode === 'edit') {
      const { error } = await supabase.rpc('crm_daily_log_admin_edit', {
        p_event_id: event.id,
        p_patch: {
          description,
          section,
          activity_type: activityType,
        },
        p_reason: reason.trim(),
      });
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Correction recorded');
    } else {
      const { error } = await supabase.rpc('crm_daily_log_admin_delete', {
        p_event_id: event.id,
        p_reason: reason.trim(),
      });
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Row deleted (audit trail recorded)');
    }
    onSuccess();
    onClose();
  };

  return (
    <Modal open={!!event} onClose={onClose} title="Admin correction">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">This action is audited.</p>
            <p>
              Both the before and after image of the row are written to
              <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded">crm_daily_log_corrections</code>
              along with your reason. Reps cannot see the correction record.
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex-1 px-3 py-2 rounded-lg border ${mode === 'edit' ? 'bg-th-accent-50 border-th-accent-300 text-th-accent-700 font-semibold' : 'bg-surface-primary border-th-border text-th-text-secondary'}`}
          >
            Edit row
          </button>
          <button
            type="button"
            onClick={() => setMode('delete')}
            className={`flex-1 px-3 py-2 rounded-lg border ${mode === 'delete' ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : 'bg-surface-primary border-th-border text-th-text-secondary'}`}
          >
            <Trash2 className="w-3 h-3 inline-block mr-1" /> Delete row
          </button>
        </div>

        {mode === 'edit' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">
                  Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">
                  Activity type
                </label>
                <input
                  type="text"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">
                Description
              </label>
              <textarea
                value={description ?? ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-th-text-secondary mb-1">
            Reason (audit trail)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Wrong attribution from GoTo Connect webhook"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-2 ${mode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-th-accent-600 hover:bg-th-accent-700'}`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : mode === 'edit' ? 'Save correction' : 'Delete row'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
