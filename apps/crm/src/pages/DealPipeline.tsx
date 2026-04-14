import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, DollarSign, Layers } from 'lucide-react';
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
    </div>
  );
}
