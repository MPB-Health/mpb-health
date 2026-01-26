import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  List,
  Download,
  Filter,
  ChevronLeft,
  GripVertical,
  RefreshCw
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/Button';
import { LeadCard } from '../../components/admin/crm/LeadCard';
import { LeadFilters } from '../../components/admin/crm/LeadFilters';
import { ExportModal } from '../../components/admin/crm/ExportModal';
import { crmService, type Lead, type PipelineStage, type LeadFilters as LeadFiltersType } from '../../lib/crmService';
import { cn } from '../../lib/utils';

// Sortable Lead Card Wrapper
interface SortableLeadCardProps {
  lead: Lead;
  onClick: () => void;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative group">
        <div
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="pl-4">
          <LeadCard
            lead={lead}
            variant="pipeline"
            onClick={onClick}
            isDragging={isDragging}
          />
        </div>
      </div>
    </div>
  );
};

// Pipeline Column Component
interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ stage, leads, onLeadClick }) => {
  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div
        className="px-4 py-3 rounded-t-xl flex items-center justify-between"
        style={{ backgroundColor: stage.color }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{stage.display_name}</h3>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="bg-neutral-100 rounded-b-xl p-2 min-h-[calc(100vh-320px)] max-h-[calc(100vh-320px)] overflow-y-auto">
        <SortableContext
          items={leads.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                No leads in this stage
              </div>
            ) : (
              leads.map((lead) => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const LeadPipeline: React.FC = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadFiltersType>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadPipelineData();
  }, [filters]);

  const loadPipelineData = async () => {
    setLoading(true);
    try {
      const [stagesData, leadsData] = await Promise.all([
        crmService.getPipelineStages(),
        crmService.getLeads(filters, 500),
      ]);

      setStages(stagesData);
      setAllLeads(leadsData.leads);

      // Group leads by stage
      const grouped: Record<string, Lead[]> = {};
      for (const stage of stagesData) {
        grouped[stage.name] = [];
      }
      for (const lead of leadsData.leads) {
        const stage = lead.pipeline_stage || 'new';
        if (!grouped[stage]) {
          grouped[stage] = [];
        }
        grouped[stage].push(lead);
      }

      setLeadsByStage(grouped);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const lead = allLeads.find(l => l.id === active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    // Find which stage the lead was dropped into
    // We need to determine the target stage from the over id
    let targetStage: string | null = null;

    // Check if dropped over another lead
    const overLead = allLeads.find(l => l.id === over.id);
    if (overLead) {
      targetStage = overLead.pipeline_stage;
    } else {
      // Might be dropped directly on a stage container
      // For now, we'll use the original stage
      return;
    }

    if (targetStage && targetStage !== lead.pipeline_stage) {
      // Optimistic update
      setLeadsByStage(prev => {
        const newGrouped = { ...prev };
        
        // Remove from old stage
        const oldStage = lead.pipeline_stage || 'new';
        newGrouped[oldStage] = (newGrouped[oldStage] || []).filter(l => l.id !== leadId);
        
        // Add to new stage
        if (!newGrouped[targetStage!]) {
          newGrouped[targetStage!] = [];
        }
        newGrouped[targetStage!] = [{ ...lead, pipeline_stage: targetStage! }, ...newGrouped[targetStage!]];
        
        return newGrouped;
      });

      // Update in database
      const result = await crmService.updateLeadStage(leadId, targetStage);
      if (!result.success) {
        // Revert on failure
        loadPipelineData();
      }
    }
  };

  const handleLeadClick = (lead: Lead) => {
    navigate(`/admin/crm/leads/${lead.id}`);
  };

  return (
    <AdminLayout activeView="crm-pipeline" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="Lead Pipeline | MPB Health Admin"
        description="Visual lead pipeline management"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Pipeline', href: '/admin/crm/pipeline' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/crm" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Lead Pipeline</h1>
              <p className="text-neutral-500">Drag and drop leads between stages</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-primary-50 border-primary-300')}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/admin/crm/leads">
              <Button variant="outline">
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
            <Button onClick={loadPipelineData}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <LeadFilters
              filters={filters}
              onFiltersChange={setFilters}
              showSearch={true}
            />
          </div>
        )}

        {/* Pipeline Board */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.name}
                  stage={stage}
                  leads={leadsByStage[stage.name] || []}
                  onLeadClick={handleLeadClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId && activeLead && (
                <div className="w-72">
                  <LeadCard
                    lead={activeLead}
                    variant="pipeline"
                    isDragging={true}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Stats Summary */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-neutral-500">
          {stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span>
                {stage.display_name}: {leadsByStage[stage.name]?.length || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        leads={allLeads}
        exportType="leads"
      />
    </AdminLayout>
  );
};

export default LeadPipeline;
