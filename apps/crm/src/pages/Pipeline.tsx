import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
  DollarSign,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCRM } from '../contexts/CRMContext';
import { useCelebration } from '../components/CelebrationSystem';
import { useGamification } from '../hooks/useGamification';
import { useOrg } from '../contexts/OrgContext';
import { PipelineFilters } from '../components/PipelineFilters';
import { PipelineVelocityBar, StuckLeadsAlert } from '../components/PipelineVelocity';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead, PipelineStage } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE_PER_COLUMN = 50;

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  healthshare: 'HS',
  traditional_insurance: 'TI',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function avgDaysInStage(leads: Lead[]): number {
  if (leads.length === 0) return 0;
  const now = Date.now();
  const total = leads.reduce((sum, l) => {
    const ref = l.stage_changed_at || l.created_at;
    return sum + (now - new Date(ref).getTime());
  }, 0);
  return Math.round(total / leads.length / (1000 * 60 * 60 * 24));
}

function stageValue(leads: Lead[]): number {
  return leads.reduce((sum, l) => sum + (l.premium_amount ?? 0), 0);
}

function scoreColor(score: number): string {
  if (score > 80) return 'bg-emerald-100 text-emerald-700';
  if (score > 50) return 'bg-amber-100 text-amber-700';
  if (score < 30) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function initialOf(name?: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function SkeletonBoard() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, colIdx) => (
        <div key={colIdx} className="flex-shrink-0 w-80">
          <div className="bg-surface-secondary/60 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-th-border" />
              <div className="h-4 w-24 bg-th-border rounded" />
              <div className="ml-auto h-5 w-8 bg-th-border rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-surface-primary rounded-xl p-4 space-y-2"
                >
                  <div className="h-4 w-3/4 bg-th-border rounded" />
                  <div className="h-3 w-1/2 bg-th-border/60 rounded" />
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-th-border-subtle">
                    <div className="h-3 w-16 bg-th-border/50 rounded" />
                    <div className="ml-auto h-5 w-5 rounded-full bg-th-border/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortableLeadCard
// ---------------------------------------------------------------------------

interface SortableLeadCardProps {
  lead: Lead;
  isDragOverlay?: boolean;
}

function SortableLeadCard({ lead, isDragOverlay }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardContent lead={lead} isDragOverlay={isDragOverlay} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeadCardContent (shared between inline and drag overlay)
// ---------------------------------------------------------------------------

function LeadCardContent({
  lead,
  isDragOverlay,
}: {
  lead: Lead;
  isDragOverlay?: boolean;
}) {
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const assignedName = lead.assigned_user?.full_name || lead.assigned_to;

  return (
    <div
      className={`
        group relative bg-surface-primary rounded-xl border border-th-border-subtle
        p-3.5 cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragOverlay
          ? 'shadow-2xl ring-2 ring-th-accent-400/40 rotate-[2deg] scale-105'
          : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
        }
      `}
    >
      <Link
        to={`/leads/${lead.id}`}
        className="block"
        onClick={(e) => {
          if (isDragOverlay) e.preventDefault();
        }}
        draggable={false}
      >
        {/* Top row: name + score */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-th-text-primary truncate">
              {fullName}
            </p>
            <p className="text-xs text-th-text-tertiary truncate mt-0.5">
              {lead.email}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lead.lead_score > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(lead.lead_score)}`}
              >
                {lead.lead_score}
              </span>
            )}
          </div>
        </div>

        {/* Badges row: plan type, priority */}
        <div className="flex items-center gap-1.5 mt-2">
          {lead.plan_type && PLAN_TYPE_LABELS[lead.plan_type] && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              {PLAN_TYPE_LABELS[lead.plan_type]}
            </span>
          )}
          {lead.priority && (
            <span className="flex items-center gap-1 text-[10px] text-th-text-secondary">
              <span
                className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[lead.priority] || 'bg-slate-300'}`}
              />
              {lead.priority}
            </span>
          )}
          {lead.premium_amount != null && lead.premium_amount > 0 && (
            <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5 ml-auto">
              <DollarSign className="w-2.5 h-2.5" />
              {lead.premium_amount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-surface-tertiary text-th-text-secondary px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {lead.tags.length > 2 && (
              <span className="text-[10px] text-th-text-tertiary">
                +{lead.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer: time + assigned avatar */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-th-border-subtle">
          <span className="text-[10px] text-th-text-tertiary flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatTimeAgo(lead.created_at)}
          </span>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/leads/workspace/${lead.id}`}
              className="text-[10px] text-th-accent-600 hover:text-th-accent-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              title="Open Workspace"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            >
              Work
            </Link>
            {assignedName ? (
              <div
                className="w-5 h-5 rounded-full bg-th-accent-100 text-th-accent-700 flex items-center justify-center text-[10px] font-bold"
                title={assignedName}
              >
                {initialOf(
                  lead.assigned_user?.full_name || lead.assigned_to
                )}
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-surface-tertiary text-th-text-tertiary flex items-center justify-center">
                <UserIcon className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Column
// ---------------------------------------------------------------------------

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  isOverTarget: boolean;
  isDragging: boolean;
}

function PipelineColumn({ stage, leads, isOverTarget, isDragging }: PipelineColumnProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleLeads = showAll ? leads : leads.slice(0, MAX_VISIBLE_PER_COLUMN);
  const hasMore = leads.length > MAX_VISIBLE_PER_COLUMN && !showAll;

  const value = stageValue(leads);
  const avgDays = avgDaysInStage(leads);

  let columnBg = 'bg-surface-secondary/60';
  if (stage.is_won_stage) columnBg = 'bg-gradient-to-b from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10';
  if (stage.is_lost_stage) columnBg = 'bg-gradient-to-b from-red-50/60 to-slate-100/40 dark:from-red-950/20 dark:to-slate-900/10';

  return (
    <div
      className={`
        flex-shrink-0 w-80 rounded-xl transition-all duration-200
        ${columnBg}
        ${isOverTarget
          ? 'ring-2 ring-offset-1 ring-offset-surface-primary'
          : ''
        }
      `}
      style={
        isOverTarget
          ? { boxShadow: `0 0 20px ${stage.color}30`, borderColor: stage.color }
          : undefined
      }
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 rounded-t-xl p-4 pb-3 backdrop-blur-sm bg-inherit">
        {/* Stage name row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-transparent"
              style={{ backgroundColor: stage.color, boxShadow: `0 0 6px ${stage.color}60` }}
            />
            <h3 className="font-semibold text-sm text-th-text-primary">
              {stage.display_name}
            </h3>
          </div>
          <span className="text-xs font-medium text-th-text-secondary bg-surface-primary/80 px-2 py-0.5 rounded-full border border-th-border-subtle">
            {leads.length}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-[11px] text-th-text-tertiary">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(value)}
          </span>
          {leads.length > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{avgDays}d avg
            </span>
          )}
        </div>

        <div className="mt-2 border-b border-th-border-subtle" />
      </div>

      {/* Card list */}
      <div className="p-4 pt-2">
        <SortableContext
          id={stage.name}
          items={visibleLeads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5 min-h-[120px]">
            {visibleLeads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} />
            ))}

            {leads.length === 0 && (
              <div
                className={`
                  text-center py-10 rounded-lg border-2 border-dashed
                  transition-colors duration-200
                  ${isDragging
                    ? 'border-th-accent-300 bg-th-accent-50/30 text-th-accent-500'
                    : 'border-th-border text-th-text-tertiary'
                  }
                `}
              >
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop leads here' : 'No leads in this stage'}
                </p>
              </div>
            )}
          </div>
        </SortableContext>

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-3 py-2 text-xs font-medium text-th-accent-600 hover:text-th-accent-700 bg-surface-primary/60 rounded-lg border border-th-border-subtle hover:bg-surface-primary transition-colors"
          >
            Show {leads.length - MAX_VISIBLE_PER_COLUMN} more leads
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Page
// ---------------------------------------------------------------------------

export default function Pipeline() {
  const {
    leadService,
    activityService,
    pipelineStages,
    refreshDashboard,
    automationService,
  } = useCRM();
  const { celebrate } = useCelebration();
  const { activeOrgId } = useOrg();
  const { earnXP } = useGamification();

  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterFn, setFilterFn] = useState<((lead: Lead) => boolean) | null>(null);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // ----- Sensors -----
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // ----- Data loading -----
  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { grouped } = await leadService.getLeadsByStage();
    setLeadsByStage(grouped);
    setLoading(false);
  }, [leadService]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // ----- Derived stats -----
  const { totalLeads, totalValue, filteredByStage } = useMemo(() => {
    let count = 0;
    let value = 0;
    const filtered: Record<string, Lead[]> = {};

    for (const stage of pipelineStages) {
      const raw = leadsByStage[stage.name] || [];
      const stageLeads = filterFn ? raw.filter(filterFn) : raw;
      filtered[stage.name] = stageLeads;
      count += stageLeads.length;
      value += stageValue(stageLeads);
    }

    return { totalLeads: count, totalValue: value, filteredByStage: filtered };
  }, [leadsByStage, filterFn, pipelineStages]);

  // ----- DnD handlers -----

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead;
    setActiveLead(lead);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (!overId) {
      setOverColumnId(null);
      return;
    }

    const overStage = pipelineStages.find((s) => s.name === overId);
    if (overStage) {
      setOverColumnId(overStage.name);
      return;
    }

    for (const stage of pipelineStages) {
      const stageLeads = leadsByStage[stage.name] || [];
      if (stageLeads.some((l) => l.id === overId)) {
        setOverColumnId(stage.name);
        return;
      }
    }

    setOverColumnId(null);
  }, [pipelineStages, leadsByStage]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    setOverColumnId(null);

    if (!over) return;

    const draggedLead = active.data.current?.lead as Lead;
    if (!draggedLead) return;

    let targetStageName: string | null = null;

    const directStage = pipelineStages.find((s) => s.name === (over.id as string));
    if (directStage) {
      targetStageName = directStage.name;
    } else {
      for (const stage of pipelineStages) {
        const stageLeads = leadsByStage[stage.name] || [];
        if (stageLeads.some((l) => l.id === over.id)) {
          targetStageName = stage.name;
          break;
        }
      }
    }

    if (!targetStageName || draggedLead.pipeline_stage === targetStageName) return;

    const originalStage = draggedLead.pipeline_stage;
    const targetStageObj = pipelineStages.find((s) => s.name === targetStageName);
    const originalStageObj = pipelineStages.find((s) => s.name === originalStage);
    const leadName = `${draggedLead.first_name} ${draggedLead.last_name}`;

    setLeadsByStage((prev) => {
      const next = { ...prev };
      next[originalStage] = (next[originalStage] || []).filter(
        (l) => l.id !== draggedLead.id
      );
      if (!next[targetStageName!]) next[targetStageName!] = [];
      next[targetStageName!] = [
        { ...draggedLead, pipeline_stage: targetStageName! },
        ...next[targetStageName!],
      ];
      return next;
    });

    try {
      const result = await leadService.updateLeadStage(draggedLead.id, targetStageName);

      if (!result.success) throw new Error('Update failed');

      await activityService.logStageChange(draggedLead.id, originalStage, targetStageName);

      automationService
        .evaluateEvent({
          type: 'stage_change',
          leadId: draggedLead.id,
          data: { from: originalStage, to: targetStageName },
        })
        .catch(console.error);

      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.LEAD_STAGE_CHANGED,
        entityType: 'lead',
        entityId: draggedLead.id,
        objectName: leadName,
        before: { stage: originalStageObj?.display_name },
        after: { stage: targetStageObj?.display_name },
      }).catch(console.error);

      if (targetStageObj?.is_won_stage) {
        celebrate('stage_won', `${leadName} moved to Won!`);
        earnXP('deal_won', 'lead', active.id as string, `Won: ${leadName}`);
      } else {
        earnXP('stage_advanced', 'lead', active.id as string, `${leadName} → ${targetStageObj?.display_name}`);
      }

      toast.success(
        `Moved ${leadName} to ${targetStageObj?.display_name ?? targetStageName}`
      );

      refreshDashboard();
    } catch {
      loadLeads();
      toast.error('Failed to update stage — reverted');
    }
  }, [
    pipelineStages,
    leadsByStage,
    leadService,
    activityService,
    automationService,
    activeOrgId,
    celebrate,
    refreshDashboard,
    loadLeads,
  ]);

  // ----- Render -----

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            Pipeline
            <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-th-accent-500 to-indigo-500">
              ●
            </span>
          </h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''}{' '}
            <span className="mx-1 text-th-border">·</span>
            {formatCurrency(totalValue)} pipeline value
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-surface-secondary rounded-lg border border-th-border p-0.5">
            <button
              className="p-1.5 rounded bg-surface-primary shadow-sm text-th-text-primary"
              title="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded text-th-text-tertiary cursor-not-allowed opacity-50"
              disabled
              title="List view (coming soon)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || filterFn
                  ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                  : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {filterFn && (
                <span className="w-1.5 h-1.5 rounded-full bg-th-accent-500" />
              )}
            </button>
            {showFilters && (
              <PipelineFilters onFilter={(fn) => setFilterFn(() => fn)} />
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={loadLeads}
            className="flex items-center gap-2 px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Velocity Metrics ─────────────────────────────────── */}
      <PipelineVelocityBar />
      <StuckLeadsAlert />

      {/* ── Board ────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonBoard />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
            {pipelineStages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                leads={filteredByStage[stage.name] || []}
                isOverTarget={overColumnId === stage.name}
                isDragging={!!activeLead}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeLead && (
              <div className="w-80">
                <LeadCardContent lead={activeLead} isDragOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
