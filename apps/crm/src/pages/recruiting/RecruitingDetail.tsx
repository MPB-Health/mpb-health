import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Mail,
  MessageSquare,
  PhoneCall,
  Send,
  CheckSquare,
  XCircle,
  Zap,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../../components/PermissionGate';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { useFocusItems } from '../../hooks/useFocusItems';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import { RecruitingProfileEmailTab } from '../../components/recruiting/RecruitingProfileEmailTab';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 5 / Section 9
// ----------------------------------------------------------------------------
// Recruiting detail — clones LeadDetail with the same 5-button top action
// row and Mark Lost behavior. Activities log to `crm_activities` with
// `related_to_type = 'recruiting'` so the daily-log auto-capture trigger
// fires on them just like it does for leads.

interface RecruitingRecord {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  workflow_subsection: string;
  state: string | null;
  city: string | null;
  agency_affiliation: string | null;
  appointed_carriers: string[];
  license_number: string | null;
  npn: string | null;
  assigned_to: string | null;
  last_touched_at: string | null;
  last_contacted_at: string | null;
  stage_changed_at: string | null;
  created_at: string;
  do_not_contact: boolean;
  notes: string | null;
}

interface RecruitingStage {
  id: string;
  name: string;
  display_name: string;
  color: string;
  sort_order: number;
  is_terminal: boolean;
}

const SUBSECTION_LABELS: Record<string, string> = {
  working: 'Working',
  nurture: 'Nurture',
  linkedin: 'LinkedIn',
  do_not_contact: 'Do Not Contact',
};

export default function RecruitingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const focusItems = useFocusItems();
  const [activeTab, setActiveTab] = useState<'overview' | 'email' | 'activity'>('overview');

  const { data: record, isLoading } = useQuery({
    queryKey: ['recruitingRecord', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_recruiting_records')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as RecruitingRecord;
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['recruitingStages', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_recruiting_pipeline_stages')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('sort_order');
      return (data ?? []) as RecruitingStage[];
    },
    staleTime: 60_000,
  });

  // Section 6 / Round 5 — Mark Lost equivalent for Recruiting. The lock is
  // simpler than for leads: we set DNC + subsection do_not_contact +
  // pipeline_stage = inactive, log a note via crm_activities so the daily
  // log auto-captures it, and stamp last_touched_at.
  const [showMarkInactive, setShowMarkInactive] = useState(false);
  const [reason, setReason] = useState('rep_marked_inactive');
  const [working, setWorking] = useState(false);

  const handleMarkInactive = async () => {
    if (!record || !user?.id) return;
    setWorking(true);
    const { error } = await supabase
      .from('crm_recruiting_records')
      .update({
        pipeline_stage: 'inactive',
        workflow_subsection: 'do_not_contact',
        do_not_contact: true,
        last_touched_at: new Date().toISOString(),
        notes: reason ? `${record.notes ? record.notes + '\n' : ''}[Marked inactive] ${reason}` : record.notes,
      })
      .eq('id', record.id);
    if (!error && activeOrgId) {
      // Log to crm_activities so the daily-log trigger fires.
      await supabase.from('crm_activities').insert({
        org_id: activeOrgId,
        related_to_type: 'recruiting',
        related_to_id: record.id,
        activity_type: 'note',
        subject: `Recruit marked inactive: ${reason}`,
        created_by: user.id,
      });
    }
    setWorking(false);
    setShowMarkInactive(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Marked inactive');
    queryClient.invalidateQueries({ queryKey: ['recruitingRecord', record.id] });
  };

  const stage = useMemo(() => stages.find((s) => s.name === record?.pipeline_stage), [stages, record]);

  if (isLoading || !record) {
    return (
      <div className="flex items-center justify-center py-24 text-th-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading recruit…
      </div>
    );
  }

  return (
    <PermissionGate permission="recruiting.read">
      <div className="space-y-6">
        <Link
          to="/recruiting"
          className="inline-flex items-center gap-1 text-xs text-th-text-tertiary hover:text-th-text-secondary"
        >
          <ArrowLeft className="w-3 h-3" /> Back to recruiting list
        </Link>

        <div className="bg-surface-primary border border-th-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-th-accent-600" />
                <h1 className="text-2xl font-semibold text-th-text-primary">
                  {record.first_name} {record.last_name}
                </h1>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-th-text-tertiary">
                <span>Created {formatTimeAgo(record.created_at)}</span>
                <span>·</span>
                <span>
                  Last touched{' '}
                  {record.last_touched_at
                    ? formatTimeAgo(record.last_touched_at)
                    : record.last_contacted_at
                      ? formatTimeAgo(record.last_contacted_at)
                      : '—'}
                </span>
              </div>
            </div>

            <PermissionGate permission="recruiting.write">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Section 6 — five-button row, mirroring Lead profile */}
                <ActionButton
                  icon={MessageSquare}
                  label="Note"
                  onClick={() => quickLog(record, 'note', user?.id, queryClient)}
                />
                <ActionButton
                  icon={PhoneCall}
                  label="Call"
                  onClick={() => quickLog(record, 'call', user?.id, queryClient)}
                />
                <ActionButton
                  icon={Mail}
                  label="Email"
                  onClick={() => {
                    if (!record.email) {
                      toast.error('No email on file');
                      return;
                    }
                    setActiveTab('email');
                  }}
                />
                <ActionButton
                  icon={Send}
                  label="Text"
                  onClick={() => toast('SMS ships with GoTo Connect (P5).', { icon: '📱' })}
                />
                <ActionButton
                  icon={CheckSquare}
                  label="Task"
                  onClick={() => toast('Task quick-add for recruits ships next iteration')}
                />
                {/* Section 6 / Round 5 — Pin↔Unpin toggle, parity with
                    Lead Profile. Recruit-pinned items use entity_type
                    'recruiting' (added to crm_focus_items by the
                    20260620440000 migration). */}
                {(() => {
                  const focusItem = focusItems.items.find(
                    (i) => i.entity_type === 'recruiting' && i.entity_id === record.id,
                  );
                  const pinned = !!focusItem;
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        if (pinned && focusItem) {
                          await focusItems.unpinItem(focusItem.id);
                          toast.success('Unpinned from Today');
                        } else {
                          await focusItems.pinItem('recruiting', record.id);
                          toast.success('Pinned to Today');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        pinned
                          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                      }`}
                      title={pinned ? 'Unpin from Today' : 'Pin to Today'}
                    >
                      <Zap className="w-4 h-4" />
                      {pinned ? 'Unpin' : 'Pin to Today'}
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setShowMarkInactive(true)}
                  disabled={record.pipeline_stage === 'inactive'}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" /> Mark Inactive
                </button>
              </div>
            </PermissionGate>
          </div>

          <div className="mt-6 pt-6 border-t border-th-border flex items-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Stage</span>
              <select
                value={record.pipeline_stage}
                onChange={async (e) => {
                  const { error } = await supabase
                    .from('crm_recruiting_records')
                    .update({ pipeline_stage: e.target.value, stage_changed_at: new Date().toISOString() })
                    .eq('id', record.id);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  toast.success('Stage updated');
                  queryClient.invalidateQueries({ queryKey: ['recruitingRecord', record.id] });
                }}
                className="border border-th-border rounded-lg px-3 py-1.5 text-sm bg-surface-primary"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.display_name}
                  </option>
                ))}
              </select>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-th-accent-200 bg-th-accent-50 text-th-accent-800">
                {SUBSECTION_LABELS[record.workflow_subsection] || record.workflow_subsection}
              </span>
            </div>
            {record.agency_affiliation && (
              <div className="text-th-text-secondary">
                <span className="text-th-text-tertiary text-xs">Agency: </span>
                {record.agency_affiliation}
              </div>
            )}
            {(record.license_number || record.npn) && (
              <div className="text-th-text-tertiary text-xs">
                {[record.license_number, record.npn].filter(Boolean).join(' / ')}
              </div>
            )}
          </div>
        </div>

        {/* Section 6 / 7 Round 5 — Profile tab bar (mirrors Lead Profile) */}
        <div className="bg-surface-primary border border-th-border rounded-2xl">
          <div className="flex items-center gap-1 border-b border-th-border px-3">
            {(['overview', 'email', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-th-accent-700 border-b-2 border-th-accent-600 -mb-px'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-th-text-tertiary mb-0.5">
                    Email
                  </div>
                  <div className="text-th-text-primary">{record.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-th-text-tertiary mb-0.5">
                    Phone
                  </div>
                  <div className="text-th-text-primary">{record.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-th-text-tertiary mb-0.5">
                    City / State
                  </div>
                  <div className="text-th-text-primary">
                    {[record.city, record.state].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-th-text-tertiary mb-0.5">
                    Appointed Carriers
                  </div>
                  <div className="text-th-text-primary">
                    {record.appointed_carriers?.length
                      ? record.appointed_carriers.join(', ')
                      : '—'}
                  </div>
                </div>
                {record.notes && (
                  <div className="md:col-span-2">
                    <div className="text-xs uppercase tracking-wider text-th-text-tertiary mb-0.5">
                      Notes
                    </div>
                    <div className="text-th-text-secondary whitespace-pre-wrap">
                      {record.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'email' && (
              <RecruitingProfileEmailTab
                recruit={{
                  id: record.id,
                  org_id: record.org_id,
                  first_name: record.first_name,
                  last_name: record.last_name,
                  email: record.email,
                }}
              />
            )}
            {activeTab === 'activity' && (
              <p className="text-xs text-th-text-tertiary">
                Activity feed and Daily Log auto-capture for recruiting events ship next iteration.
                Until then, reps can review activity in <Link to="/sales-daily-logs" className="underline">Sales Daily Logs</Link> — recruiting calls, notes, and emails surface there automatically.
              </p>
            )}
          </div>
        </div>

        {/* Mark Inactive modal */}
        {showMarkInactive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-th-text-primary">Mark Recruit Inactive?</h3>
              <p className="text-sm text-th-text-secondary mt-1 mb-4">
                Sets stage to Inactive, subsection to Do Not Contact, and flags DNC. The reason is
                logged on the activity timeline.
              </p>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="rep_marked_inactive"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMarkInactive(false)}
                  disabled={working}
                  className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkInactive}
                  disabled={working}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {working ? 'Marking…' : 'Mark Inactive'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary bg-surface-secondary hover:bg-surface-primary hover:shadow-sm transition-all"
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

// Logs a quick "rep-initiated" note/call entry on the recruit and refreshes
// the cache. Daily Log v2 picks the row up via the auto-capture trigger.
async function quickLog(
  record: RecruitingRecord,
  type: 'call' | 'note',
  userId: string | undefined,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (!userId) return;
  const subject = type === 'call' ? 'Recruiting call' : 'Recruiting note';
  const { error } = await supabase.from('crm_activities').insert({
    org_id: record.org_id,
    related_to_type: 'recruiting',
    related_to_id: record.id,
    activity_type: type,
    subject,
    created_by: userId,
    completed_at: new Date().toISOString(),
  });
  if (error) {
    toast.error(error.message);
    return;
  }
  await supabase
    .from('crm_recruiting_records')
    .update({ last_touched_at: new Date().toISOString() })
    .eq('id', record.id);
  toast.success(`${subject} logged`);
  queryClient.invalidateQueries({ queryKey: ['recruitingRecord', record.id] });
}
