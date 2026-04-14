import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw, Filter, GitBranch, BarChart3, ArrowDown, Clock,
  Camera, Users, AlertTriangle, Zap, MapPin, Target, ArrowLeftRight,
  Heart, DollarSign, Flag,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PipelineFilters } from '../components/PipelineFilters';
import type { Lead } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import {
  PipelineAnalyticsModal,
  ConversionFunnelModal,
  PipelineVelocityModal,
  PipelineSnapshotModal,
  BatchStageChangeModal,
  StuckLeadAlertModal,
  StageAutomationModal,
  LeadRoutingModal,
  StageProbabilityModal,
  PipelineComparisonModal,
  PipelineGoalsModal,
  PipelineHealthScoreModal,
} from '../components/pipeline';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

export default function Pipeline() {
  const navigate = useNavigate();
  const { leadService, activityService, pipelineStages, refreshDashboard } = useCRM();
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterFn, setFilterFn] = useState<((lead: Lead) => boolean) | null>(null);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [showVelocity, setShowVelocity] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [showStuckAlerts, setShowStuckAlerts] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showProbability, setShowProbability] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showHealthScore, setShowHealthScore] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'funnel', label: 'Funnel', icon: ArrowDown, color: 'text-violet-500', action: () => setShowFunnel(true) },
    { id: 'velocity', label: 'Velocity', icon: Clock, color: 'text-amber-500', action: () => setShowVelocity(true) },
    { id: 'snapshots', label: 'Snapshots', icon: Camera, color: 'text-cyan-500', action: () => setShowSnapshots(true) },
    { id: 'batch', label: 'Batch Move', icon: Users, color: 'text-green-500', action: () => setShowBatchMove(true) },
    { id: 'stuck', label: 'Stuck Alerts', icon: AlertTriangle, color: 'text-red-500', action: () => setShowStuckAlerts(true) },
    { id: 'automation', label: 'Automation', icon: Zap, color: 'text-orange-500', action: () => setShowAutomation(true) },
    { id: 'routing', label: 'Routing', icon: MapPin, color: 'text-teal-500', action: () => setShowRouting(true) },
    { id: 'probability', label: 'Win Prob', icon: Target, color: 'text-emerald-500', action: () => setShowProbability(true) },
    { id: 'comparison', label: 'Compare', icon: ArrowLeftRight, color: 'text-indigo-500', action: () => setShowComparison(true) },
    { id: 'goals', label: 'Goals', icon: Flag, color: 'text-pink-500', action: () => setShowGoals(true) },
    { id: 'health', label: 'Health', icon: Heart, color: 'text-rose-500', action: () => setShowHealthScore(true) },
  ];

  const loadLeads = async () => {
    setLoading(true);
    const { grouped } = await leadService.getLeadsByStage();
    setLeadsByStage(grouped);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();

    if (!draggedLead || draggedLead.pipeline_stage === targetStage) {
      setDraggedLead(null);
      return;
    }

    const originalStage = draggedLead.pipeline_stage;

    // Optimistic update
    setLeadsByStage((prev) => {
      const newLeadsByStage = { ...prev };

      // Remove from original stage
      newLeadsByStage[originalStage] = (newLeadsByStage[originalStage] || []).filter(
        (l) => l.id !== draggedLead.id
      );

      // Add to target stage
      if (!newLeadsByStage[targetStage]) {
        newLeadsByStage[targetStage] = [];
      }
      newLeadsByStage[targetStage] = [
        { ...draggedLead, pipeline_stage: targetStage },
        ...newLeadsByStage[targetStage],
      ];

      return newLeadsByStage;
    });

    // Update in database
    const result = await leadService.updateLeadStage(draggedLead.id, targetStage);

    if (result.success) {
      await activityService.logStageChange(draggedLead.id, originalStage, targetStage);
      toast.success(`Moved to ${pipelineStages.find((s) => s.name === targetStage)?.display_name}`);
      refreshDashboard();
    } else {
      // Revert on failure
      loadLeads();
      toast.error('Failed to update stage');
    }

    setDraggedLead(null);
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
        title="Pipeline"
        subtitle="Drag and drop leads between stages"
        icon={<GitBranch className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                  showFilters || filterFn
                    ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                    : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              {showFilters && (
                <PipelineFilters onFilter={(fn) => setFilterFn(() => fn)} />
              )}
            </div>
            <button
              onClick={loadLeads}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Pipeline board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const rawStageLeads = leadsByStage[stage.name] || [];
          const stageLeads = filterFn ? rawStageLeads.filter(filterFn) : rawStageLeads;

          return (
            <div
              key={stage.id}
              className="pipeline-column flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Stage header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-th-text-primary">
                    {stage.display_name}
                  </h3>
                </div>
                <span className="text-sm text-th-text-tertiary bg-surface-primary px-2 py-0.5 rounded-full">
                  {stageLeads.length}
                </span>
              </div>

              {/* Lead cards */}
              <div className="space-y-3 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className={`lead-card ${
                      draggedLead?.id === lead.id ? 'dragging' : ''
                    }`}
                  >
                    <Link to={`/leads/${lead.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-th-text-primary">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-th-text-tertiary mt-1">
                            {lead.email}
                          </p>
                        </div>
                        {lead.lead_score > 0 && (
                          <span className="text-xs bg-th-accent-100 text-th-accent-700 px-2 py-0.5 rounded-full">
                            {lead.lead_score}
                          </span>
                        )}
                      </div>
                      {lead.phone && (
                        <p className="text-sm text-th-text-tertiary mt-2">
                          {lead.phone}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-th-border-subtle">
                        <span className="text-xs text-th-text-tertiary">
                          {formatTimeAgo(lead.created_at)}
                        </span>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-surface-tertiary text-th-text-secondary px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-th-text-tertiary text-sm">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Pipeline Power Modals ---- */}
      <PipelineAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} />
      <ConversionFunnelModal open={showFunnel} onClose={() => setShowFunnel(false)} />
      <PipelineVelocityModal open={showVelocity} onClose={() => setShowVelocity(false)}
        onNavigateToLead={(id) => { setShowVelocity(false); navigate(`/leads/${id}`); }} />
      <PipelineSnapshotModal open={showSnapshots} onClose={() => setShowSnapshots(false)} />
      <BatchStageChangeModal open={showBatchMove} onClose={() => setShowBatchMove(false)}
        onBatchMove={async (leadIds, targetStage) => {
          let count = 0;
          for (const id of leadIds) {
            try {
              const res = await leadService.updateLeadStage(id, targetStage);
              if (res.success) count++;
            } catch { /* skip */ }
          }
          loadLeads();
          refreshDashboard();
          toast.success(`Moved ${count} leads to ${targetStage}`);
          return count;
        }} />
      <StuckLeadAlertModal open={showStuckAlerts} onClose={() => setShowStuckAlerts(false)}
        onNavigateToLead={(id) => { setShowStuckAlerts(false); navigate(`/leads/${id}`); }} />
      <StageAutomationModal open={showAutomation} onClose={() => setShowAutomation(false)} />
      <LeadRoutingModal open={showRouting} onClose={() => setShowRouting(false)} />
      <StageProbabilityModal open={showProbability} onClose={() => setShowProbability(false)} />
      <PipelineComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
      <PipelineGoalsModal open={showGoals} onClose={() => setShowGoals(false)} />
      <PipelineHealthScoreModal open={showHealthScore} onClose={() => setShowHealthScore(false)} />
    </div>
  );
}
