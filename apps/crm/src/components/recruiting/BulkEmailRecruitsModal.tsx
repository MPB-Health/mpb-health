import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, User, Loader2 } from 'lucide-react';
import { Modal } from '../Modal';
import toast from 'react-hot-toast';
import { useCRM } from '../../contexts/CRMContext';
import { useOrg } from '../../contexts/OrgContext';
import { supabase } from '../../lib/supabase';
import type { CRMTemplate } from '@mpbhealth/crm-core';

interface Props {
  open: boolean;
  onClose: () => void;
  recruitIds: string[];
  onSuccess: () => void;
}

interface RecruitLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  org_id: string;
}

interface MasterTemplateRow {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  version: number;
}

type Origin = 'master' | 'personal';

interface Picker {
  origin: Origin;
  id: string;
  name: string;
  subject: string | null;
  body: string;
}

// ----------------------------------------------------------------------------
// CRM rebuild Section 9 Round 5 — Recruiting clone parity
// ----------------------------------------------------------------------------
// Mirrors `BulkEmailModal` but loops through recruits and calls
// `send-crm-email-v2` with `recruit_id` so the audit trail (Daily Log +
// `crm_email_log.recruit_id`) attributes correctly. Master templates are
// the default for admin-curated mass sends; personal templates are the
// fallback. Recruiting and consumer-lead sends never share state — there
// is no `lead_id` on these rows.

export function BulkEmailRecruitsModal({ open, onClose, recruitIds, onSuccess }: Props) {
  const { templateService } = useCRM();
  const { activeOrgId } = useOrg();

  const [recruits, setRecruits] = useState<RecruitLite[]>([]);
  const [personal, setPersonal] = useState<CRMTemplate[]>([]);
  const [master, setMaster] = useState<MasterTemplateRow[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingTemplates(true);
      try {
        const recruitsReq = supabase
          .from('crm_recruiting_records')
          .select('id, first_name, last_name, email, org_id')
          .in('id', recruitIds);
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
        const [recruitsRes, personalRes, masterRes] = await Promise.all([
          recruitsReq,
          personalReq,
          masterReq,
        ]);
        if (cancelled) return;
        setRecruits(((recruitsRes as { data: RecruitLite[] | null }).data ?? []) ?? []);
        setPersonal(personalRes ?? []);
        const masterRows = ((masterRes as { data: MasterTemplateRow[] | null }).data ?? []) ?? [];
        setMaster(masterRows);
        if (masterRows.length > 0) setSelected(`master:${masterRows[0].id}`);
        else if ((personalRes ?? []).length > 0) setSelected(`personal:${personalRes![0].id}`);
        else setSelected('');
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, recruitIds, templateService, activeOrgId]);

  const picker: Picker | null = useMemo(() => {
    if (!selected) return null;
    const [origin, id] = selected.split(':') as [Origin, string];
    if (origin === 'master') {
      const row = master.find((t) => t.id === id);
      return row
        ? { origin, id: row.id, name: row.name, subject: row.subject, body: row.body }
        : null;
    }
    const row = personal.find((t) => t.id === id);
    return row
      ? { origin, id: row.id, name: row.name, subject: row.subject ?? null, body: row.body ?? '' }
      : null;
  }, [selected, master, personal]);

  const handleSend = async () => {
    if (!picker) {
      toast.error('Please select a template');
      return;
    }
    const targets = recruits.filter((r) => !!r.email);
    if (targets.length === 0) {
      toast.error('None of the selected recruits have an email on file.');
      return;
    }
    setSending(true);
    setProgress(0);

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setSending(false);
      toast.error('Not authenticated');
      return;
    }
    const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;

    let sent = 0;
    let failed = 0;
    const batchSize = 5;

    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (recruit) => {
          const fn = recruit.first_name ?? '';
          const ln = recruit.last_name ?? '';
          const subject = (picker.subject ?? '')
            .replace(/#firstname/gi, fn)
            .replace(/\{\{\s*first_?name\s*\}\}/gi, fn);
          const html = picker.body
            .replace(/#firstname/gi, fn)
            .replace(/\{\{\s*first_?name\s*\}\}/gi, fn)
            .replace(/#lastname/gi, ln)
            .replace(/\{\{\s*last_?name\s*\}\}/gi, ln);

          const res = await fetch(`${supabaseUrl}/functions/v1/send-crm-email-v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              to: [recruit.email],
              subject,
              html,
              org_id: recruit.org_id,
              recruit_id: recruit.id,
              template_id: picker.origin === 'personal' ? picker.id : undefined,
              master_template_id: picker.origin === 'master' ? picker.id : undefined,
              track_opens: true,
              track_clicks: true,
            }),
          });
          const result = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            error?: string;
          };
          if (!res.ok || result.success === false) {
            throw new Error(result.error || `Send failed (${res.status})`);
          }
          return recruit;
        }),
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          sent++;
        } else {
          failed++;
        }
      }
      setProgress(Math.min(i + batchSize, targets.length));
      if (i + batchSize < targets.length) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    setSending(false);
    setProgress(0);
    setSelected('');
    if (failed === 0) {
      toast.success(`Sent emails to ${sent} recruit${sent !== 1 ? 's' : ''}`);
    } else {
      toast.success(`Sent ${sent}, ${failed} failed`);
    }
    onSuccess();
    onClose();
  };

  const noEmailCount = recruitIds.length - recruits.filter((r) => !!r.email).length;

  return (
    <Modal open={open} onClose={onClose} title={`Send Email to ${recruitIds.length} Recruits`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Send a templated email to {recruitIds.length} selected recruit
          {recruitIds.length !== 1 ? 's' : ''}. Master templates are admin-curated and used for
          company-wide recruiting campaigns; personal templates are private to you. Sends are
          attributed on <code className="bg-surface-secondary rounded px-1 text-[11px]">crm_email_log.recruit_id</code> so
          they show up in the recruit timeline and Daily Log.
        </p>

        {noEmailCount > 0 && !loadingTemplates && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            {noEmailCount} recruit{noEmailCount !== 1 ? 's' : ''} in the selection don&apos;t have an email
            on file and will be skipped.
          </div>
        )}

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-6 text-th-text-tertiary">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading templates…
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Template
              </label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 bg-surface-primary"
              >
                <option value="">Select a template…</option>
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
            </div>

            {picker && (
              <div className="bg-surface-secondary rounded-lg p-4 border border-th-border">
                <div className="flex items-center gap-1.5 text-xs text-th-text-tertiary mb-1">
                  {picker.origin === 'master' ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-th-accent-600" />
                      <span>Master template</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      <span>Personal template</span>
                    </>
                  )}
                </div>
                <p className="text-sm font-medium text-th-text-primary">
                  {picker.subject || picker.name}
                </p>
                <p className="text-sm text-th-text-secondary mt-2 line-clamp-3">
                  {picker.body.replace(/<[^>]*>/g, '').slice(0, 240)}
                </p>
              </div>
            )}
          </>
        )}

        {sending && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-th-text-tertiary">
              <span>Sending emails…</span>
              <span>
                {progress} / {recruits.filter((r) => !!r.email).length}
              </span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-th-accent-600 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (progress /
                      Math.max(1, recruits.filter((r) => !!r.email).length)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !picker}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send Emails'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
