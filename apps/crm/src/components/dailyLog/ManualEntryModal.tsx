import { useState } from 'react';
import { Modal } from '../Modal';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';

// ----------------------------------------------------------------------------
// CRM rebuild Section 8 — Manual entry (Round 4)
// ----------------------------------------------------------------------------
// Spec: "Keep manual entry available for off-CRM activity: in-person meetings,
// personal-cell calls, networking events, any touch not captured by an
// integration." Writes to crm_daily_log_events with manual = true via the
// crm_daily_log_add_manual RPC. Auto-rows are read-only by RLS; this modal
// is the only path reps have to add to the log directly.

export type ManualEntrySection =
  | 'lead_communication'
  | 'linkedin_activity'
  | 'pipeline'
  | 'deals_closed'
  | 'activities'
  | 'content_creation';

const ACTIVITY_OPTIONS: Record<ManualEntrySection, { value: string; label: string }[]> = {
  lead_communication: [
    { value: 'call', label: 'Call (personal cell / off-CRM)' },
    { value: 'email', label: 'Email (off-CRM)' },
    { value: 'sms', label: 'SMS / text (off-CRM)' },
    { value: 'note', label: 'Note' },
  ],
  linkedin_activity: [
    { value: 'linkedin_message', label: 'LinkedIn DM' },
    { value: 'linkedin_connection_sent', label: 'LinkedIn connection request' },
    { value: 'linkedin_engagement', label: 'LinkedIn post engagement' },
    { value: 'linkedin_post', label: 'LinkedIn post' },
  ],
  pipeline: [
    { value: 'meeting', label: 'In-person / Zoom meeting' },
    { value: 'demo', label: 'Demo' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'proposal_sent', label: 'Proposal sent' },
  ],
  deals_closed: [
    { value: 'enrollment_won', label: 'Enrollment won — manual close' },
    { value: 'quote_sent', label: 'Quote sent — off-CRM' },
  ],
  activities: [
    { value: 'networking_event', label: 'Networking event' },
    { value: 'community_outreach', label: 'Community outreach' },
    { value: 'referral_requested', label: 'Referral asked' },
  ],
  content_creation: [
    { value: 'content', label: 'Content drafted' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'social', label: 'Social post' },
  ],
};

const SECTION_LABELS: Record<ManualEntrySection, string> = {
  lead_communication: 'Lead Communication',
  linkedin_activity: 'LinkedIn Activity',
  pipeline: 'Pipeline',
  deals_closed: 'Deals Closed',
  activities: 'Activities',
  content_creation: 'Content Creation',
};

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSection?: ManualEntrySection;
  onSuccess: () => void;
}

export function ManualEntryModal({ open, onClose, defaultSection, onSuccess }: Props) {
  const { activeOrgId } = useOrg();
  const [section, setSection] = useState<ManualEntrySection>(
    defaultSection ?? 'lead_communication',
  );
  const [activityType, setActivityType] = useState<string>(
    ACTIVITY_OPTIONS[defaultSection ?? 'lead_communication'][0].value,
  );
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState<string>(() => {
    // local datetime-input value (YYYY-MM-DDTHH:mm) for the current time.
    const d = new Date();
    const tzOffsetMs = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const handleSectionChange = (next: ManualEntrySection) => {
    setSection(next);
    setActivityType(ACTIVITY_OPTIONS[next][0].value);
  };

  const handleSave = async () => {
    if (!activeOrgId) return;
    if (!description.trim()) {
      toast.error('Add a short description so the row is meaningful in the log');
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('crm_daily_log_add_manual', {
      p_org_id: activeOrgId,
      p_section: section,
      p_activity_type: activityType,
      p_description: description.trim(),
      p_occurred_at: new Date(occurredAt).toISOString(),
      p_metadata: {},
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Manual entry logged');
    setDescription('');
    onSuccess();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log manual activity">
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Use this for activity that wasn&apos;t captured automatically — in-person meetings,
          personal-cell calls, networking events, any touch outside the CRM. Manual rows are
          flagged so admins can distinguish them from auto-captured activity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => handleSectionChange(e.target.value as ManualEntrySection)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              {(Object.keys(SECTION_LABELS) as ManualEntrySection[]).map((s) => (
                <option key={s} value={s}>
                  {SECTION_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">
              Activity type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              {ACTIVITY_OPTIONS[section].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Hung out at NJ Chamber Mixer; spoke with 4 prospects, 1 follow-up"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-th-text-secondary mb-1">
            When did this happen?
          </label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Log activity'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
