import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Mail,
  Phone,
  Upload,
  X,
  Users,
  Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useCRMService } from '../contexts/CRMServiceContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddLeadModal } from '../components/AddLeadModal';
import { AdvancedFiltersPanel } from '../components/AdvancedFiltersPanel';
import { BulkActionsToolbar } from '../components/BulkActionsToolbar';
import { BulkAssignModal } from '../components/BulkAssignModal';
import { BulkStageModal } from '../components/BulkStageModal';
import { BulkEmailModal } from '../components/BulkEmailModal';
import { ImportModal } from '../components/ImportModal';
import { MassUpdateModal } from '../components/MassUpdateModal';
import { MassTransferModal } from '../components/MassTransferModal';
import { MergeRecordsModal } from '../components/MergeRecordsModal';
import { TagManagerModal } from '../components/TagManagerModal';
import { ScoringRulesModal } from '../components/ScoringRulesModal';
import { EnrollCadenceModal } from '../components/EnrollCadenceModal';
import { LeadRowActionsMenu } from '../components/LeadRowActionsMenu';
import { SidePeek } from '../components/SidePeek';
import { SavedViewsBar } from '../components/SavedViewsBar';
import { useDebounce } from '../hooks/useDebounce';
import { useSavedViews } from '../hooks/useSavedViews';
import type { Lead, LeadFilters } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import { SkeletonTable, GradientHeader } from '@mpbhealth/ui';
import { HelpTooltip, HelpBanner } from '../components/help';

function formatLeadDue(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function LeadsList() {
  const { leadService, pipelineStages } = useCRM();
  const { supabase, scoringService } = useCRMService();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const pageSize = 20;
  // CRM rebuild Section 6 — subsection default is now 'all' (was 'working');
  // user's last selection persists per-rep via localStorage key.
  const [workflowTab, setWorkflowTab] = useState<
    'all' | 'working' | 'nurture' | 'linkedin' | 'do_not_contact'
  >(() => {
    if (typeof window === 'undefined') return 'all';
    const stored = window.localStorage.getItem('crm.leads.workflowTab');
    if (stored === 'all' || stored === 'working' || stored === 'nurture'
        || stored === 'linkedin' || stored === 'do_not_contact') {
      return stored;
    }
    return 'all';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('crm.leads.workflowTab', workflowTab);
    }
  }, [workflowTab]);
  // Default sort = last_activity_at desc (server-side generated column
  // = COALESCE(last_touched_at, created_at)). This puts brand-new leads at
  // the top by created_at while still ordering worked leads by their most
  // recent rep activity, so reps don't have to fall back to the dashboard
  // "Recent Leads" widget to find new submissions.
  const [listSort, setListSort] = useState<{
    by: NonNullable<LeadFilters['sortBy']>;
    dir: 'asc' | 'desc';
  }>({ by: 'last_activity_at', dir: 'desc' });

  const listFilters = useMemo(
    (): LeadFilters => ({
      ...filters,
      workflowSubsection: workflowTab === 'all' ? undefined : workflowTab,
      sortBy: listSort.by,
      sortDir: listSort.dir,
    }),
    [filters, workflowTab, listSort]
  );

  const cycleListSort = (col: NonNullable<LeadFilters['sortBy']>) => {
    setListSort((prev) => {
      if (prev.by !== col) {
        return { by: col, dir: col === 'assigned_to' ? 'asc' : 'desc' };
      }
      return { by: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
    setPage(0);
  };

  // Selection + existing bulk modals
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkStage, setShowBulkStage] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showEnrollCadence, setShowEnrollCadence] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [showMassTransfer, setShowMassTransfer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New bulk modals
  const [showMerge, setShowMerge] = useState(false);
  const [showBulkTags, setShowBulkTags] = useState(false);
  const [showScoringRules, setShowScoringRules] = useState(false);

  const savedViews = useSavedViews('leads');

  // ── Data queries ──

  const { data: leadsData, isLoading: loading } = useQuery({
    queryKey: ['crmLeadsList', listFilters, page, pageSize],
    queryFn: () => leadService.getLeads(listFilters, pageSize, page * pageSize),
    enabled: !!leadService,
    staleTime: 30_000,
  });

  const leads = leadsData?.leads ?? [];
  const total = leadsData?.total ?? 0;

  // Team members for MassTransfer
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['crmTeamMembers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('org_memberships')
        .select('user_id, role, profiles!inner(id, email, full_name, avatar_url)')
        .eq('status', 'active')
        .limit(100);
      return (data || []).map((m: Record<string, unknown>) => {
        const p = m.profiles as Record<string, unknown>;
        return {
          id: (p?.id || m.user_id) as string,
          name: (p?.full_name || p?.email || 'Unknown') as string,
          email: (p?.email || '') as string,
          avatar: (p?.avatar_url || '') as string,
          role: (m.role as string) || 'member',
          activeLeads: 0,
        };
      });
    },
    staleTime: 5 * 60_000,
  });

  const ownerById = useMemo(() => {
    const m = new Map<string, string>();
    teamMembers.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [teamMembers]);

  // Aggregate known tags across visible leads + a broader sample
  const allKnownTags = useMemo(() => {
    const tagSet = new Set<string>();
    leads.forEach((l) => (l.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [leads]);

  // Scoring rules for the config modal
  const { data: scoringWeights = [] } = useQuery({
    queryKey: ['crmScoringWeights'],
    queryFn: () => scoringService.getWeights(),
    staleTime: 60_000,
  });

  const scoringRulesForModal = useMemo(() =>
    scoringWeights
      .filter((w) => w.is_enabled)
      .map((w) => ({
        id: w.factor_key,
        field: w.factor_key,
        operator: 'is_set' as const,
        value: '',
        points: w.weight,
      })),
  [scoringWeights]);

  // ── Effects ──

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch || undefined }));
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    const source = savedViews.activeView || savedViews.activeSmartView;
    if (source) {
      const vf = source.filters as Record<string, unknown>;
      setFilters({
        search: debouncedSearch || undefined,
        stage: (vf.stage as string) || undefined,
        priority: (vf.priority as LeadFilters['priority']) || undefined,
        planType: (vf.planType as LeadFilters['planType']) || undefined,
        carrierId: (vf.carrierId as string) || undefined,
        dateFrom: (vf.dateFrom as string) || undefined,
      });
      setPage(0);
    }
  }, [savedViews.activeView, savedViews.activeSmartView, debouncedSearch]);

  useEffect(() => {
    setSelectedLeads(new Set());
  }, [listFilters, page]);

  // ── Handlers ──

  const handleStageFilter = (stage: string) => {
    setFilters((prev) => ({ ...prev, stage: stage || undefined }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const exportLeads = await leadService.getLeadsForExport(undefined, listFilters);
      const csv = leadService.generateCSV(exportLeads);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success(`Exported ${exportLeads.length} leads`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export leads');
    }
  };

  const handleExportSelected = async () => {
    try {
      const ids = Array.from(selectedLeads);
      const exportLeads = await leadService.getLeadsForExport(ids);
      const csv = leadService.generateCSV(exportLeads);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success(`Exported ${exportLeads.length} leads`);
    } catch (err) {
      console.error('Export selected failed:', err);
      toast.error('Failed to export selected leads');
    }
  };

  const toggleSelectAll = useCallback(() => {
    setSelectedLeads((prev) =>
      prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)),
    );
  }, [leads]);

  const toggleSelectLead = useCallback((leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      next.has(leadId) ? next.delete(leadId) : next.add(leadId);
      return next;
    });
  }, []);

  const handleBulkSuccess = () => {
    setSelectedLeads(new Set());
    queryClient.invalidateQueries({ queryKey: ['crmLeadsList'] });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedLeads);
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      const result = await leadService.bulkDeleteLeads(ids);
      if (result.success > 0 && result.failed === 0) {
        toast.success(`Deleted ${result.success} lead${result.success !== 1 ? 's' : ''}`);
      } else if (result.success > 0 && result.failed > 0) {
        toast.error(`Deleted ${result.success}, failed ${result.failed}. ${result.errors[0] || ''}`);
      } else {
        toast.error(result.errors[0] || 'No leads were deleted — you may not have permission');
      }
      setSelectedLeads(new Set());
      queryClient.invalidateQueries({ queryKey: ['crmLeadsList'] });
    } catch {
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Section 6 — bulk Mark Lost. Calls the new RPC for each selected lead so
  // do_not_contact, stage, subsection, lost_reason, and last_touched_at all
  // move atomically and the activity log records the action.
  const [showBulkMarkLost, setShowBulkMarkLost] = useState(false);
  const [bulkMarkLostReason, setBulkMarkLostReason] = useState('rep_marked_lost_bulk');
  const [bulkMarkingLost, setBulkMarkingLost] = useState(false);

  const handleBulkMarkLost = async () => {
    const ids = Array.from(selectedLeads);
    if (ids.length === 0) return;
    setBulkMarkingLost(true);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      const result = await leadService.markLeadLost(id, bulkMarkLostReason || 'rep_marked_lost_bulk');
      if (result.success) ok++;
      else fail++;
    }
    setBulkMarkingLost(false);
    setShowBulkMarkLost(false);
    if (ok > 0) toast.success(`Marked ${ok} lead${ok !== 1 ? 's' : ''} as Lost`);
    if (fail > 0) toast.error(`Failed to mark ${fail} lead${fail !== 1 ? 's' : ''}`);
    handleBulkSuccess();
  };

  const handleBulkTagApply = async (addTags: string[], removeTags: string[]) => {
    const ids = Array.from(selectedLeads);
    let ok = 0;
    for (const id of ids) {
      const lead = leads.find((l) => l.id === id);
      if (!lead) continue;
      const updated = [...(lead.tags || []).filter((t) => !removeTags.includes(t)), ...addTags];
      const unique = [...new Set(updated)];
      try {
        await leadService.updateLead(id, { tags: unique });
        ok++;
      } catch { /* continue */ }
    }
    if (ok > 0) toast.success(`Updated tags on ${ok} lead${ok !== 1 ? 's' : ''}`);
    handleBulkSuccess();
  };

  const handleScoringRulesSave = async (rules: Array<{ id: string; field: string; operator: string; value: string; points: number }>) => {
    const inputs = rules.map((r) => ({
      factor_key: r.id,
      weight: r.points,
      is_enabled: true,
    }));
    const result = await scoringService.updateWeights(inputs);
    if (result.success) {
      toast.success('Scoring rules updated');
      queryClient.invalidateQueries({ queryKey: ['crmScoringWeights'] });
    } else {
      toast.error(result.error || 'Failed to update scoring rules');
    }
  };

  // ── Merge helpers ──

  const selectedLeadObjects = useMemo(
    () => leads.filter((l) => selectedLeads.has(l.id)),
    [leads, selectedLeads],
  );

  const mergePrimary = selectedLeadObjects[0];
  const mergeDuplicates = selectedLeadObjects.slice(1);

  const toMergeRecord = (l: Lead) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name}`,
    email: l.email,
    phone: l.phone,
    createdAt: l.created_at,
    source: l.utm_source || l.source_cta || undefined,
    score: l.lead_score,
    fields: {
      first_name: l.first_name,
      last_name: l.last_name,
      email: l.email,
      phone: l.phone,
      pipeline_stage: l.pipeline_stage,
      priority: l.priority,
      zip_code: l.zip_code || '',
    },
  });

  const handleMerge = async (
    primaryId: string,
    mergedFields: Record<string, string>,
    duplicateIds: string[],
  ) => {
    try {
      await leadService.updateLead(primaryId, mergedFields);
      for (const dupId of duplicateIds) {
        await leadService.deleteLead(dupId);
      }
      toast.success(`Merged ${duplicateIds.length + 1} leads into one`);
      handleBulkSuccess();
      setShowMerge(false);
    } catch {
      toast.error('Failed to merge leads');
    }
  };

  // ── Computed ──

  const activeFilterCount = [
    filters.stage,
    filters.priority,
    filters.planType,
    filters.carrierId,
    filters.dateFrom,
    workflowTab === 'all' ? null : workflowTab,
  ].filter(Boolean).length;
  const selectedIds = Array.from(selectedLeads);
  const bulkEmailLeadIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const l = leads.find((x) => x.id === id);
        return !!(l && !l.do_not_contact);
      }),
    [selectedIds, leads],
  );
  const totalPages = Math.ceil(total / pageSize);

  // Tags of currently selected leads (union)
  const selectedLeadTags = useMemo(() => {
    const tags = new Set<string>();
    leads.filter((l) => selectedLeads.has(l.id)).forEach((l) => (l.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [leads, selectedLeads]);

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['crmLeadsList'] });

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={selectedLeads.size}
        onAssign={() => setShowBulkAssign(true)}
        onChangeStage={() => setShowBulkStage(true)}
        onSendEmail={() => {
          const skipped = selectedIds.length - bulkEmailLeadIds.length;
          if (skipped > 0) toast(`${skipped} Do Not Contact lead(s) skipped`);
          if (bulkEmailLeadIds.length === 0) {
            toast.error('No eligible leads for email');
            return;
          }
          setShowBulkEmail(true);
        }}
        onMassUpdate={() => setShowMassUpdate(true)}
        onMassTransfer={() => setShowMassTransfer(true)}
        onMerge={() => setShowMerge(true)}
        onTagManager={() => setShowBulkTags(true)}
        onMarkLost={() => setShowBulkMarkLost(true)}
        onEnrollCadence={() => setShowEnrollCadence(true)}
        onExport={handleExportSelected}
        onDelete={() => setShowDeleteConfirm(true)}
        onClear={() => setSelectedLeads(new Set())}
      />

      {/* ─── Page Header ─── */}
      <GradientHeader
        title="Leads"
        subtitle={`${total.toLocaleString()} total ${total === 1 ? 'lead' : 'leads'}`}
        icon={<Users className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScoringRules(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
              title="Lead Scoring Rules"
            >
              <Gauge className="w-4 h-4" />
              <span className="hidden sm:inline">Scoring</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <PermissionGate permission="leads.write">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            </PermissionGate>
            <PermissionGate permission="leads.create">
              <button
                onClick={() => setShowAddLead(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-600 rounded-xl text-sm font-medium text-white hover:bg-th-accent-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
            </PermissionGate>
          </div>
        }
      />

      <HelpBanner
        pageKey="leads"
        title="Welcome to Lead Management"
        tip="Use the search bar to find leads by name, email, or phone. Filter by stage, priority, or source to narrow results. Click any lead to view their full profile."
      />

      {/* ─── Saved Views ─── */}
      <div className="bg-surface-primary rounded-2xl border border-th-border">
        <SavedViewsBar
          views={savedViews.views}
          smartViews={savedViews.smartViews}
          activeViewId={savedViews.activeViewId}
          loading={savedViews.loading}
          onApplyView={savedViews.applyView}
          onSaveView={async (name, isShared) => {
            await savedViews.saveView(name, isShared, filters as Record<string, unknown>);
          }}
          onDeleteView={savedViews.deleteView}
          onSetDefault={savedViews.setDefault}
          onClearView={() => {
            savedViews.clearView();
            setFilters({ search: debouncedSearch || undefined });
            setPage(0);
          }}
        />
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="bg-surface-primary rounded-2xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or family member..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-surface-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-th-text-secondary placeholder-th-text-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-th-accent-500 transition-shadow"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filters.stage || ''}
              onChange={(e) => handleStageFilter(e.target.value)}
              aria-label="Filter by pipeline stage"
              className="appearance-none bg-surface-primary border border-th-border rounded-xl px-4 py-2.5 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500 transition-shadow"
            >
              <option value="">All Stages</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.name}>{stage.display_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-th-accent-600 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Workflow subsection bar ───
          CRM rebuild Section 6: evenly-spaced button row, default = All,
          active = filled, inactive = outline. Order locked: All / Working
          Leads / Nurture Leads / LinkedIn / Do Not Contact. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 px-1">
        {(
          [
            ['all', 'All'],
            ['working', 'Working Leads'],
            ['nurture', 'Nurture Leads'],
            ['linkedin', 'LinkedIn'],
            ['do_not_contact', 'Do Not Contact'],
          ] as const
        ).map(([key, label]) => {
          const active = workflowTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setWorkflowTab(key);
                setPage(0);
              }}
              aria-pressed={active}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors text-center ${
                active
                  ? 'bg-th-accent-600 border-th-accent-600 text-white shadow-sm'
                  : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {showFilters && (
        <AdvancedFiltersPanel
          filters={filters}
          onChange={(newFilters) => {
            setFilters((prev) => ({ ...prev, ...newFilters }));
            setPage(0);
          }}
        />
      )}

      {/* ─── Table ─── */}
      <div className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={8} />
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-th-text-tertiary">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium text-th-text-secondary">No leads found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-th-border">
                    <th className="w-12 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === leads.length && leads.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all leads"
                        className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => cycleListSort('assigned_to')}
                        className="inline-flex items-center gap-1 hover:text-th-text-secondary"
                      >
                        Lead owner
                        {listSort.by === 'assigned_to' ? (listSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        <HelpTooltip text="Rep assigned to this lead. Click to sort." size="sm" />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        Lead name
                        <HelpTooltip text="Click to open the lead profile." size="sm" />
                      </span>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        Contact
                        <HelpTooltip text="Email and phone on file." size="sm" />
                      </span>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        Next task
                        <HelpTooltip text="Next scheduled follow-up (next_followup_at)." size="sm" />
                      </span>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => cycleListSort('last_touched_at')}
                        className="inline-flex items-center gap-1 hover:text-th-text-secondary"
                      >
                        Last touched
                        {listSort.by === 'last_touched_at' ? (listSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        <HelpTooltip
                          text="Last rep-initiated activity (call/email/SMS/note/task complete/profile edit). Inbound replies and link clicks do NOT bump this — see Section 7 Round 3 Addendum. The list's default sort uses last activity (touch OR created), so new leads still appear at the top. Click this header to sort strictly by touch."
                          size="sm"
                        />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => cycleListSort('created_at')}
                        className="inline-flex items-center gap-1 hover:text-th-text-secondary"
                      >
                        Date created
                        {listSort.by === 'created_at' ? (listSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        <HelpTooltip text="When the lead entered the CRM." size="sm" />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => cycleListSort('pipeline_stage')}
                        className="inline-flex items-center gap-1 hover:text-th-text-secondary"
                      >
                        Status
                        {listSort.by === 'pipeline_stage' ? (listSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        <HelpTooltip text="Current pipeline stage." size="sm" />
                      </button>
                    </th>
                    <th className="w-12 px-2 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {leads.map((lead) => {
                    const stage = pipelineStages.find((s) => s.name === lead.pipeline_stage);
                    const isSelected = selectedLeads.has(lead.id);
                    const ownerLabel =
                      (lead.assigned_to && ownerById.get(lead.assigned_to)) || '—';

                    return (
                      <tr
                        key={lead.id}
                        className={`group transition-colors ${isSelected ? 'bg-th-accent-50' : 'hover:bg-surface-secondary'} ${
                          lead.do_not_contact ? 'opacity-75' : ''
                        }`}
                      >
                        <td className="w-12 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead.id)}
                            aria-label={`Select ${lead.first_name} ${lead.last_name}`}
                            className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-th-text-secondary max-w-[140px] truncate">
                          {ownerLabel}
                        </td>
                        <td className="px-6 py-4">
                          <SidePeek
                            entityType="lead"
                            entityId={lead.id}
                            href={`/leads/${lead.id}`}
                            data={{
                              id: lead.id,
                              type: 'lead',
                              name: `${lead.first_name} ${lead.last_name}`,
                              email: lead.email,
                              phone: lead.phone,
                              location: [lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ') || undefined,
                              stage: stage?.display_name || lead.pipeline_stage,
                              owner: ownerLabel !== '—' ? ownerLabel : undefined,
                              tags: lead.tags,
                              createdAt: lead.created_at,
                            }}
                          >
                            <Link to={`/leads/${lead.id}`} className="flex items-center gap-3.5">
                              <div className="w-10 h-10 bg-th-accent-50 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-th-accent-700 font-semibold text-sm">
                                  {lead.first_name.charAt(0)}
                                  {lead.last_name.charAt(0)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-th-text-primary group-hover:text-th-accent-600 truncate transition-colors">
                                  {lead.first_name} {lead.last_name}
                                </p>
                                {lead.linkedin_workflow_status && (
                                  <p className="text-xs text-sky-600 truncate">
                                    LI: {lead.linkedin_workflow_status}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </SidePeek>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 max-w-[200px]">
                            <a
                              href={`mailto:${lead.email}`}
                              className="flex items-center gap-1.5 text-sm text-th-text-secondary hover:text-th-accent-600 truncate transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-1.5 text-sm text-th-text-secondary hover:text-th-accent-600 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                {lead.phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-th-text-tertiary whitespace-nowrap">
                          {formatLeadDue(lead.next_followup_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-th-text-tertiary whitespace-nowrap">
                          {/* Section 6: rep-initiated activity timestamp.
                              Falls back to last_contacted_at for legacy rows
                              that haven't been bumped by a new activity yet. */}
                          {lead.last_touched_at
                            ? formatTimeAgo(lead.last_touched_at)
                            : lead.last_contacted_at
                              ? formatTimeAgo(lead.last_contacted_at)
                              : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-th-text-tertiary whitespace-nowrap">
                          {formatTimeAgo(lead.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}
                          >
                            {stage?.display_name || lead.pipeline_stage}
                          </span>
                        </td>
                        <td className="w-12 px-2 py-4">
                          <LeadRowActionsMenu
                            lead={lead}
                            allKnownTags={allKnownTags}
                            onRefresh={refreshList}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-th-border bg-surface-secondary/50">
                <p className="text-sm text-th-text-tertiary">
                  Showing <span className="font-medium text-th-text-secondary">{page * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-th-text-secondary">{Math.min((page + 1) * pageSize, total)}</span> of{' '}
                  <span className="font-medium text-th-text-secondary">{total.toLocaleString()}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3.5 py-1.5 text-sm font-medium border border-th-border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-primary transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-th-text-tertiary px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3.5 py-1.5 text-sm font-medium border border-th-border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-primary transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ──────────── Modals ──────────── */}

      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onSuccess={refreshList} />
      <BulkAssignModal open={showBulkAssign} onClose={() => setShowBulkAssign(false)} leadIds={selectedIds} onSuccess={handleBulkSuccess} />
      <BulkStageModal open={showBulkStage} onClose={() => setShowBulkStage(false)} leadIds={selectedIds} onSuccess={handleBulkSuccess} />
      <BulkEmailModal open={showBulkEmail} onClose={() => setShowBulkEmail(false)} leadIds={bulkEmailLeadIds} onSuccess={handleBulkSuccess} />
      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} entityType="leads" onSuccess={refreshList} />

      <MassUpdateModal
        open={showMassUpdate}
        onClose={() => setShowMassUpdate(false)}
        entityType="lead"
        selectedCount={selectedLeads.size}
        fields={[
          { name: 'pipeline_stage', label: 'Pipeline Stage', type: 'select', options: pipelineStages?.map((s) => ({ value: s.name, label: s.display_name })) || [] },
          { name: 'priority', label: 'Priority', type: 'select', options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }] },
          { name: 'source', label: 'Source', type: 'text' },
          { name: 'tags', label: 'Tags', type: 'text' },
          { name: 'workflow_subsection', label: 'Subsection', type: 'select', options: [{ value: 'working', label: 'Working' }, { value: 'nurture', label: 'Nurture' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'do_not_contact', label: 'Do Not Contact' }] },
          { name: 'assigned_to', label: 'Lead Owner', type: 'select', options: teamMembers.map((m) => ({ value: m.id, label: m.name })) },
          { name: 'plan_type', label: 'Plan Type', type: 'select', options: [{ value: 'healthshare', label: 'Healthshare' }, { value: 'traditional_insurance', label: 'Traditional Insurance' }] },
          { name: 'contact_preference', label: 'Contact Preference', type: 'select', options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }, { value: 'text', label: 'Text' }] },
        ]}
        onUpdate={async (updates) => {
          const fieldMap: Record<string, unknown> = {};
          updates.forEach((u) => { fieldMap[u.field] = u.value; });
          const result = await leadService.bulkUpdateLeads(selectedIds, fieldMap);
          if (result.failed > 0) {
            toast.error(`Updated ${result.success}, failed ${result.failed}`);
          } else {
            toast.success(`Updated ${result.success} lead${result.success !== 1 ? 's' : ''}`);
          }
          handleBulkSuccess();
        }}
      />

      <MassTransferModal
        open={showMassTransfer}
        onClose={() => setShowMassTransfer(false)}
        entityType="lead"
        selectedCount={selectedLeads.size}
        teamMembers={teamMembers}
        onTransfer={async (newOwnerId) => {
          for (const id of selectedIds) {
            await leadService.updateLead(id, { assigned_to: newOwnerId });
          }
          handleBulkSuccess();
        }}
      />

      {/* Merge (requires 2+ selected) */}
      {mergePrimary && mergeDuplicates.length > 0 && (
        <MergeRecordsModal
          open={showMerge}
          onClose={() => setShowMerge(false)}
          entityType="lead"
          primaryRecord={toMergeRecord(mergePrimary)}
          duplicates={mergeDuplicates.map(toMergeRecord)}
          onMerge={handleMerge}
        />
      )}

      {/* Bulk Tag Manager */}
      <TagManagerModal
        open={showBulkTags}
        onClose={() => setShowBulkTags(false)}
        entityType="lead"
        selectedCount={selectedLeads.size}
        currentTags={selectedLeadTags}
        allKnownTags={allKnownTags}
        onApply={handleBulkTagApply}
      />

      {/* Scoring Rules */}
      <ScoringRulesModal
        open={showScoringRules}
        onClose={() => setShowScoringRules(false)}
        entityType="lead"
        rules={scoringRulesForModal}
        onSave={handleScoringRulesSave}
      />

      {/* Cadence Enrollment — Phase 3 */}
      <EnrollCadenceModal
        open={showEnrollCadence}
        onClose={() => setShowEnrollCadence(false)}
        leadIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />

      {/* Bulk Mark as Lost — Section 6 / Round 5 */}
      {showBulkMarkLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">
              Mark {selectedLeads.size} Lead{selectedLeads.size !== 1 ? 's' : ''} as Lost?
            </h3>
            <p className="text-sm text-th-text-secondary mb-4">
              Each lead moves to Lost / Do Not Contact, is excluded from cadences, and the
              reason is logged in the audit trail.
            </p>
            <label htmlFor="bulk-mark-lost-reason" className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              Reason (logged on every lead)
            </label>
            <input
              id="bulk-mark-lost-reason"
              type="text"
              value={bulkMarkLostReason}
              onChange={(e) => setBulkMarkLostReason(e.target.value)}
              className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary mb-6"
              placeholder="rep_marked_lost_bulk"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkMarkLost(false)}
                disabled={bulkMarkingLost}
                className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMarkLost}
                disabled={bulkMarkingLost}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {bulkMarkingLost ? 'Marking…' : `Mark ${selectedLeads.size} Lost`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">
              Delete {selectedLeads.size} Lead{selectedLeads.size !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-th-text-secondary mb-6">
              This action cannot be undone. All associated activities, tasks, and notes for the selected leads will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
