import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type {
  PartnerType,
  ReferralPartnerInput,
  ReferralDirection,
  ReferralStatus,
} from '@mpbhealth/crm-core';

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  financial_advisor: 'Financial advisor',
  cpa: 'CPA',
  hr_consultant: 'HR consultant',
  attorney: 'Attorney',
  payroll_company: 'Payroll company',
  other: 'Other',
};

const PARTNER_TYPES: PartnerType[] = [
  'financial_advisor',
  'cpa',
  'hr_consultant',
  'attorney',
  'payroll_company',
  'other',
];

export default function ReferralPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const { referralService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const [logOpen, setLogOpen] = useState(false);
  const [direction, setDirection] = useState<ReferralDirection>('received');
  const [status, setStatus] = useState<ReferralStatus>('pending');
  const [notes, setNotes] = useState('');
  const [leadId, setLeadId] = useState('');

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: crmQueryKeys.referralPartner(activeOrgId, id ?? ''),
    queryFn: () => referralService.getPartner(id!),
    enabled: !!activeOrgId && !!id,
  });

  const { data: referralsResult, isLoading: loadingReferrals } = useQuery({
    queryKey: crmQueryKeys.referralsByPartner(activeOrgId, id ?? ''),
    queryFn: () => referralService.getReferrals({ partner_id: id }, 100, 0),
    enabled: !!activeOrgId && !!id,
  });

  const referrals = referralsResult?.referrals ?? [];

  const stats = useMemo(() => {
    let requested = 0;
    let received = 0;
    let converted = 0;
    for (const r of referrals) {
      if (r.direction === 'requested') requested++;
      if (r.direction === 'received') received++;
      if (r.status === 'converted') converted++;
    }
    return { requested, received, converted };
  }, [referrals]);

  const [editForm, setEditForm] = useState<ReferralPartnerInput | null>(null);

  useEffect(() => {
    if (!partner) return;
    setEditForm({
      name: partner.name,
      partner_type: partner.partner_type,
      company: partner.company ?? '',
      email: partner.email ?? '',
      phone: partner.phone ?? '',
      notes: partner.notes ?? '',
      is_active: partner.is_active,
    });
  }, [partner?.id, partner?.updated_at]);

  const updateMutation = useMutation({
    mutationFn: (input: Partial<ReferralPartnerInput>) =>
      referralService.updatePartner(id!, input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.referralPartner(activeOrgId, id!) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.referralPartners(activeOrgId) });
      if (row) toast.success('Partner updated');
      else toast.error('Could not update partner');
    },
    onError: () => toast.error('Could not update partner'),
  });

  const createReferralMutation = useMutation({
    mutationFn: () =>
      referralService.createReferral({
        partner_id: id!,
        direction,
        status,
        notes: notes.trim() || undefined,
        lead_id: leadId.trim() || undefined,
      }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.referralsByPartner(activeOrgId, id!) });
      setLogOpen(false);
      setNotes('');
      setLeadId('');
      if (row) toast.success('Referral logged');
      else toast.error('Could not log referral');
    },
    onError: () => toast.error('Could not log referral'),
  });

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm?.name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateMutation.mutate({
      name: editForm.name.trim(),
      partner_type: editForm.partner_type,
      company: editForm.company?.trim() || undefined,
      email: editForm.email?.trim() || undefined,
      phone: editForm.phone?.trim() || undefined,
      notes: editForm.notes?.trim() || undefined,
      is_active: editForm.is_active,
    });
  };

  if (!id) {
    return <p className="text-th-text-tertiary">Missing partner id.</p>;
  }

  if (loadingPartner || !partner) {
    if (!loadingPartner && !partner) {
      return (
        <div className="space-y-4">
          <Link
            to="/referral-partners"
            className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to partners
          </Link>
          <p className="text-th-text-tertiary">Partner not found.</p>
        </div>
      );
    }
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/referral-partners"
          className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to partners
        </Link>
        <GradientHeader
          title={partner.name}
          subtitle={PARTNER_TYPE_LABELS[partner.partner_type]}
          actions={
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 text-white px-4 py-2 text-sm font-medium hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              Log referral
            </button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(['requested', 'received', 'converted'] as const).map((key) => (
          <div
            key={key}
            className="rounded-xl border border-th-border bg-surface-primary p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-th-text-tertiary">
              {key === 'requested' ? 'Requested' : key === 'received' ? 'Received' : 'Converted'}
            </p>
            <p className="mt-1 text-2xl font-semibold text-th-text-primary tabular-nums">
              {key === 'requested'
                ? stats.requested
                : key === 'received'
                  ? stats.received
                  : stats.converted}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-th-text-primary">Partner details</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-th-text-tertiary">Company</dt>
            <dd className="text-th-text-primary">{partner.company || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Email</dt>
            <dd className="text-th-text-primary">{partner.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Phone</dt>
            <dd className="text-th-text-primary">{partner.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Status</dt>
            <dd className="text-th-text-primary">{partner.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
        {partner.notes && (
          <p className="text-sm text-th-text-secondary border-t border-th-border pt-3">{partner.notes}</p>
        )}
      </div>

      {editForm && (
        <form
          onSubmit={saveEdit}
          className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-th-text-primary">Edit partner</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev!, name: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Type</label>
              <select
                value={editForm.partner_type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev!,
                    partner_type: e.target.value as PartnerType,
                  }))
                }
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PARTNER_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-th-text-primary pt-6">
              <input
                type="checkbox"
                checked={editForm.is_active !== false}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev!, is_active: e.target.checked }))
                }
                className="rounded border-th-border"
              />
              Active
            </label>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Company</label>
              <input
                value={editForm.company ?? ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev!, company: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Email</label>
              <input
                value={editForm.email ?? ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev!, email: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Phone</label>
              <input
                value={editForm.phone ?? ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev!, phone: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
              <textarea
                rows={2}
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev!, notes: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        <div className="border-b border-th-border px-4 py-3">
          <h2 className="text-sm font-semibold text-th-text-primary">Referrals</h2>
        </div>
        {loadingReferrals ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : referrals.length === 0 ? (
          <p className="py-8 text-center text-sm text-th-text-tertiary">No referrals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-2 font-medium text-th-text-secondary">Direction</th>
                  <th className="text-left px-4 py-2 font-medium text-th-text-secondary">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-th-text-secondary">Lead</th>
                  <th className="text-left px-4 py-2 font-medium text-th-text-secondary">Created</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-th-border last:border-0">
                    <td className="px-4 py-2 text-th-text-primary capitalize">{r.direction}</td>
                    <td className="px-4 py-2 text-th-text-secondary capitalize">{r.status}</td>
                    <td className="px-4 py-2 text-th-text-secondary">
                      {r.lead_id ? (
                        <Link
                          to={`/leads/${r.lead_id}`}
                          className="text-th-accent-600 hover:underline"
                        >
                          View lead
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-th-text-tertiary text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-th-border bg-surface-primary shadow-xl">
            <div className="flex items-center justify-between border-b border-th-border px-4 py-3">
              <h2 className="text-base font-semibold text-th-text-primary">Log referral</h2>
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="rounded-lg p-1 text-th-text-tertiary hover:bg-th-accent-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as ReferralDirection)}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                >
                  <option value="received">Received</option>
                  <option value="requested">Requested</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReferralStatus)}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                >
                  {(['pending', 'contacted', 'converted', 'lost', 'declined'] as ReferralStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">
                  Lead ID (optional)
                </label>
                <input
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  placeholder="UUID"
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLogOpen(false)}
                  className="rounded-lg border border-th-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => createReferralMutation.mutate()}
                  disabled={createReferralMutation.isPending}
                  className="rounded-lg bg-th-accent-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {createReferralMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
