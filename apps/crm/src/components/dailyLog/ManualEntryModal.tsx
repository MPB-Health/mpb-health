import { useState } from 'react';
import { Modal } from '../Modal';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';

// ----------------------------------------------------------------------------
// CRM rebuild Section 8 — Manual entry (Round 4) + Section 11 (Round 6)
// ----------------------------------------------------------------------------
// Spec: "Keep manual entry available for off-CRM activity: in-person meetings,
// personal-cell calls, networking events, any touch not captured by an
// integration." Writes to crm_daily_log_events with manual = true via the
// crm_daily_log_add_manual RPC. Auto-rows are read-only by RLS; this modal
// is the only path reps have to add to the log directly.
//
// Section 11 buckets (strict): activity options below mirror exactly the
// section-content list in the Round 6 spec — Cancellation Calls live with
// Lead Communication, LinkedIn replies / profile views live with LinkedIn
// Activity, LinkedIn posts (drafts) live with Content Creation, and the
// Pipeline / Deals Closed manual entries are restricted to stage / close
// outcomes.

export type ManualEntrySection =
  | 'lead_communication'
  | 'linkedin_activity'
  | 'pipeline'
  | 'deals_closed'
  | 'activities'
  | 'content_creation';

interface ActivityOption {
  value: string;
  label: string;
  // If set, the modal includes the flag in metadata so the RPC stamps
  // crm_daily_log_events.activity_subtype (and the accordion row renders
  // the correct subtype chip — e.g. red "cancellation" badge).
  subtype?: string;
}

const ACTIVITY_OPTIONS: Record<ManualEntrySection, ActivityOption[]> = {
  // Lead Communication (Section 11 spec): Calls, Texts, Emails,
  // Cancellation Calls.
  lead_communication: [
    { value: 'call', label: 'Call (personal cell / off-CRM)' },
    {
      value: 'call',
      label: 'Cancellation call',
      subtype: 'cancellation',
    },
    { value: 'email', label: 'Email (off-CRM)' },
    { value: 'sms', label: 'Text / SMS (off-CRM)' },
    { value: 'note', label: 'Note' },
  ],
  // LinkedIn Activity (Section 11 spec, per Section 2 statuses):
  // connection requests, messages, replies, profile views, engagement.
  // LinkedIn posts are creative content and live in Content Creation.
  linkedin_activity: [
    { value: 'linkedin_connection_sent', label: 'Connection request sent' },
    { value: 'linkedin_message', label: 'LinkedIn DM' },
    { value: 'linkedin_reply', label: 'Reply received' },
    { value: 'linkedin_profile_view', label: 'Profile view' },
    { value: 'linkedin_engagement', label: 'Post engagement (like / comment)' },
  ],
  // Pipeline (Section 11 spec): stage advances, manual stage overrides,
  // "Mark as Lost", subsection transfers. Manual entries here are the
  // narrative/audit row when a stage decision happened off-CRM.
  pipeline: [
    { value: 'stage_change', label: 'Manual stage override' },
    { value: 'mark_lost', label: 'Mark as Lost (note only)' },
    { value: 'subsection_transfer', label: 'Subsection transfer (note)' },
  ],
  // Deals Closed (Section 11 spec): leads moved into Won / Enrolled.
  deals_closed: [
    { value: 'enrollment_won', label: 'Enrollment won — manual close' },
    { value: 'quote_sent', label: 'Quote sent — off-CRM' },
  ],
  // Activities (Section 11 spec): catch-all for rep actions not covered
  // by the other sections — meetings, demos, networking, referrals, etc.
  activities: [
    { value: 'meeting', label: 'In-person / Zoom meeting' },
    { value: 'demo', label: 'Demo' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'proposal_sent', label: 'Proposal sent' },
    { value: 'networking_event', label: 'Networking event' },
    { value: 'community_outreach', label: 'Community outreach' },
    { value: 'referral_requested', label: 'Referral asked' },
  ],
  // Content Creation (Section 11 spec): emails / templates created,
  // LinkedIn posts, and other drafted content.
  content_creation: [
    { value: 'linkedin_post', label: 'LinkedIn post drafted / published' },
    { value: 'template_created', label: 'Email / SMS template created' },
    { value: 'content', label: 'Content drafted (other)' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'social', label: 'Social post (other channel)' },
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

// Stable option key — value + optional subtype. Lets us disambiguate
// "Call" vs "Cancellation call" which share `value = 'call'`.
const optionKey = (o: ActivityOption) => (o.subtype ? `${o.value}::${o.subtype}` : o.value);
const findOption = (section: ManualEntrySection, key: string) =>
  ACTIVITY_OPTIONS[section].find((o) => optionKey(o) === key) ?? ACTIVITY_OPTIONS[section][0];

export function ManualEntryModal({ open, onClose, defaultSection, onSuccess }: Props) {
  const { activeOrgId } = useOrg();
  const [section, setSection] = useState<ManualEntrySection>(
    defaultSection ?? 'lead_communication',
  );
  const [activityKey, setActivityKey] = useState<string>(
    optionKey(ACTIVITY_OPTIONS[defaultSection ?? 'lead_communication'][0]),
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
    setActivityKey(optionKey(ACTIVITY_OPTIONS[next][0]));
  };

  const handleSave = async () => {
    if (!activeOrgId) return;
    if (!description.trim()) {
      toast.error('Add a short description so the row is meaningful in the log');
      return;
    }
    const opt = findOption(section, activityKey);
    const metadata: Record<string, unknown> = {};
    if (opt.subtype) {
      metadata.subtype = opt.subtype;
      if (opt.subtype === 'cancellation') metadata.is_cancellation = true;
    }
    setSaving(true);
    const { error } = await supabase.rpc('crm_daily_log_add_manual', {
      p_org_id: activeOrgId,
      p_section: section,
      p_activity_type: opt.value,
      p_description: description.trim(),
      p_occurred_at: new Date(occurredAt).toISOString(),
      p_metadata: metadata,
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
              value={activityKey}
              onChange={(e) => setActivityKey(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              {ACTIVITY_OPTIONS[section].map((opt) => {
                const k = optionKey(opt);
                return (
                  <option key={k} value={k}>
                    {opt.label}
                  </option>
                );
              })}
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
