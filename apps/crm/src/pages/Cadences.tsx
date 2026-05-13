import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Phone,
  Loader2,
  X,
  Activity,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { PermissionGate } from '../components/PermissionGate';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 3 / Section 13
// ----------------------------------------------------------------------------
// Multi-channel cadence builder. Each cadence is a row in
// `crm_follow_up_cadences`; steps live in the `steps` jsonb column. v2 step
// shape (see migration 20260620110000):
//
//   { step, channel, template_id, day_offset, send_window, halt_on_engagement, description }
//
// Phone steps auto-create reminder tasks for the rep on schedule (the
// scheduled job handles that — this UI just defines the step).

type CadenceChannel = 'email' | 'sms' | 'phone';

interface CadenceStep {
  step: number;
  channel: CadenceChannel;
  template_id: string | null;
  day_offset: number;
  description?: string;
  halt_on_engagement?: boolean;
  send_window?: { start_hour: number; end_hour: number; tz: string } | null;
}

interface Cadence {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  steps: CadenceStep[];
  is_default: boolean;
  is_active: boolean;
  halt_on_engagement: boolean;
  halt_on_optout: boolean;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

interface MasterTemplateLite {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'phone_script';
  subject: string | null;
}

const CHANNEL_ICON: Record<CadenceChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
};

const CHANNEL_LABEL: Record<CadenceChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  phone: 'Phone',
};

export default function Cadences() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useOrg();
  const [editing, setEditing] = useState<Cadence | null>(null);

  const { data: cadences = [], isLoading } = useQuery({
    queryKey: ['crmCadences', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_follow_up_cadences')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Cadence[]).map((c) => ({
        ...c,
        steps: Array.isArray(c.steps) ? c.steps : [],
      }));
    },
    staleTime: 30_000,
  });

  const { data: masterTemplates = [] } = useQuery({
    queryKey: ['crmCadenceMasterTemplates', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_master_templates')
        .select('id, name, channel, subject')
        .eq('org_id', activeOrgId!)
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return (data ?? []) as MasterTemplateLite[];
    },
    staleTime: 60_000,
  });

  const handleToggleActive = async (c: Cadence) => {
    const { error } = await supabase
      .from('crm_follow_up_cadences')
      .update({ is_active: !c.is_active })
      .eq('id', c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(c.is_active ? 'Paused' : 'Activated');
    queryClient.invalidateQueries({ queryKey: ['crmCadences', activeOrgId] });
  };

  const handleSave = async (cadence: Cadence) => {
    const { error } = await supabase
      .from('crm_follow_up_cadences')
      .update({
        name: cadence.name,
        description: cadence.description,
        steps: cadence.steps,
        halt_on_engagement: cadence.halt_on_engagement,
        halt_on_optout: cadence.halt_on_optout,
        schema_version: 2,
      })
      .eq('id', cadence.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Cadence saved');
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['crmCadences', activeOrgId] });
  };

  const handleCreate = async () => {
    if (!activeOrgId) return;
    const { data, error } = await supabase
      .from('crm_follow_up_cadences')
      .insert({
        org_id: activeOrgId,
        name: 'New Cadence',
        description: '',
        steps: [],
        is_active: false,
        halt_on_engagement: true,
        halt_on_optout: true,
        schema_version: 2,
      })
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['crmCadences', activeOrgId] });
    setEditing(data as Cadence);
  };

  return (
    <PermissionGate permission="settings.manage">
      <div className="space-y-6">
        <GradientHeader
          title="Cadences"
          subtitle="Multi-channel sequences (email + SMS + phone). Halt on engagement or opt-out signals."
          icon={<Activity className="w-5 h-5" />}
          size="sm"
          actions={
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" /> New Cadence
            </button>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-th-text-tertiary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cadences…
          </div>
        ) : cadences.length === 0 ? (
          <div className="bg-surface-primary border border-th-border rounded-2xl p-12 text-center">
            <Activity className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-th-text-primary">No cadences yet</p>
            <p className="text-xs text-th-text-tertiary mt-1">
              The Quote Response cadence ships with the platform — phase-3 migration adds it once
              your org is created.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cadences.map((c) => (
              <div
                key={c.id}
                className="bg-surface-primary border border-th-border rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-th-text-primary truncate">{c.name}</p>
                    {c.is_default && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-th-accent-50 text-th-accent-700">
                        Default
                      </span>
                    )}
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-secondary text-th-text-secondary">
                      v{c.schema_version}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-xs text-th-text-tertiary mt-1 line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-th-text-tertiary">
                    <span>{c.steps.length} step{c.steps.length === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>Updated {formatTimeAgo(c.updated_at)}</span>
                    <span>·</span>
                    <span>
                      Halt on engagement: <strong>{c.halt_on_engagement ? 'yes' : 'no'}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Halt on opt-out: <strong>{c.halt_on_optout ? 'yes' : 'no'}</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(c)}
                  className="p-2 rounded-lg hover:bg-surface-secondary"
                  title={c.is_active ? 'Pause cadence' : 'Activate cadence'}
                >
                  {c.is_active ? (
                    <ToggleRight className="w-5 h-5 text-th-accent-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-th-text-tertiary" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="px-3 py-2 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary flex items-center gap-1"
                >
                  Edit <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <CadenceEditor
            cadence={editing}
            onClose={() => setEditing(null)}
            masterTemplates={masterTemplates}
            onSave={handleSave}
          />
        )}
      </div>
    </PermissionGate>
  );
}

// ----------------------------------------------------------------------------
// Editor — modal with cadence header + step list. Steps are reorderable by
// `step` index (the integer the runner uses); deleting a step renumbers the
// rest. Reordering UI is intentionally simple (move up / down) to keep the
// scope small for v1; drag-and-drop can come later.
// ----------------------------------------------------------------------------
function CadenceEditor({
  cadence,
  onClose,
  onSave,
  masterTemplates,
}: {
  cadence: Cadence;
  onClose: () => void;
  onSave: (c: Cadence) => void | Promise<void>;
  masterTemplates: MasterTemplateLite[];
}) {
  const [draft, setDraft] = useState<Cadence>({ ...cadence });
  const [saving, setSaving] = useState(false);

  const orderedSteps = useMemo(
    () => [...draft.steps].sort((a, b) => a.step - b.step),
    [draft.steps],
  );

  const updateStep = (idx: number, patch: Partial<CadenceStep>) => {
    const next = [...draft.steps];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, steps: renumber(next) });
  };

  const addStep = () => {
    const lastOffset =
      orderedSteps.length > 0 ? orderedSteps[orderedSteps.length - 1].day_offset : 0;
    const next: CadenceStep = {
      step: draft.steps.length + 1,
      channel: 'email',
      template_id: null,
      day_offset: lastOffset + 3,
      halt_on_engagement: true,
      description: '',
    };
    setDraft({ ...draft, steps: renumber([...draft.steps, next]) });
  };

  const removeStep = (idx: number) => {
    const next = draft.steps.filter((_, i) => i !== idx);
    setDraft({ ...draft, steps: renumber(next) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-th-border px-6 py-4">
          <h2 className="text-base font-semibold text-th-text-primary">Edit Cadence</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-surface-secondary"
          >
            <X className="w-4 h-4 text-th-text-secondary" />
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
          </div>

          {/* Halt flags */}
          <div className="flex flex-wrap gap-4 text-xs text-th-text-secondary">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.halt_on_engagement}
                onChange={(e) => setDraft({ ...draft, halt_on_engagement: e.target.checked })}
                className="rounded border-th-border"
              />
              Halt on engagement (reply, click, booking)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.halt_on_optout}
                onChange={(e) => setDraft({ ...draft, halt_on_optout: e.target.checked })}
                className="rounded border-th-border"
              />
              Halt on opt-out keyword
            </label>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Steps
              </label>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
              >
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </div>
            {orderedSteps.length === 0 ? (
              <div className="text-xs text-th-text-tertiary border border-dashed border-th-border rounded-lg p-4 text-center">
                No steps yet. Add an Email / SMS / Phone touch.
              </div>
            ) : (
              <ul className="space-y-2">
                {orderedSteps.map((s, i) => {
                  const Icon = CHANNEL_ICON[s.channel];
                  const channelTemplates = masterTemplates.filter((t) =>
                    s.channel === 'phone'
                      ? t.channel === 'phone_script'
                      : t.channel === s.channel,
                  );
                  return (
                    <li
                      key={i}
                      className="border border-th-border rounded-xl p-3 bg-surface-secondary/40"
                    >
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-th-accent-50 text-th-accent-700 text-xs font-semibold flex items-center justify-center">
                            {s.step}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <label className="text-[11px] text-th-text-tertiary">Channel</label>
                          <select
                            value={s.channel}
                            onChange={(e) =>
                              updateStep(i, {
                                channel: e.target.value as CadenceChannel,
                                template_id: null,
                              })
                            }
                            className="w-full mt-0.5 border border-th-border rounded-md px-2 py-1.5 text-xs bg-surface-primary"
                          >
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="phone">Phone</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[11px] text-th-text-tertiary">Day offset</label>
                          <input
                            type="number"
                            min={0}
                            value={s.day_offset}
                            onChange={(e) =>
                              updateStep(i, {
                                day_offset: Math.max(0, Number(e.target.value || 0)),
                              })
                            }
                            className="w-full mt-0.5 border border-th-border rounded-md px-2 py-1.5 text-xs bg-surface-primary"
                          />
                        </div>
                        <div className="col-span-5">
                          <label className="text-[11px] text-th-text-tertiary">
                            Master template ({CHANNEL_LABEL[s.channel]})
                          </label>
                          <select
                            value={s.template_id ?? ''}
                            onChange={(e) =>
                              updateStep(i, { template_id: e.target.value || null })
                            }
                            className="w-full mt-0.5 border border-th-border rounded-md px-2 py-1.5 text-xs bg-surface-primary"
                          >
                            <option value="">— None (placeholder) —</option>
                            {channelTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                                {t.subject ? ` — ${t.subject}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeStep(i)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            title="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="col-span-12">
                          <label className="text-[11px] text-th-text-tertiary">Description</label>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-th-accent-600" />
                            <input
                              type="text"
                              value={s.description ?? ''}
                              onChange={(e) => updateStep(i, { description: e.target.value })}
                              placeholder="Description for the rep dashboard"
                              className="flex-1 border border-th-border rounded-md px-2 py-1 text-xs bg-surface-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-th-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Cadence'}
          </button>
        </div>
      </div>
    </div>
  );
}

function renumber(steps: CadenceStep[]): CadenceStep[] {
  return [...steps]
    .sort((a, b) => a.day_offset - b.day_offset)
    .map((s, i) => ({ ...s, step: i + 1 }));
}
