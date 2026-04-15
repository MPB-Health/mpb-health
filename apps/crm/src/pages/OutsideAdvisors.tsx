import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X,
  BarChart3, Trophy, DollarSign, TrendingUp,
  CheckSquare, Wallet, ClipboardCheck, MapPin,
  Brain, Activity, ArrowLeftRight, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type { OutsideAdvisorInput } from '@mpbhealth/crm-core';
import {
  AdvisorAnalyticsModal,
  AdvisorLeaderboardModal,
  AdvisorProductionModal,
  AdvisorTrendModal,
  BulkAdvisorActionModal,
  AdvisorCompensationModal,
  AdvisorOnboardingModal,
  AdvisorTerritoryModal,
  AdvisorMatchModal,
  AdvisorPerformanceModal,
  AdvisorComparisonModal,
  AdvisorExportBuilderModal,
} from '../components/outside-advisors';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const defaultForm: OutsideAdvisorInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  is_active: true,
};

export default function OutsideAdvisors() {
  const { outsideAdvisorService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<OutsideAdvisorInput>(defaultForm);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTerritory, setShowTerritory] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-amber-500', action: () => setShowLeaderboard(true) },
    { id: 'production', label: 'Production', icon: DollarSign, color: 'text-green-500', action: () => setShowProduction(true) },
    { id: 'trends', label: 'Trends', icon: TrendingUp, color: 'text-violet-500', action: () => setShowTrend(true) },
    { id: 'bulk', label: 'Bulk Actions', icon: CheckSquare, color: 'text-pink-500', action: () => setShowBulkActions(true) },
    { id: 'compensation', label: 'Compensation', icon: Wallet, color: 'text-cyan-500', action: () => setShowCompensation(true) },
    { id: 'onboarding', label: 'Onboarding', icon: ClipboardCheck, color: 'text-emerald-500', action: () => setShowOnboarding(true) },
    { id: 'territory', label: 'Territory', icon: MapPin, color: 'text-orange-500', action: () => setShowTerritory(true) },
    { id: 'match', label: 'AI Match', icon: Brain, color: 'text-fuchsia-500', action: () => setShowMatch(true) },
    { id: 'performance', label: 'Performance', icon: Activity, color: 'text-red-500', action: () => setShowPerformance(true) },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight, color: 'text-teal-500', action: () => setShowComparison(true) },
    { id: 'export', label: 'Export', icon: Download, color: 'text-indigo-500', action: () => setShowExport(true) },
  ];

  const { data: advisors = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.outsideAdvisors(activeOrgId),
    queryFn: () => outsideAdvisorService.getAdvisors(false),
    enabled: !!activeOrgId,
  });

  const createMutation = useMutation({
    mutationFn: (input: OutsideAdvisorInput) => outsideAdvisorService.createAdvisor(input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.outsideAdvisors(activeOrgId) });
      setModalOpen(false);
      setForm(defaultForm);
      if (row) toast.success('Advisor created');
      else toast.error('Could not create advisor');
    },
    onError: () => toast.error('Could not create advisor'),
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
        title="Outside advisors"
        subtitle="Track advisor relationships and sourced production."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 text-white px-4 py-2 text-sm font-medium hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            Add advisor
          </button>
        }
      />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : advisors.length === 0 ? (
          <p className="py-12 text-center text-sm text-th-text-tertiary">No outside advisors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Active</th>
                </tr>
              </thead>
              <tbody>
                {advisors.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/outside-advisors/${a.id}`)}
                    className="border-b border-th-border last:border-0 cursor-pointer hover:bg-th-accent-50/30 dark:hover:bg-th-accent-900/10"
                  >
                    <td className="px-4 py-3 font-medium text-th-text-primary">{a.name}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{a.company || '—'}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{a.email || '—'}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{a.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {a.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Advisor Power Modals ---- */}
      <AdvisorAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} advisorCount={advisors.length} />
      <AdvisorLeaderboardModal open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <AdvisorProductionModal open={showProduction} onClose={() => setShowProduction(false)} />
      <AdvisorTrendModal open={showTrend} onClose={() => setShowTrend(false)} />
      <BulkAdvisorActionModal open={showBulkActions} onClose={() => setShowBulkActions(false)} />
      <AdvisorCompensationModal open={showCompensation} onClose={() => setShowCompensation(false)} />
      <AdvisorOnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <AdvisorTerritoryModal open={showTerritory} onClose={() => setShowTerritory(false)} />
      <AdvisorMatchModal open={showMatch} onClose={() => setShowMatch(false)} />
      <AdvisorPerformanceModal open={showPerformance} onClose={() => setShowPerformance(false)} />
      <AdvisorComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
      <AdvisorExportBuilderModal open={showExport} onClose={() => setShowExport(false)} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-th-border bg-surface-primary shadow-xl">
            <div className="flex items-center justify-between border-b border-th-border px-4 py-3">
              <h2 className="text-base font-semibold text-th-text-primary">Add outside advisor</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-th-text-tertiary hover:bg-th-accent-50"
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
