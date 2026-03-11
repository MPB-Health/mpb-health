// ============================================================================
// Mail Rules - Inbox rules management page
// Create, edit, and manage inbox automation rules
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Filter, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, Pencil, Copy, ArrowRight,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type {
  MailRule, MailRuleCreateInput, MailAccount, MailFolder,
  RuleCondition, RuleAction,
} from '@mpbhealth/crm-core';
import toast from 'react-hot-toast';

const CONDITION_FIELDS = [
  { value: 'from', label: 'From' },
  { value: 'to', label: 'To' },
  { value: 'subject', label: 'Subject' },
  { value: 'body', label: 'Body' },
  { value: 'has_attachments', label: 'Has Attachments' },
  { value: 'importance', label: 'Importance' },
];

const CONDITION_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
];

const ACTION_TYPES = [
  { value: 'move_to_folder', label: 'Move to folder' },
  { value: 'add_label', label: 'Add label' },
  { value: 'mark_read', label: 'Mark as read' },
  { value: 'mark_flagged', label: 'Flag/Star' },
  { value: 'forward', label: 'Forward to' },
  { value: 'delete', label: 'Delete' },
];

export default function MailRules() {
  const { mailRulesService, mailAccountService } = useCRM();
  const { activeOrgId } = useOrg();

  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [rules, setRules] = useState<MailRule[]>([]);
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<MailRule | null>(null);

  // Editor state
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: 'from', operator: 'contains', value: '' },
  ]);
  const [actions, setActions] = useState<RuleAction[]>([
    { type: 'move_to_folder' },
  ]);
  const [stopProcessing, setStopProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!activeOrgId) return;
    const data = await mailAccountService.getAccounts(activeOrgId);
    setAccounts(data);
    if (data.length > 0 && !selectedAccountId) {
      setSelectedAccountId(data[0].id);
    }
  }, [mailAccountService, activeOrgId, selectedAccountId]);

  const loadRules = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const [rulesData, foldersData] = await Promise.all([
        mailRulesService.getRules(selectedAccountId),
        mailAccountService.getFolders(selectedAccountId),
      ]);
      setRules(rulesData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  }, [mailRulesService, mailAccountService, selectedAccountId]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadRules(); }, [loadRules]);

  const openEditor = (rule?: MailRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setConditions(rule.conditions);
      setActions(rule.actions);
      setStopProcessing(rule.stop_processing);
    } else {
      setEditingRule(null);
      setRuleName('');
      setConditions([{ field: 'from', operator: 'contains', value: '' }]);
      setActions([{ type: 'move_to_folder' }]);
      setStopProcessing(false);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingRule) {
        await mailRulesService.updateRule(editingRule.id, {
          name: ruleName,
          conditions,
          actions,
          stop_processing: stopProcessing,
        });
        toast.success('Rule updated');
      } else {
        await mailRulesService.createRule({
          account_id: selectedAccountId,
          name: ruleName,
          conditions,
          actions,
          stop_processing: stopProcessing,
        });
        toast.success('Rule created');
      }
      setShowEditor(false);
      await loadRules();
    } catch {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: MailRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await mailRulesService.deleteRule(rule.id);
      toast.success('Rule deleted');
      await loadRules();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (rule: MailRule) => {
    try {
      await mailRulesService.toggleRule(rule.id, !rule.is_active);
      await loadRules();
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { field: 'subject', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const addAction = () => {
    setActions([...actions, { type: 'mark_read' }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    setActions(actions.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  if (accounts.length === 0 && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <Filter className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-2">No mail accounts connected</h3>
          <p className="text-sm text-th-text-secondary">Connect an email account first to create inbox rules</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Inbox Rules</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Automate your inbox with rules that filter, label, and organize messages
          </p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <select
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}
          className="px-3 py-2 border border-th-border rounded-lg text-sm"
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.email_address}</option>
          ))}
        </select>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <Filter className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <h3 className="font-semibold text-th-text-primary mb-1">No rules yet</h3>
          <p className="text-sm text-th-text-secondary">
            Create rules to automatically organize incoming emails
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`bg-surface-primary rounded-xl border border-th-border p-4 ${
                !rule.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-th-text-tertiary cursor-grab" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-th-text-primary">{rule.name}</span>
                      {rule.stop_processing && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                          Stop
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-th-text-tertiary mt-1">
                      <span>
                        {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span>
                        {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                      </span>
                      {rule.times_applied > 0 && (
                        <>
                          <span className="text-th-text-tertiary mx-1">|</span>
                          <span>Applied {rule.times_applied}x</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(rule)}
                    className="p-1.5 hover:bg-surface-secondary rounded-lg"
                    title={rule.is_active ? 'Disable' : 'Enable'}
                  >
                    {rule.is_active ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-th-text-tertiary" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditor(rule)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditor(false)}>
          <div className="bg-surface-primary rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">
              {editingRule ? 'Edit Rule' : 'Create Rule'}
            </h2>

            {/* Rule Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                placeholder="e.g., Move newsletters to folder"
                className="w-full px-3 py-2 border border-th-border rounded-lg text-sm"
              />
            </div>

            {/* Conditions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-th-text-secondary">
                  When ALL of these conditions match:
                </label>
                <button onClick={addCondition} className="text-xs text-th-accent-600 hover:text-th-accent-700">
                  + Add condition
                </button>
              </div>
              <div className="space-y-2">
                {conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={cond.field}
                      onChange={e => updateCondition(i, { field: e.target.value as RuleCondition['field'] })}
                      className="px-2 py-1.5 border border-th-border rounded text-sm"
                    >
                      {CONDITION_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => updateCondition(i, { operator: e.target.value as RuleCondition['operator'] })}
                      className="px-2 py-1.5 border border-th-border rounded text-sm"
                    >
                      {CONDITION_OPERATORS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={e => updateCondition(i, { value: e.target.value })}
                      placeholder="Value..."
                      className="flex-1 px-2 py-1.5 border border-th-border rounded text-sm"
                    />
                    {conditions.length > 1 && (
                      <button onClick={() => removeCondition(i)} className="p-1 text-red-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-th-text-secondary">
                  Then do these actions:
                </label>
                <button onClick={addAction} className="text-xs text-th-accent-600 hover:text-th-accent-700">
                  + Add action
                </button>
              </div>
              <div className="space-y-2">
                {actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={action.type}
                      onChange={e => updateAction(i, { type: e.target.value as RuleAction['type'] })}
                      className="px-2 py-1.5 border border-th-border rounded text-sm"
                    >
                      {ACTION_TYPES.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                    {action.type === 'move_to_folder' && (
                      <select
                        value={action.folder_id || ''}
                        onChange={e => updateAction(i, { folder_id: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-th-border rounded text-sm"
                      >
                        <option value="">Select folder...</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.display_name || f.name}</option>
                        ))}
                      </select>
                    )}
                    {action.type === 'add_label' && (
                      <input
                        type="text"
                        value={action.label || ''}
                        onChange={e => updateAction(i, { label: e.target.value })}
                        placeholder="Label name..."
                        className="flex-1 px-2 py-1.5 border border-th-border rounded text-sm"
                      />
                    )}
                    {action.type === 'forward' && (
                      <input
                        type="email"
                        value={action.forward_to || ''}
                        onChange={e => updateAction(i, { forward_to: e.target.value })}
                        placeholder="Forward to email..."
                        className="flex-1 px-2 py-1.5 border border-th-border rounded text-sm"
                      />
                    )}
                    {actions.length > 1 && (
                      <button onClick={() => removeAction(i)} className="p-1 text-red-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stop processing */}
            <label className="flex items-center gap-2 text-sm text-th-text-secondary mb-6">
              <input
                type="checkbox"
                checked={stopProcessing}
                onChange={e => setStopProcessing(e.target.checked)}
                className="rounded"
              />
              Stop processing more rules after this one matches
            </label>

            {/* Footer */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
