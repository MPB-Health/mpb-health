import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Send, Loader2, ShieldCheck, User, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { useCRM } from '../../contexts/CRMContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import type { CRMTemplate } from '@mpbhealth/crm-core';

// ----------------------------------------------------------------------------
// CRM rebuild Section 9 Round 5 — Recruiting clone parity
// ----------------------------------------------------------------------------
// In-profile email composer for the Recruit Profile, mirroring
// `LeadProfileEmailTab` for consumer leads. Reps pick from per-rep
// "My Templates" or admin-curated Master Templates (`channel='email'`),
// the recipient is prefilled to the recruit's email, and the send routes
// through `send-crm-email-v2` with `recruit_id` so the audit trail
// (`crm_email_log.recruit_id`) attributes correctly. After the send we
// also write a `crm_activities` row with `related_to_type='recruiting'`
// so the Daily Log auto-capture trigger fires and the recruit's
// `last_touched_at` is bumped.
//
// The send pipeline does NOT cross over into consumer-lead state — there
// is no `lead_id` on these rows, so cadences and engagement signals
// remain isolated per spec ("Recruiting data stays fully separate from
// consumer Members and Leads — no commingling of records, lists, or
// sends.").

interface RecruitLite {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface RecentEmailRow {
  id: string;
  subject: string | null;
  to_email: string | null;
  body_preview: string | null;
  status: string | null;
  sent_at: string | null;
  master_template_id: string | null;
  template_id: string | null;
}

interface MasterTemplateRow {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  version: number;
}

type Origin = 'master' | 'personal' | 'blank';

interface PickerEntry {
  origin: Origin;
  id: string | null;
  name: string;
  subject: string | null;
  body: string;
}

interface Props {
  recruit: RecruitLite;
}

export function RecruitingProfileEmailTab({ recruit }: Props) {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const { templateService } = useCRM();
  const queryClient = useQueryClient();

  const [personal, setPersonal] = useState<CRMTemplate[]>([]);
  const [master, setMaster] = useState<MasterTemplateRow[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selected, setSelected] = useState<string>('blank:_');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTemplates(true);
      try {
        const personalReq = templateService.listTemplates();
        const masterReq = activeOrgId
          ? supabase
              .from('crm_master_templates')
              .select('id, name, subject, body, version')
              .eq('org_id', activeOrgId)
              .eq('channel', 'email')
              .is('archived_at', null)
              .order('name')
          : Promise.resolve({ data: [], error: null } as const);
        const [personalRes, masterRes] = await Promise.all([personalReq, masterReq]);
        if (cancelled) return;
        setPersonal(personalRes ?? []);
        setMaster(((masterRes as { data: MasterTemplateRow[] | null }).data ?? []) ?? []);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateService, activeOrgId]);

  const picker: PickerEntry | null = useMemo(() => {
    if (!selected) return null;
    const [origin, id] = selected.split(':') as [Origin, string];
    if (origin === 'blank') {
      return { origin, id: null, name: 'Blank email', subject: '', body: '' };
    }
    if (origin === 'master') {
      const row = master.find((t) => t.id === id);
      return row
        ? { origin, id: row.id, name: row.name, subject: row.subject, body: row.body }
        : null;
    }
    const row = personal.find((t) => t.id === id);
    return row
      ? {
          origin,
          id: row.id,
          name: row.name,
          subject: row.subject ?? null,
          body: row.body ?? '',
        }
      : null;
  }, [selected, master, personal]);

  // When the picker changes, prefill subject + body from the chosen
  // template. Token replacement: #firstname / {{first_name}} both fall
  // back to the recruit's first name so reps don't have to hand-edit.
  useEffect(() => {
    if (!picker) return;
    const fn = recruit.first_name || '';
    const ln = recruit.last_name || '';
    const subj = (picker.subject ?? '')
      .replace(/#firstname/gi, fn)
      .replace(/\{\{\s*first_?name\s*\}\}/gi, fn);
    const html = (picker.body ?? '')
      .replace(/#firstname/gi, fn)
      .replace(/\{\{\s*first_?name\s*\}\}/gi, fn)
      .replace(/#lastname/gi, ln)
      .replace(/\{\{\s*last_?name\s*\}\}/gi, ln);
    setSubject(subj);
    setBody(html);
  }, [picker, recruit.first_name, recruit.last_name]);

  const { data: recentEmails = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['recruitingEmails', recruit.id],
    enabled: !!recruit.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_email_log')
        .select('id, subject, to_email, body_preview, status, sent_at, master_template_id, template_id')
        .eq('recruit_id', recruit.id)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .limit(15);
      if (error) {
        console.warn('[RecruitingProfileEmailTab] email log query failed', error.message);
        return [] as RecentEmailRow[];
      }
      return (data ?? []) as RecentEmailRow[];
    },
    staleTime: 30_000,
  });

  const handleSend = async () => {
    if (!recruit.email) {
      toast.error('No email on file for this recruit');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body required');
      return;
    }
    if (!user?.id || !activeOrgId) return;
    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
      const res = await fetch(`${supabaseUrl}/functions/v1/send-crm-email-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: [recruit.email],
          subject,
          html: body,
          org_id: activeOrgId,
          recruit_id: recruit.id,
          template_id: picker?.origin === 'personal' ? picker.id : undefined,
          master_template_id: picker?.origin === 'master' ? picker.id : undefined,
          track_opens: true,
          track_clicks: true,
        }),
      });
      const result = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || result.success === false) {
        throw new Error(result.error || `Send failed (${res.status})`);
      }

      // Mirror the lead-side behaviour: log a crm_activities row keyed
      // to the recruit so the daily-log trigger fires and the recruit
      // timeline updates.
      await supabase.from('crm_activities').insert({
        org_id: activeOrgId,
        related_to_type: 'recruiting',
        related_to_id: recruit.id,
        activity_type: 'email',
        subject: `Email sent: ${subject}`,
        created_by: user.id,
        completed_at: new Date().toISOString(),
        metadata: {
          template_origin: picker?.origin ?? 'blank',
          template_id: picker?.id ?? null,
          to_email: recruit.email,
        },
      });
      await supabase
        .from('crm_recruiting_records')
        .update({ last_touched_at: new Date().toISOString(), last_contacted_at: new Date().toISOString() })
        .eq('id', recruit.id);

      toast.success('Email sent');
      setSubject('');
      setBody('');
      setSelected('blank:_');
      queryClient.invalidateQueries({ queryKey: ['recruitingEmails', recruit.id] });
      queryClient.invalidateQueries({ queryKey: ['recruitingRecord', recruit.id] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (!recruit.email) {
    return (
      <div className="text-center py-12">
        <Mail className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-th-text-secondary">
          No email on file for this recruit
        </p>
        <p className="text-xs text-th-text-tertiary mt-1">
          Add a primary email above to enable in-profile sending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="bg-surface-secondary/40 border border-th-border rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
          <Mail className="w-3.5 h-3.5" />
          <span>
            Compose email to {recruit.first_name} {recruit.last_name} ({recruit.email})
          </span>
        </div>

        {loadingTemplates ? (
          <div className="flex items-center gap-2 text-xs text-th-text-tertiary py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading templates…
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              Template
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              <option value="blank:_">Blank email</option>
              {master.length > 0 && (
                <optgroup label="Master Library (admin-curated)">
                  {master.map((t) => (
                    <option key={`master:${t.id}`} value={`master:${t.id}`}>
                      {t.name} (v{t.version})
                    </option>
                  ))}
                </optgroup>
              )}
              {personal.length > 0 && (
                <optgroup label="My Templates">
                  {personal.map((t) => (
                    <option key={`personal:${t.id}`} value={`personal:${t.id}`}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {picker && picker.origin !== 'blank' && (
              <div className="flex items-center gap-1.5 text-[11px] text-th-text-tertiary">
                {picker.origin === 'master' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-th-accent-600" />
                    <span>Master template (audit-attributed to library)</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" />
                    <span>Personal template</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
          rows={10}
          className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary font-mono"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSelected('blank:_');
              setSubject('');
              setBody('');
            }}
            disabled={sending}
            className="px-3 py-2 rounded-lg text-sm font-medium text-th-text-secondary border border-th-border hover:bg-surface-secondary"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent recruit-attributed emails */}
      <div>
        <h3 className="text-sm font-semibold text-th-text-primary mb-3">Recent emails</h3>
        {loadingRecent ? (
          <div className="text-xs text-th-text-tertiary">Loading…</div>
        ) : recentEmails.length === 0 ? (
          <div className="text-xs text-th-text-tertiary">
            No emails logged for this recruit yet. New sends will appear here automatically.
          </div>
        ) : (
          <ul className="space-y-2">
            {recentEmails.map((m) => (
              <li
                key={m.id}
                className="border border-th-border rounded-xl p-3 bg-surface-primary"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-medium text-th-text-secondary truncate">
                    → {m.to_email}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-th-text-tertiary shrink-0">
                    {m.master_template_id && (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> master
                      </span>
                    )}
                    {m.template_id && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" /> personal
                      </span>
                    )}
                    <span>{m.sent_at ? formatTimeAgo(m.sent_at) : '—'}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-th-text-primary truncate">
                  {m.subject || '(no subject)'}
                </div>
                {m.body_preview && (
                  <div className="text-xs text-th-text-tertiary line-clamp-2 mt-1">
                    {m.body_preview}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wider text-th-text-tertiary mt-1.5">
                  {m.status || 'sent'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RecruitingProfileEmailTab;
