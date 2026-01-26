import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import type { Lead } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

export default function Pipeline() {
  const { leadService, activityService, pipelineStages, refreshDashboard } = useCRM();
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    const grouped = await leadService.getLeadsByStage();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pipeline</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Drag and drop leads between stages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={loadLeads}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Pipeline board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageLeads = leadsByStage[stage.name] || [];

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
                  <h3 className="font-semibold text-neutral-900">
                    {stage.display_name}
                  </h3>
                </div>
                <span className="text-sm text-neutral-500 bg-white px-2 py-0.5 rounded-full">
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
                          <p className="font-medium text-neutral-900">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-neutral-500 mt-1">
                            {lead.email}
                          </p>
                        </div>
                        {lead.lead_score > 0 && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            {lead.lead_score}
                          </span>
                        )}
                      </div>
                      {lead.phone && (
                        <p className="text-sm text-neutral-500 mt-2">
                          {lead.phone}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                        <span className="text-xs text-neutral-400">
                          {formatTimeAgo(lead.created_at)}
                        </span>
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded"
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
                  <div className="text-center py-8 text-neutral-400 text-sm">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
