import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X,
  BarChart3, DollarSign, PieChart, TrendingUp,
  CheckSquare, Calendar, ClipboardCheck, Mail,
  Brain, Target, ArrowLeftRight, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import { HelpBanner } from '../components/help';
import type { CommunityEventInput, CommunityEventType } from '@mpbhealth/crm-core';
import {
  EventAnalyticsModal,
  EventROIModal,
  EventTypeBreakdownModal,
  EventTrendModal,
  BulkEventActionModal,
  EventCalendarModal,
  EventChecklistModal,
  EventFollowUpModal,
  EventOptimizationModal,
  EventLeadTrackerModal,
  EventComparisonModal,
  EventExportBuilderModal,
} from '../components/community-events';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const EVENT_TYPE_LABELS: Record<CommunityEventType, string> = {
  church_partnership: 'Church partnership',
  hydration_booth: 'Hydration booth',
  chamber_bni_sbdc: 'Chamber / BNI / SBDC',
  health_fair: 'Health fair',
  co_sponsored: 'Co-sponsored',
  other: 'Other',
};

const EVENT_TYPES: CommunityEventType[] = [
  'church_partnership',
  'hydration_booth',
  'chamber_bni_sbdc',
  'health_fair',
  'co_sponsored',
  'other',
];

const defaultForm: CommunityEventInput = {
  name: '',
  event_type: 'other',
  event_date: new Date().toISOString().slice(0, 10),
  location: '',
  contacts_captured: 0,
  leads_generated: 0,
  rep_id: '',
  notes: '',
};

export default function CommunityEvents() {
  const { communityEventService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CommunityEventInput>(defaultForm);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showROI, setShowROI] = useState(false);
  const [showTypeBreakdown, setShowTypeBreakdown] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [showLeadTracker, setShowLeadTracker] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'roi', label: 'ROI', icon: DollarSign, color: 'text-green-500', action: () => setShowROI(true) },
    { id: 'breakdown', label: 'By Type', icon: PieChart, color: 'text-violet-500', action: () => setShowTypeBreakdown(true) },
    { id: 'trends', label: 'Trends', icon: TrendingUp, color: 'text-amber-500', action: () => setShowTrend(true) },
    { id: 'bulk', label: 'Bulk Actions', icon: CheckSquare, color: 'text-pink-500', action: () => setShowBulkActions(true) },
    { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'text-cyan-500', action: () => setShowCalendar(true) },
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-emerald-500', action: () => setShowChecklist(true) },
    { id: 'followup', label: 'Follow-Up', icon: Mail, color: 'text-orange-500', action: () => setShowFollowUp(true) },
    { id: 'optimize', label: 'AI Strategy', icon: Brain, color: 'text-fuchsia-500', action: () => setShowOptimization(true) },
    { id: 'pipeline', label: 'Lead Tracker', icon: Target, color: 'text-red-500', action: () => setShowLeadTracker(true) },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight, color: 'text-teal-500', action: () => setShowComparison(true) },
    { id: 'export', label: 'Export', icon: Download, color: 'text-indigo-500', action: () => setShowExport(true) },
  ];

  const filters = useMemo(
    () => ({
      type: typeFilter === 'all' ? undefined : typeFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [typeFilter, dateFrom, dateTo]
  );

  const { data, isLoading } = useQuery({
    queryKey: [...crmQueryKeys.communityEvents(activeOrgId), filters] as const,
    queryFn: () => communityEventService.getEvents(filters, 100, 0),
    enabled: !!activeOrgId,
  });

  const events = data?.events ?? [];

  const createMutation = useMutation({
    mutationFn: (input: CommunityEventInput) => communityEventService.createEvent(input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.communityEvents(activeOrgId) });
      setModalOpen(false);
      setForm(defaultForm);
      if (row) toast.success('Event created');
      else toast.error('Could not create event');
    },
    onError: () => toast.error('Could not create event'),
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
      event_date: form.event_date,
      location: form.location?.trim() || undefined,
      rep_id: form.rep_id?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      contacts_captured: Number(form.contacts_captured) || 0,
      leads_generated: Number(form.leads_generated) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Community events"
        subtitle="Capture field activity, contacts, and leads from community presence."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 text-white px-4 py-2 text-sm font-medium hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            Add event
          </button>
        }
      />

      <HelpBanner pageKey="community-events" title="Welcome to Community Events" tip="Plan and track community outreach events. Log attendance, capture leads from events, and measure the ROI of your community engagement efforts." />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-th-border bg-surface-primary p-4">
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Type
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            <option value="all">All types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary"
          />
        </label>
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary"
          />
        </label>
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-sm text-th-text-tertiary">No events match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Location</th>
                  <th className="text-right px-4 py-3 font-medium text-th-text-secondary">Contacts</th>
                  <th className="text-right px-4 py-3 font-medium text-th-text-secondary">Leads</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Rep</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/community-events/${ev.id}`)}
                    className="border-b border-th-border last:border-0 cursor-pointer hover:bg-th-accent-50/30 dark:hover:bg-th-accent-900/10"
                  >
                    <td className="px-4 py-3 font-medium text-th-text-primary">{ev.name}</td>
                    <td className="px-4 py-3 text-th-text-secondary">{EVENT_TYPE_LABELS[ev.event_type]}</td>
                    <td className="px-4 py-3 text-th-text-secondary">
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-th-text-secondary">{ev.location || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-th-text-primary">
                      {ev.contacts_captured}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-th-text-primary">
                      {ev.leads_generated}
                    </td>
                    <td className="px-4 py-3 text-th-text-tertiary font-mono text-xs">
                      {ev.rep_id ? `${ev.rep_id.slice(0, 8)}…` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Event Power Modals ---- */}
      <EventAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} eventCount={events.length} />
      <EventROIModal open={showROI} onClose={() => setShowROI(false)} />
      <EventTypeBreakdownModal open={showTypeBreakdown} onClose={() => setShowTypeBreakdown(false)} />
      <EventTrendModal open={showTrend} onClose={() => setShowTrend(false)} />
      <BulkEventActionModal open={showBulkActions} onClose={() => setShowBulkActions(false)} />
      <EventCalendarModal open={showCalendar} onClose={() => setShowCalendar(false)} />
      <EventChecklistModal open={showChecklist} onClose={() => setShowChecklist(false)} />
      <EventFollowUpModal open={showFollowUp} onClose={() => setShowFollowUp(false)} />
      <EventOptimizationModal open={showOptimization} onClose={() => setShowOptimization(false)} />
      <EventLeadTrackerModal open={showLeadTracker} onClose={() => setShowLeadTracker(false)} />
      <EventComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
      <EventExportBuilderModal open={showExport} onClose={() => setShowExport(false)} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-th-border bg-surface-primary shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-th-border px-4 py-3 sticky top-0 bg-surface-primary">
              <h2 className="text-base font-semibold text-th-text-primary">Add community event</h2>
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
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Type</label>
                <select
                  value={form.event_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, event_type: e.target.value as CommunityEventType }))
                  }
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EVENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.event_date?.slice(0, 10) ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Location</label>
                <input
                  value={form.location ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1">
                    Contacts captured
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.contacts_captured ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contacts_captured: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1">
                    Leads generated
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.leads_generated ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, leads_generated: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Rep ID</label>
                <input
                  value={form.rep_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, rep_id: e.target.value }))}
                  placeholder="User UUID"
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-th-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-th-accent-600 px-4 py-2 text-sm text-white disabled:opacity-60"
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
