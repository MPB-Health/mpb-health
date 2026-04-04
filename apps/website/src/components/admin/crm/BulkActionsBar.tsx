import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  Tag, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import type { Lead, PipelineStage } from '../../../lib/crmService';
import { crmService } from '../../../lib/crmService';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface BulkActionsBarProps {
  selectedLeads: Lead[];
  onClearSelection: () => void;
  onActionComplete: () => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

type ActionType = 'stage' | 'assign' | 'tags' | null;

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedLeads,
  onClearSelection,
  onActionComplete,
  onExport,
}) => {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    // Clear result after 3 seconds
    if (result) {
      const timer = setTimeout(() => setResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const loadStages = async () => {
    const data = await crmService.getPipelineStages();
    setStages(data);
  };

  const handleStageChange = async (stage: string) => {
    setIsProcessing(true);
    const leadIds = selectedLeads.map(l => l.id);
    const result = await crmService.bulkUpdateLeads(leadIds, { pipeline_stage: stage });
    setIsProcessing(false);
    setResult({ success: result.success, failed: result.failed });
    setActiveAction(null);
    
    if (result.success > 0) {
      onActionComplete();
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    setIsProcessing(true);
    let success = 0;
    let failed = 0;

    for (const lead of selectedLeads) {
      const result = await crmService.addTagsToLead(lead.id, [newTag.trim()]);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    setIsProcessing(false);
    setResult({ success, failed });
    setNewTag('');
    setActiveAction(null);

    if (success > 0) {
      onActionComplete();
    }
  };



  if (selectedLeads.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-full text-sm font-bold">
            {selectedLeads.length}
          </span>
          <span className="text-sm">
            {selectedLeads.length === 1 ? 'lead' : 'leads'} selected
          </span>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Result Message */}
        {result && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
            result.failed === 0 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
          )}>
            {result.failed === 0 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {result.success} updated{result.failed > 0 && `, ${result.failed} failed`}
          </div>
        )}

        {/* Action Panels */}
        {activeAction === 'stage' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Move to:</span>
            {stages.filter(s => !s.is_won_stage && !s.is_lost_stage).map((stage) => (
              <button
                key={stage.name}
                onClick={() => handleStageChange(stage.name)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: stage.color }}
              >
                {stage.display_name}
              </button>
            ))}
            <button
              onClick={() => setActiveAction(null)}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeAction === 'tags' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag..."
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-40"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button
              size="sm"
              onClick={handleAddTag}
              disabled={!newTag.trim() || isProcessing}
            >
              Add
            </Button>
            <button
              onClick={() => {
                setActiveAction(null);
                setNewTag('');
              }}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {!activeAction && !result && (
          <>
            <button
              onClick={() => setActiveAction('stage')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              Change Stage
            </button>

            <button
              onClick={() => setActiveAction('tags')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <Tag className="h-4 w-4" />
              Add Tag
            </button>

            <div className="w-px h-8 bg-slate-700" />

            <button
              onClick={() => onExport('csv')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={() => onExport('pdf')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>

          </>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        )}

        <div className="w-px h-8 bg-slate-700" />

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
