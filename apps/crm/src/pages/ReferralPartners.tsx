import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type { PartnerType, ReferralPartnerInput } from '@mpbhealth/crm-core';

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

const defaultForm: ReferralPartnerInput = {
  name: '',
  partner_type: 'other',
  company: '',
  email: '',
  phone: '',
  notes: '',
  is_active: true,
};

export default function ReferralPartners() {
  const { referralService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ReferralPartnerInput>(defaultForm);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.referralPartners(activeOrgId),
    queryFn: () => referralService.getPartners(false),
    enabled: !!activeOrgId,
  });

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (partnerTypeFilter !== 'all' && p.partner_type !== partnerTypeFilter) return false;
      if (activeFilter === 'active' && !p.is_active) return false;
      if (activeFilter === 'inactive' && p.is_active) return false;
      return true;
    });
  }, [partners, partnerTypeFilter, activeFilter]);

  const createMutation = useMutation({
    mutationFn: (input: ReferralPartnerInput) => referralService.createPartner(input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.referralPartners(activeOrgId) });
      setModalOpen(false);
      setForm(defaultForm);
      if (row) toast.success('Partner created');
      else toast.error('Could not create partner');
    },
    onError: () => toast.error('Could not create partner'),
  });

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    createMutation.mutate({
      ...form,
      name: form.name.trim(),
      company: form.company?.trim() || undefined,
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Referral partners"
        subtitle="Manage referral relationships and track partner activity."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 text-white px-4 py-2 text-sm font-medium hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            Add partner
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-th-border bg-surface-primary p-4">
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Type
          <select
            value={partnerTypeFilter}
            onChange={(e) => setPartnerTypeFilter(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            <option value="all">All types</option>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {PARTNER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Status
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-th-text-tertiary">No partners match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/referral-partners/${p.id}`)}
                    className="border-b border-th-border last:border-0 cursor-pointer hover:bg-th-accent-50/30 dark:hover:bg-th-accent-900/10"
                  >
                    <td className="px-4 py-3 font-medium text-th-text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{PARTNER_TYPE_LABELS[p.partner_type]}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{p.company || '—'}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{p.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {p.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            role="dialog"
            className="w-full max-w-lg rounded-xl border border-th-border bg-surface-primary shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-th-border px-4 py-3">
              <h2 className="text-base font-semibold text-th-text-primary">Add referral partner</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-th-text-tertiary hover:bg-th-accent-50 hover:text-th-text-primary"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitAdd} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Type</label>
                <select
                  value={form.partner_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partner_type: e.target.value as PartnerType }))
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
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Company</label>
                <input
                  value={form.company ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Phone</label>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-th-text-primary">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-th-border"
                />
                Active
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-th-border px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-th-accent-50/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
