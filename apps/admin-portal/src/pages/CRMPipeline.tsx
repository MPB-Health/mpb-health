import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Building2, Mail, Kanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { crmBridgeService, type CRMLead } from '@mpbhealth/admin-core';

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function CRMPipeline() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const movingRef = useRef(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const [stagesData, leadsResult] = await Promise.all([
        crmBridgeService.getPipelineStages(),
        crmBridgeService.getLeads({ search: q || undefined, limit: 500 }),
      ]);
      setStages(stagesData);
      setLeads(leadsResult.data);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  function leadsForStage(stageId: string) {
    return leads.filter((l) => l.pipeline_stage_id === stageId);
  }

  function handleDragStart(leadId: string) {
    setDraggingId(leadId);
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStage(stageId);
  }

  async function handleDrop(targetStageId: string) {
    if (!draggingId || movingRef.current) return;
    const lead = leads.find((l) => l.id === draggingId);
    if (!lead || lead.pipeline_stage_id === targetStageId) {
      setDraggingId(null);
      setDragOverStage(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === draggingId ? { ...l, pipeline_stage_id: targetStageId } : l,
      ),
    );
    setDraggingId(null);
    setDragOverStage(null);

    movingRef.current = true;
    try {
      await crmBridgeService.updateLeadStage(draggingId, targetStageId);
    } catch {
      toast.error('Failed to move lead');
      // Revert optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.id === draggingId ? { ...l, pipeline_stage_id: lead.pipeline_stage_id } : l,
        ),
      );
    } finally {
      movingRef.current = false;
    }
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Pipeline</h1>
          <p className="text-sm text-th-text-tertiary mt-1">{leads.length} leads across {stages.length} stages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm w-56"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/crm/leads')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-th-text-secondary hover:text-th-text-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <Kanban className="w-4 h-4" />
            List View
          </button>
          <button
            type="button"
            onClick={() => navigate('/crm/leads')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Kanban className="w-12 h-12 mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No pipeline stages configured</p>
        </div>
      ) : (
        /* Kanban board — horizontal scroll */
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {stages.map((stage) => {
            const stageLeads = leadsForStage(stage.id);
            const isOver = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDrop={() => handleDrop(stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                className={`flex flex-col min-w-[272px] w-[272px] rounded-xl border transition-colors ${
                  isOver
                    ? 'border-th-accent-400 bg-th-accent-50'
                    : 'border-th-border bg-surface-secondary'
                }`}
              >
                {/* Column header */}
                <div
                  className="px-3 py-3 rounded-t-xl border-t-4 flex items-center justify-between"
                  style={{ borderTopColor: stage.color || '#6366f1' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-th-text-primary">{stage.name}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 bg-surface-primary rounded-full text-th-text-secondary border border-th-border">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggingId === lead.id}
                      onDragStart={() => handleDragStart(lead.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    />
                  ))}

                  {stageLeads.length === 0 && !isOver && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-th-border rounded-lg">
                      <p className="text-xs text-th-text-tertiary">Drop leads here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Lead card ──────────────────────────────────────────────────────────────
interface LeadCardProps {
  lead: CRMLead;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-surface-primary border border-th-border rounded-lg p-3 cursor-pointer select-none transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:border-th-accent-400 hover:shadow-sm'
      }`}
    >
      {/* Name + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-th-accent-100 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-th-accent-600" />
          </div>
          <p className="text-sm font-medium text-th-text-primary truncate">
            {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'}
          </p>
        </div>
        {lead.status && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[lead.status] || 'bg-neutral-100 text-neutral-600'}`}>
            {lead.status}
          </span>
        )}
      </div>

      {/* Company */}
      {lead.company && (
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3 h-3 text-th-text-tertiary shrink-0" />
          <p className="text-xs text-th-text-secondary truncate">{lead.company}</p>
        </div>
      )}

      {/* Email */}
      {lead.email && (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-th-text-tertiary shrink-0" />
          <p className="text-xs text-th-text-tertiary truncate">{lead.email}</p>
        </div>
      )}

      {/* Source + date */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-th-border-subtle">
        {lead.source ? (
          <span className="text-xs text-th-text-tertiary truncate">{lead.source}</span>
        ) : (
          <span />
        )}
        <span className="text-xs text-th-text-tertiary shrink-0">
          {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
