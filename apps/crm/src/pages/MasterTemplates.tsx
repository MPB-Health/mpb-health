import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Search,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { PermissionGate } from '../components/PermissionGate';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 3 / Section 7
// ----------------------------------------------------------------------------
// Admin-only Master Template Library. Reps see references in cadence steps
// (Section 13) and through "Push to all reps" actions, but cannot edit master
// content. Versioning is preserved by inserting a NEW row that points its
// `parent_template_id` at the previous version, so cadence step `template_id`
// references stay stable.

type MasterTemplate = {
  id: string;
  org_id: string;
  channel: 'email' | 'sms' | 'phone_script';
  name: string;
  subject: string | null;
  body: string;
  version: number;
  parent_template_id: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
};

const CHANNEL_LABEL: Record<MasterTemplate['channel'], string> = {
  email: 'Email',
  sms: 'SMS',
  phone_script: 'Phone Script',
};

const CHANNEL_ICON: Record<MasterTemplate['channel'], typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  phone_script: Phone,
};

export default function MasterTemplates() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useOrg();
  const [channelFilter, setChannelFilter] = useState<'all' | MasterTemplate['channel']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Partial<MasterTemplate> | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['masterTemplates', activeOrgId, showArchived],
    enabled: !!activeOrgId,
    queryFn: async () => {
      let query = supabase
        .from('crm_master_templates')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('updated_at', { ascending: false });

      if (!showArchived) query = query.is('archived_at', null);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MasterTemplate[];
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
      if (searchTerm) {
        const needle = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(needle) ||
          (t.subject ?? '').toLowerCase().includes(needle) ||
          t.body.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [templates, channelFilter, searchTerm]);

  // ── Mutations ──────────────────────────────────────────────────────────

  const handleSave = async (input: Partial<MasterTemplate>) => {
    if (!activeOrgId) return;
    if (!input.name || !input.body) {
      toast.error('Name and body are required');
      return;
    }
    if (input.channel === 'email' && !input.subject) {
      toast.error('Email templates need a subject');
      return;
    }

    if (input.id) {
      // Update existing — bumps version + parent pointer for traceability.
      // We update in place rather than insert-new so the row's `id` is the
      // stable identifier cadence steps can reference. The `version`
      // counter still ticks so admins can audit edits.
      const { error } = await supabase
        .from('crm_master_templates')
        .update({
          name: input.name,
          subject: input.subject ?? null,
          body: input.body,
          channel: input.channel,
          tags: input.tags ?? [],
          version: (input.version ?? 1) + 1,
        })
        .eq('id', input.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Template updated');
    } else {
      const { error } = await supabase.from('crm_master_templates').insert({
        org_id: activeOrgId,
        channel: input.channel ?? 'email',
        name: input.name,
        subject: input.subject ?? null,
        body: input.body,
        tags: input.tags ?? [],
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Template created');
    }
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['masterTemplates', activeOrgId] });
  };

  const handleArchiveToggle = async (t: MasterTemplate) => {
    const { error } = await supabase
      .from('crm_master_templates')
      .update({ archived_at: t.archived_at ? null : new Date().toISOString() })
      .eq('id', t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.archived_at ? 'Restored' : 'Archived');
    queryClient.invalidateQueries({ queryKey: ['masterTemplates', activeOrgId] });
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <PermissionGate permission="templates.master.manage">
      <div className="space-y-6">
        <GradientHeader
          title="Master Template Library"
          subtitle="Admin-controlled email, SMS, and phone scripts. Cadences and rep templates can reference these."
          icon={<ShieldCheck className="w-5 h-5" />}
          size="sm"
          actions={
            <button
              type="button"
              onClick={() =>
                setEditing({
                  channel: 'email',
                  name: '',
                  subject: '',
                  body: '',
                  tags: [],
                  version: 0,
                })
              }
              className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" /> New Master Template
            </button>
          }
        />

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg">
            {(['all', 'email', 'sms', 'phone_script'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannelFilter(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  channelFilter === c
                    ? 'bg-surface-primary text-th-accent-700 shadow-sm'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                {c === 'all' ? 'All' : CHANNEL_LABEL[c as MasterTemplate['channel']]}
              </button>
            ))}
          </div>
          <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, subject, or body…"
              className="w-full pl-9 pr-3 py-2 border border-th-border rounded-lg text-sm bg-surface-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-th-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-th-border"
            />
            Show archived
          </label>
        </div>

        {/* Template grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-th-text-tertiary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-primary border border-th-border rounded-2xl p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-th-text-primary">No master templates yet</p>
            <p className="text-xs text-th-text-tertiary mt-1">
              Master templates are admin-only. Reps reference them through cadences and "Push to all
              reps" actions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const Icon = CHANNEL_ICON[t.channel];
              return (
                <div
                  key={t.id}
                  className={`bg-surface-primary border rounded-2xl p-5 hover:shadow-md transition-all ${
                    t.archived_at ? 'border-th-border-subtle opacity-60' : 'border-th-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-th-accent-600" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-th-text-primary">{t.name}</p>
                        <p className="text-xs text-th-text-tertiary">
                          {CHANNEL_LABEL[t.channel]} · v{t.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(t)}
                        className="p-1.5 rounded hover:bg-surface-secondary"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-th-text-secondary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToggle(t)}
                        className="p-1.5 rounded hover:bg-surface-secondary"
                        title={t.archived_at ? 'Restore' : 'Archive'}
                      >
                        {t.archived_at ? (
                          <ArchiveRestore className="w-3.5 h-3.5 text-th-text-secondary" />
                        ) : (
                          <Archive className="w-3.5 h-3.5 text-th-text-secondary" />
                        )}
                      </button>
                    </div>
                  </div>
                  {t.subject && (
                    <p className="text-xs font-medium text-th-text-primary mb-1 truncate">
                      {t.subject}
                    </p>
                  )}
                  <p className="text-xs text-th-text-tertiary line-clamp-3">{t.body}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-th-border-subtle">
                    <span className="text-[11px] text-th-text-tertiary">
                      Updated {formatTimeAgo(t.updated_at)}
                    </span>
                    {t.tags?.length > 0 && (
                      <div className="flex gap-1">
                        {t.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] bg-surface-tertiary text-th-text-secondary px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor modal */}
        {editing && (
          <MasterTemplateEditor
            template={editing}
            onClose={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </div>
    </PermissionGate>
  );
}

// ----------------------------------------------------------------------------
// Editor modal — minimal create/edit form. Body is a plain textarea so admins
// can paste verbatim copy from the .docx without losing token characters
// (`#firstname`, `#yoursignature`, etc.). Token list is documented inline.
// ----------------------------------------------------------------------------
function MasterTemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template: Partial<MasterTemplate>;
  onClose: () => void;
  onSave: (t: Partial<MasterTemplate>) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<Partial<MasterTemplate>>({ ...template });
  const [saving, setSaving] = useState(false);

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
      <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-th-border px-6 py-4">
          <h2 className="text-base font-semibold text-th-text-primary">
            {template.id ? 'Edit Master Template' : 'New Master Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-surface-secondary"
          >
            <X className="w-4 h-4 text-th-text-secondary" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              Channel
            </label>
            <select
              value={draft.channel ?? 'email'}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  channel: e.target.value as MasterTemplate['channel'],
                })
              }
              className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="phone_script">Phone Script</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={draft.name ?? ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder='e.g. "Email #1"'
              className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            />
          </div>
          {draft.channel === 'email' && (
            <div>
              <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                value={draft.subject ?? ''}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="Subject line"
                className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Body
              </label>
              <span className="text-[11px] text-th-text-tertiary">
                Tokens: #firstname · #lastname · #plan · #quote price · #yoursignature
              </span>
            </div>
            <textarea
              value={draft.body ?? ''}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={10}
              placeholder="Paste the verbatim body. Supports plain HTML."
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary font-mono"
            />
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
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
