import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Zap, Plus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { AutomationRuleModal } from '../components/AutomationRuleModal';
import { AutomationExecutionHistory } from '../components/AutomationExecutionHistory';
import type { AutomationRule } from '@mpbhealth/crm-core';

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  stage_change: 'Stage Change',
  no_activity: 'No Activity',
  high_score: 'High Score',
  task_overdue: 'Task Overdue',
  scheduled_time: 'Scheduled',
  lead_activity: 'Lead Activity',
};

const ACTION_LABELS: Record<string, string> = {
  create_task: 'Create Task',
  send_notification: 'Notification',
  assign_lead: 'Assign Lead',
  update_priority: 'Update Priority',
  send_email: 'Send Email',
  send_slack: 'Slack',
};

export default function Automation() {
  const { automationService } = useCRM();
  const { can } = useOrg();
  const canManage = can('settings.manage');

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    const data = await automationService.listRules();
    setRules(data);
    setLoading(false);
  }, [automationService]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleToggle = async (rule: AutomationRule) => {
    const result = await automationService.toggleRule(rule.id, !rule.is_active);
    if (result.success) {
      toast.success(rule.is_active ? 'Rule deactivated' : 'Rule activated');
      loadRules();
    } else {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (rule: AutomationRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    const result = await automationService.deleteRule(rule.id);
    if (result.success) {
      toast.success('Rule deleted');
      loadRules();
    } else {
      toast.error('Failed to delete rule');
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Automation Rules"
        subtitle="Automate repetitive tasks with trigger-based rules."
      >
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white text-th-accent-700 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        )}
      </GradientHeader>

      {/* Rules list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-th-border">
            <Zap className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary font-medium">No automation rules yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">Create your first rule to get started.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center gap-4"
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggle(rule)}
                className="flex-shrink-0"
                title={rule.is_active ? 'Deactivate' : 'Activate'}
                disabled={!canManage}
              >
                {rule.is_active ? (
                  <ToggleRight className="w-7 h-7 text-green-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-th-text-tertiary" />
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-th-text-primary">{rule.name}</p>
                {rule.description && (
                  <p className="text-sm text-th-text-tertiary truncate">{rule.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                    {TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}
                  </span>
                  <span className="text-th-text-tertiary text-xs">&rarr;</span>
                  <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                    {ACTION_LABELS[rule.action_type] || rule.action_type}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden sm:block text-right text-sm flex-shrink-0">
                <p className="text-th-text-secondary">{rule.execution_count} runs</p>
                {rule.last_executed_at && (
                  <p className="text-xs text-th-text-tertiary">
                    Last: {format(new Date(rule.last_executed_at), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(rule)}
                    className="p-2 rounded-lg hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-th-text-tertiary hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Execution History */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="font-semibold text-th-text-primary mb-4">Execution History</h2>
        <AutomationExecutionHistory />
      </div>

      {/* Modal */}
      <AutomationRuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rule={editingRule}
        onSuccess={loadRules}
      />
    </div>
  );
}
