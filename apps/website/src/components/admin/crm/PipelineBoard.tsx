import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GripVertical,
  Phone,
  Mail,
  User,
  Clock,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { crmService, type Lead, type PipelineStage } from '../../../lib/crmService';
import { aiTaskClusterService, type AILeadInsights } from '../../../lib/aiTaskClusterService';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PipelineBoardProps {
  onLeadSelect?: (lead: Lead) => void;
  onStageChange?: (leadId: string, newStage: string) => void;
  selectedLeads?: string[];
  onSelectionChange?: (leadIds: string[]) => void;
  showBulkSelect?: boolean;
}

interface DragState {
  isDragging: boolean;
  leadId: string | null;
  fromStage: string | null;
}

// ============================================================================
// Lead Card Component
// ============================================================================

interface LeadCardProps {
  lead: Lead;
  insights?: AILeadInsights | null;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  insights,
  isSelected,
  showCheckbox,
  onSelect,
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-all duration-200',
        'group relative',
        isSelected && 'ring-2 ring-primary-500 border-primary-300'
      )}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Checkbox for bulk selection */}
      {showCheckbox && (
        <div className="absolute right-2 top-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="pl-4" onClick={onClick}>
        {/* Header: Name + AI Score */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-gray-900 text-sm">
              {lead.first_name} {lead.last_name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                priorityColors[lead.priority] || priorityColors.low
              )}>
                {lead.priority}
              </span>
              {lead.tags && lead.tags.length > 0 && (
                <span className="text-xs text-gray-500">
                  +{lead.tags.length} tags
                </span>
              )}
            </div>
          </div>
          
          {insights?.ai_score && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
              getScoreColor(insights.ai_score)
            )}>
              <Sparkles className="h-3 w-3" />
              {insights.ai_score}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-2">
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Phone className="h-3 w-3" />
            {lead.phone}
          </a>
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary-600 transition-colors truncate"
          >
            <Mail className="h-3 w-3" />
            {lead.email}
          </a>
        </div>

        {/* AI Recommendation Badge */}
        {insights?.recommended_action && (
          <div className="bg-purple-50 border border-purple-100 rounded px-2 py-1 mb-2">
            <p className="text-xs text-purple-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {insights.recommended_channel === 'call' && 'Call recommended'}
              {insights.recommended_channel === 'email' && 'Send email'}
              {insights.recommended_channel === 'sms' && 'Send SMS'}
              {!insights.recommended_channel && 'Follow up'}
            </p>
          </div>
        )}

        {/* Footer: Time + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(lead.created_at)}
          </span>
          <Link
            to={`/admin/crm/leads/${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
          >
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Pipeline Column Component
// ============================================================================

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  insights: Map<string, AILeadInsights>;
  selectedLeads: string[];
  showBulkSelect: boolean;
  onLeadSelect: (leadId: string) => void;
  onLeadClick: (lead: Lead) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string, fromStage: string) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  leads,
  insights,
  selectedLeads,
  showBulkSelect,
  onLeadSelect,
  onLeadClick,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  isDragOver,
}) => {
  // Group leads by priority within stage
  const sortedLeads = [...leads].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
    return aPriority - bPriority;
  });

  return (
    <div
      className={cn(
        'flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-lg',
        'bg-gray-50 border border-gray-200',
        isDragOver && 'ring-2 ring-primary-400 bg-primary-50'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.name)}
    >
      {/* Column Header */}
      <div
        className="px-3 py-3 border-b border-gray-200 sticky top-0 bg-gray-50 rounded-t-lg z-10"
        style={{ borderTopColor: stage.color, borderTopWidth: '3px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{stage.display_name}</h3>
            <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>
          <button className="p-1 hover:bg-gray-200 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {sortedLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <User className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No leads</p>
          </div>
        ) : (
          sortedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              insights={insights.get(lead.id)}
              isSelected={selectedLeads.includes(lead.id)}
              showCheckbox={showBulkSelect}
              onSelect={() => onLeadSelect(lead.id)}
              onClick={() => onLeadClick(lead)}
              onDragStart={(e) => onDragStart(e, lead.id, stage.name)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>

      {/* Column Footer with stats */}
      {leads.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {leads.filter(l => l.priority === 'high' || l.priority === 'urgent').length} hot
            </span>
            <span>
              Avg score: {Math.round(
                leads.reduce((sum, l) => sum + (insights.get(l.id)?.ai_score || 0), 0) / leads.length
              ) || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Pipeline Board Component
// ============================================================================

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  onLeadSelect,
  onStageChange,
  selectedLeads = [],
  onSelectionChange,
  showBulkSelect = false,
}) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [insights, setInsights] = useState<Map<string, AILeadInsights>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    leadId: null,
    fromStage: null,
  });
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    setLoading(true);
    try {
      const [stagesData, leadsData] = await Promise.all([
        crmService.getPipelineStages(),
        crmService.getLeadsByStage(),
      ]);

      setStages(stagesData);
      setLeadsByStage(leadsData);

      // Load AI insights for all leads
      const allLeads = Object.values(leadsData).flat();
      const insightsMap = new Map<string, AILeadInsights>();
      
      await Promise.all(
        allLeads.slice(0, 50).map(async (lead) => {
          const insight = await aiTaskClusterService.getLeadInsights(lead.id);
          if (insight) {
            insightsMap.set(lead.id, insight);
          }
        })
      );
      
      setInsights(insightsMap);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, leadId: string, fromStage: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
    setDragState({ isDragging: true, leadId, fromStage });
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, leadId: null, fromStage: null });
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    const fromStage = dragState.fromStage;

    if (!leadId || !fromStage || fromStage === toStage) {
      handleDragEnd();
      return;
    }

    // Optimistically update UI
    const lead = leadsByStage[fromStage]?.find(l => l.id === leadId);
    if (lead) {
      setLeadsByStage(prev => ({
        ...prev,
        [fromStage]: prev[fromStage]?.filter(l => l.id !== leadId) || [],
        [toStage]: [...(prev[toStage] || []), { ...lead, pipeline_stage: toStage }],
      }));
    }

    // Update in database
    try {
      await crmService.updateLeadStage(leadId, toStage);
      onStageChange?.(leadId, toStage);
    } catch (error) {
      console.error('Failed to update stage:', error);
      // Revert on error
      loadPipelineData();
    }

    handleDragEnd();
  };

  // Selection handlers
  const handleLeadSelect = (leadId: string) => {
    const newSelection = selectedLeads.includes(leadId)
      ? selectedLeads.filter(id => id !== leadId)
      : [...selectedLeads, leadId];
    onSelectionChange?.(newSelection);
  };

  const handleLeadClick = (lead: Lead) => {
    onLeadSelect?.(lead);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 p-4 min-w-max">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.name] || []}
            insights={insights}
            selectedLeads={selectedLeads}
            showBulkSelect={showBulkSelect}
            onLeadSelect={handleLeadSelect}
            onLeadClick={handleLeadClick}
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragOver={dragOverStage === stage.name && dragState.fromStage !== stage.name}
          />
        ))}
      </div>
    </div>
  );
};

export default PipelineBoard;

