import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, User, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';
import type { CRMTemplate } from '@mpbhealth/crm-core';

interface Props {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

interface MasterTemplateRow {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  version: number;
}

// ----------------------------------------------------------------------------
// CRM rebuild Section 7 — Round 3 Addendum
// ----------------------------------------------------------------------------
// "Master templates are the source of truth for admin-driven mass sends
//  (mass email from the Leads list and any future company-wide campaigns)."
//
// Reps see their personal library; admins additionally see Master templates
// and the modal defaults the picker to a Master template. Per-rep templates
// remain available so an admin who's also a rep can pick either side. The
// chosen origin determines which send path runs:
//   • master  → emailService.sendFromMasterTemplate (stamps master_template_id)
//   • personal → emailService.sendFromTemplate (stamps template_id)
//
// Both paths route through the existing send-crm-email edge function.

type Origin = 'master' | 'personal';

interface Picker {
  origin: Origin;
  id: string;
  name: string;
  subject: string | null;
  body: string;
}

export function BulkEmailModal({ open, onClose, leadIds, onSuccess }: Props) {
  const { templateService, emailService } = useCRM();
  const { activeOrgId } = useOrg();

  const [personal, setPersonal] = useState<CRMTemplate[]>([]);
  const [master, setMaster] = useState<MasterTemplateRow[]>([]);
  const [selected, setSelected] = useState<string>(''); // "<origin>:<id>"
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
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
        // Default selection: first master template if any, else first personal.
        const masterRows = ((masterRes as { data: MasterTemplateRow[] | null }).data ?? []) ?? [];
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
  }, [open, templateService, activeOrgId]);

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
      ? {
          origin,
          id: row.id,
          name: row.name,
          subject: row.subject ?? null,
          body: row.body ?? '',
        }
      : null;
  }, [selected, master, personal]);

  const handleSend = async () => {
    if (!picker) {
      toast.error('Please select a template');
      return;
    }
    setSending(true);
    setProgress(0);
    const batchSize = 10;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batch = leadIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((leadId) =>
          picker.origin === 'master'
            ? emailService.sendFromMasterTemplate(picker.id, leadId)
            : emailService.sendFromTemplate(picker.id, leadId),
        ),
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success) sent++;
        else failed++;
      }
      setProgress(Math.min(i + batchSize, leadIds.length));
      if (i + batchSize < leadIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setSending(false);
    setProgress(0);
    setSelected('');
    if (failed === 0) {
      toast.success(`Sent emails to ${sent} lead${sent !== 1 ? 's' : ''}`);
    } else {
      toast.success(`Sent ${sent}, ${failed} failed`);
    }
    onSuccess();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Send Email to ${leadIds.length} Leads`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Send a templated email to {leadIds.length} selected lead
          {leadIds.length !== 1 ? 's' : ''}. Master templates are admin-curated and the source of
          truth for company-wide campaigns; personal templates are private to you.
        </p>

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
              {master.length === 0 && personal.length === 0 && (
                <p className="text-xs text-th-text-tertiary mt-1.5">
                  No email templates available. Create one in Templates → My Templates or ask an
                  admin to seed the Master Library.
                </p>
              )}
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
                {progress} / {leadIds.length}
              </span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-th-accent-600 rounded-full transition-all duration-300"
                style={{ width: `${(progress / leadIds.length) * 100}%` }}
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
