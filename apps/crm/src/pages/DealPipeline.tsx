import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Plus, DollarSign, Layers,
  BarChart3, AlertTriangle, TrendingUp, Clock,
  ArrowRight, Zap, RotateCcw, Target,
  ArrowLeftRight, Camera, Sparkles,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddDealModal } from '../components/AddDealModal';
import { DealCard } from '../components/DealCard';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { DealWithRelations, DealStage } from '@mpbhealth/crm-core';
import { HelpTooltip, HelpBanner } from '../components/help';
import {
  PipelineSummaryModal,
  StageBottleneckModal,
  PipelineValueModal,
  PipelineTrendModal,
  BatchStageMoveModal,
  StaleDealsModal,
  StageRulesModal,
  DealRotationModal,
  PipelineCoverageModal,
  StageConversionModal,
  PipelineSnapshotModal,
  DealPriorityModal,
} from '../components/deal-pipeline';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface SortableDealCardProps {
  deal: DealWithRelations;
}

function SortableDealCard({ deal }: SortableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  );
}

export default function DealPipeline() {
  const navigate = useNavigate();
  const { dealService, dealStages, refreshDashboard } = useCRM();
  const { activeOrgId } = useOrg();

  const [dealsByStage, setDealsByStage] = useState<Record<string, DealWithRelations[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [addDealStageId, setAddDealStageId] = useState<string | undefined>();

  // Power modal state
  const [showSummary, setShowSummary] = useState(false);
  const [showBottleneck, setShowBottleneck] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [showStale, setShowStale] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showPriority, setShowPriority] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'summary', label: 'Summary', icon: BarChart3, color: 'text-blue-500', action: () => setShowSummary(true) },
    { id: 'bottleneck', label: 'Bottlenecks', icon: AlertTriangle, color: 'text-red-500', action: () => setShowBottleneck(true) },
    { id: 'value', label: 'Value', icon: DollarSign, color: 'text-green-500', action: () => setShowValue(true) },
    { id: 'trend', label: 'Trend', icon: TrendingUp, color: 'text-cyan-500', action: () => setShowTrend(true) },
    { id: 'batch', label: 'Batch Move', icon: ArrowRight, color: 'text-violet-500', action: () => setShowBatchMove(true) },
    { id: 'stale', label: 'Stale', icon: Clock, color: 'text-amber-500', action: () => setShowStale(true) },
    { id: 'rules', label: 'Rules', icon: Zap, color: 'text-orange-500', action: () => setShowRules(true) },
    { id: 'rotation', label: 'Rotation', icon: RotateCcw, color: 'text-pink-500', action: () => setShowRotation(true) },
    { id: 'coverage', label: 'Coverage', icon: Target, color: 'text-emerald-500', action: () => setShowCoverage(true) },
    { id: 'conversion', label: 'Conversion', icon: ArrowLeftRight, color: 'text-indigo-500', action: () => setShowConversion(true) },
    { id: 'snapshots', label: 'Snapshots', icon: Camera, color: 'text-teal-500', action: () => setShowSnapshots(true) },
    { id: 'priority', label: 'AI Priority', icon: Sparkles, color: 'text-rose-500', action: () => setShowPriority(true) },
  ];

  // Stage totals
  const [stageTotals, setStageTotals] = useState<Record<string, { count: number; value: number }>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadDeals = async () => {
    setLoading(true);
    const grouped = await dealService.getDealsByStage();
    setDealsByStage(grouped);

    // Calculate totals
    const totals: Record<string, { count: number; value: number }> = {};
    for (const [stageName, deals] of Object.entries(grouped)) {
      totals[stageName] = {
        count: deals.length,
        value: deals.reduce((sum, d) => sum + (d.amount || 0), 0),
      };
    }
    setStageTotals(totals);

    setLoading(false);
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as DealWithRelations;
    setActiveDeal(deal);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeDeal = active.data.current?.deal as DealWithRelations;
    if (!activeDeal) return;

    // Get the target stage from the droppable ID (column id is the stage name)
    const targetStageName = over.id as string;
    const targetStage = dealStages.find((s) => s.name === targetStageName);

    if (!targetStage) return;

    // Check if we're dropping on a different stage
    const currentStageName = activeDeal.stage?.name;
    if (currentStageName === targetStageName) return;

    const originalStage = activeDeal.stage;

    // Optimistic update
    setDealsByStage((prev) => {
      const newDealsByStage = { ...prev };

      // Remove from original stage
      if (currentStageName && newDealsByStage[currentStageName]) {
        newDealsByStage[currentStageName] = newDealsByStage[currentStageName].filter(
          (d) => d.id !== activeDeal.id
        );
      }

      // Add to target stage
      if (!newDealsByStage[targetStageName]) {
        newDealsByStage[targetStageName] = [];
      }
      newDealsByStage[targetStageName] = [
        { ...activeDeal, stage_id: targetStage.id, stage: targetStage },
        ...newDealsByStage[targetStageName],
      ];

      return newDealsByStage;
    });

    // Update totals
    setStageTotals((prev) => {
      const newTotals = { ...prev };
      const amount = activeDeal.amount || 0;

      if (currentStageName && newTotals[currentStageName]) {
        newTotals[currentStageName] = {
          count: newTotals[currentStageName].count - 1,
          value: newTotals[currentStageName].value - amount,
        };
      }

      if (!newTotals[targetStageName]) {
        newTotals[targetStageName] = { count: 0, value: 0 };
      }
      newTotals[targetStageName] = {
        count: newTotals[targetStageName].count + 1,
        value: newTotals[targetStageName].value + amount,
      };

      return newTotals;
    });

    // Update in database
    const result = await dealService.updateDealStage(activeDeal.id, targetStage.id);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.DEAL_STAGE_CHANGED || 'deal.stage_changed',
        entityType: 'deal',
        entityId: activeDeal.id,
        before: { stage: originalStage?.display_name },
        after: { stage: targetStage.display_name },
      }).catch(console.error);
      toast.success(`Moved to ${targetStage.display_name}`);
      refreshDashboard();
    } else {
      // Revert on failure
      loadDeals();
      toast.error('Failed to update stage');
    }
  };

  const activeStageNames = useMemo(() =>
    dealStages.filter((s) => !s.is_won_stage && !s.is_lost_stage).map((s) => s.name),
    [dealStages]
  );

  const totalPipelineValue = useMemo(() =>
    Object.values(stageTotals).reduce((s, t) => s + t.value, 0),
    [stageTotals]
  );

  const handleAddDealToStage = (stageId: string) => {
    setAddDealStageId(stageId);
    setShowAddDeal(true);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Deal Pipeline"
        subtitle="Drag and drop deals between stages"
        icon={<Layers className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDeals}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <PermissionGate permission="deals.write">
              <button
                onClick={() => setShowAddDeal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-xl text-sm font-medium text-white hover:bg-th-accent-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Deal</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      <HelpBanner
        pageKey="deal-pipeline"
        title="Welcome to the Deal Pipeline"
        tip="Drag and drop deal cards between stages to track progress. The column totals show the combined value in each stage. Use the toolbar for analytics and batch operations."
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

      {/* Pipeline board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {dealStages
            .filter((stage) => !stage.is_won_stage && !stage.is_lost_stage)
            .map((stage) => {
              const stageDeals = dealsByStage[stage.name] || [];
              const totals = stageTotals[stage.name] || { count: 0, value: 0 };

              return (
                <div
                  key={stage.id}
                  id={stage.name}
                  className="flex-shrink-0 w-80 bg-surface-secondary rounded-xl p-4"
                >
                  {/* Stage header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-th-text-primary">{stage.display_name}</h3>
                    </div>
                    <PermissionGate permission="deals.write">
                      <button
                        onClick={() => handleAddDealToStage(stage.id)}
                        className="p-1 text-th-text-tertiary hover:text-th-accent-600 hover:bg-surface-primary rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                  </div>

                  {/* Stage totals */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-th-border">
                    <span className="text-sm text-th-text-tertiary">{totals.count} deals</span>
                    <div className="flex items-center gap-1 text-sm font-medium text-th-text-primary">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(totals.value)}
                      <HelpTooltip text="Total value of deals in this stage. Drag deals here to update their stage." />
                    </div>
                  </div>

                  {/* Droppable area */}
                  <SortableContext
                    id={stage.name}
                    items={stageDeals.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[200px]">
                      {stageDeals.map((deal) => (
                        <SortableDealCard key={deal.id} deal={deal} />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-th-text-tertiary text-sm border-2 border-dashed border-th-border rounded-lg">
                          Drop deals here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Add Deal Modal */}
      <AddDealModal
        open={showAddDeal}
        onClose={() => {
          setShowAddDeal(false);
          setAddDealStageId(undefined);
        }}
        onSuccess={() => loadDeals()}
        defaultStageId={addDealStageId}
      />

      {/* ---- Deal Pipeline Power Modals ---- */}
      <PipelineSummaryModal open={showSummary} onClose={() => setShowSummary(false)} stageTotals={stageTotals} stageNames={activeStageNames} />
      <StageBottleneckModal open={showBottleneck} onClose={() => setShowBottleneck(false)} />
      <PipelineValueModal open={showValue} onClose={() => setShowValue(false)} stageTotals={stageTotals} stageNames={activeStageNames} />
      <PipelineTrendModal open={showTrend} onClose={() => setShowTrend(false)} />
      <BatchStageMoveModal open={showBatchMove} onClose={() => setShowBatchMove(false)} stageNames={activeStageNames} onBatchMove={async () => { await loadDeals(); }} />
      <StaleDealsModal open={showStale} onClose={() => setShowStale(false)}
        onNavigateToDeal={(id) => { setShowStale(false); navigate(`/deals/${id}`); }} />
      <StageRulesModal open={showRules} onClose={() => setShowRules(false)} stageNames={activeStageNames} />
      <DealRotationModal open={showRotation} onClose={() => setShowRotation(false)} />
      <PipelineCoverageModal open={showCoverage} onClose={() => setShowCoverage(false)} totalValue={totalPipelineValue} weightedValue={Math.round(totalPipelineValue * 0.4)} />
      <StageConversionModal open={showConversion} onClose={() => setShowConversion(false)} />
      <PipelineSnapshotModal open={showSnapshots} onClose={() => setShowSnapshots(false)} />
      <DealPriorityModal open={showPriority} onClose={() => setShowPriority(false)}
        onNavigateToDeal={(id) => { setShowPriority(false); navigate(`/deals/${id}`); }} />
    </div>
  );
}
