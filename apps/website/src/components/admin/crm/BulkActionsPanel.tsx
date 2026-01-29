import React, { useState } from 'react';
import {
  X,
  Users,
  Tag,
  ArrowRight,
  UserPlus,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { crmService, type Lead, type PipelineStage } from '../../../lib/crmService';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface BulkActionsPanelProps {
  selectedLeads: Lead[];
  stages: PipelineStage[];
  teamMembers?: Array<{ id: string; name: string; email: string }>;
  onClearSelection: () => void;
  onActionComplete: () => void;
  onClose?: () => void;
}

type ActionType = 
  | 'stage'
  | 'priority'
  | 'assign'
  | 'tag'
  | 'email'
  | 'sms'
  | 'delete';

interface ActionResult {
  success: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// Bulk Actions Panel Component
// ============================================================================

export const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedLeads,
  stages,
  teamMembers = [],
  onClearSelection,
  onActionComplete,
  onClose,
}) => {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  // Form states
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [newTags, setNewTags] = useState('');
  const [_confirmDelete, setConfirmDelete] = useState(false);

  const leadIds = selectedLeads.map(l => l.id);

  const resetAction = () => {
    setActiveAction(null);
    setResult(null);
    setSelectedStage('');
    setSelectedPriority('');
    setSelectedAssignee('');
    setNewTags('');
    setConfirmDelete(false);
  };

  // --------------------------------------------------------------------------
  // Bulk Action Handlers
  // --------------------------------------------------------------------------

  const handleBulkStageUpdate = async () => {
    if (!selectedStage) return;
    
    setIsProcessing(true);
    try {
      const updateResult = await crmService.bulkUpdateLeads(leadIds, {
        pipeline_stage: selectedStage,
      });
      
      setResult(updateResult);
      if (updateResult.success > 0) {
        onActionComplete();
      }
    } catch (error) {
      setResult({ success: 0, failed: leadIds.length, errors: [String(error)] });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriorityUpdate = async () => {
    if (!selectedPriority) return;
    
    setIsProcessing(true);
    try {
      const updateResult = await crmService.bulkUpdateLeads(leadIds, {
        priority: selectedPriority as Lead['priority'],
      });
      
      setResult(updateResult);
      if (updateResult.success > 0) {
        onActionComplete();
      }
    } catch (error) {
      setResult({ success: 0, failed: leadIds.length, errors: [String(error)] });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee) return;
    
    setIsProcessing(true);
    try {
      const updateResult = await crmService.bulkUpdateLeads(leadIds, {
        assigned_to: selectedAssignee,
      });
      
      setResult(updateResult);
      if (updateResult.success > 0) {
        onActionComplete();
      }
    } catch (error) {
      setResult({ success: 0, failed: leadIds.length, errors: [String(error)] });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTag = async () => {
    if (!newTags.trim()) return;
    
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) return;
    
    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      for (const leadId of leadIds) {
        const result = await crmService.addTagsToLead(leadId, tags);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          if (result.error) errors.push(result.error);
        }
      }
      
      setResult({ success: successCount, failed: failedCount, errors });
      if (successCount > 0) {
        onActionComplete();
      }
    } catch (error) {
      setResult({ success: successCount, failed: leadIds.length - successCount, errors: [String(error)] });
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render Action Forms
  // --------------------------------------------------------------------------

  const renderActionForm = () => {
    if (result) {
      return (
        <div className="p-4 space-y-4">
          <div className={cn(
            'p-4 rounded-lg flex items-start gap-3',
            result.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'
          )}>
            {result.failed === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            )}
            <div>
              <p className={cn(
                'font-medium',
                result.failed === 0 ? 'text-green-800' : 'text-yellow-800'
              )}>
                {result.success} of {result.success + result.failed} leads updated
              </p>
              {result.failed > 0 && (
                <p className="text-sm text-yellow-700 mt-1">
                  {result.failed} failed
                </p>
              )}
            </div>
          </div>
          <Button onClick={resetAction} variant="outline" className="w-full">
            Done
          </Button>
        </div>
      );
    }

    switch (activeAction) {
      case 'stage':
        return (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Move to Stage</h4>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select stage...</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.display_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button onClick={resetAction} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBulkStageUpdate} 
                disabled={!selectedStage || isProcessing}
                className="flex-1"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
          </div>
        );

      case 'priority':
        return (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Set Priority</h4>
            <div className="grid grid-cols-2 gap-2">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                    selectedPriority === priority
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={resetAction} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBulkPriorityUpdate} 
                disabled={!selectedPriority || isProcessing}
                className="flex-1"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Assign to Team Member</h4>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select team member...</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button onClick={resetAction} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAssign} 
                disabled={!selectedAssignee || isProcessing}
                className="flex-1"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
              </Button>
            </div>
          </div>
        );

      case 'tag':
        return (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Add Tags</h4>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              Example: hot lead, needs follow-up, priority
            </p>
            <div className="flex gap-2">
              <Button onClick={resetAction} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBulkTag} 
                disabled={!newTags.trim() || isProcessing}
                className="flex-1"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Tags'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------

  if (selectedLeads.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          {/* Selection Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full">
                <Users className="h-4 w-4" />
                <span className="font-medium">{selectedLeads.length} selected</span>
              </div>
              <button
                onClick={onClearSelection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Action Buttons or Form */}
          {activeAction ? (
            renderActionForm()
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAction('stage')}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Move to Stage
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAction('priority')}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Set Priority
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAction('assign')}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAction('tag')}
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                Add Tags
              </Button>

              <div className="h-6 w-px bg-gray-200 mx-2" />

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // TODO: Open email campaign modal
                  console.log('Email campaign', leadIds);
                }}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // TODO: Open SMS campaign modal
                  console.log('SMS campaign', leadIds);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Send SMS
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsPanel;

