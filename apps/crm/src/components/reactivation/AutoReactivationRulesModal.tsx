import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Zap, Plus, Trash2, Save, Play, Pause, Clock, Users,
  Filter, ChevronDown, ChevronRight, AlertTriangle, Check,
  Loader2, Settings, RefreshCw, Shield,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AutoRule {
  id: string;
  name: string;
  trigger: 'days_inactive' | 'stage_stall' | 'no_response' | 'enrollment_dropped';
  triggerValue: number;
  action: 'enroll_cadence' | 'assign_agent' | 'send_email' | 'create_task';
  actionValue: string;
  stageFilter: string;
  isActive: boolean;
  lastTriggered?: string;
  triggeredCount: number;
}

interface AutoReactivationRulesModalProps {
  open: boolean;
  onClose: () => void;
  rules?: AutoRule[];
  onSave?: (rules: AutoRule[]) => Promise<void>;
}

const TRIGGERS = [
  { value: 'days_inactive', label: 'Days Since Last Contact', unit: 'days' },
  { value: 'stage_stall', label: 'Days Stuck in Stage', unit: 'days' },
  { value: 'no_response', label: 'Emails With No Response', unit: 'emails' },
  { value: 'enrollment_dropped', label: 'Dropped From Cadence', unit: '' },
];

const ACTIONS = [
  { value: 'enroll_cadence', label: 'Enroll in Reactivation Cadence' },
  { value: 'assign_agent', label: 'Reassign to Agent' },
  { value: 'send_email', label: 'Send Re-engagement Email' },
  { value: 'create_task', label: 'Create Follow-Up Task' },
];

const STAGES = ['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation'];

const MOCK_RULES: AutoRule[] = [
  { id: '1', name: 'Auto-enroll 90d stale', trigger: 'days_inactive', triggerValue: 90, action: 'enroll_cadence', actionValue: 'Reactivation', stageFilter: 'all', isActive: true, lastTriggered: '2026-04-12', triggeredCount: 23 },
  { id: '2', name: 'Stage stall alert', trigger: 'stage_stall', triggerValue: 30, action: 'create_task', actionValue: 'Follow up on stalled lead', stageFilter: 'qualified', isActive: true, lastTriggered: '2026-04-10', triggeredCount: 8 },
  { id: '3', name: 'No response re-engage', trigger: 'no_response', triggerValue: 3, action: 'send_email', actionValue: 'Re-engagement template', stageFilter: 'contacted', isActive: false, triggeredCount: 0 },
];

export function AutoReactivationRulesModal({ open, onClose, rules: propRules, onSave }: AutoReactivationRulesModalProps) {
  const [rules, setRules] = useState<AutoRule[]>(propRules || MOCK_RULES);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addRule = () => {
    const newRule: AutoRule = {
      id: String(Date.now()), name: 'New Rule', trigger: 'days_inactive', triggerValue: 60,
      action: 'enroll_cadence', actionValue: 'Reactivation', stageFilter: 'all', isActive: false, triggeredCount: 0,
    };
    setRules((prev) => [...prev, newRule]);
    setExpandedRule(newRule.id);
  };

  const updateRule = (id: string, updates: Partial<AutoRule>) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));
  const toggleRule = (id: string) => updateRule(id, { isActive: !rules.find((r) => r.id === id)?.isActive });

  const handleSave = async () => {
    setSaving(true);
    try { await onSave?.(rules); onClose(); }
    catch { /* parent */ }
    finally { setSaving(false); }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <Modal open={open} onClose={onClose} title="Auto-Reactivation Rules" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <Zap className="w-3.5 h-3.5 inline mr-1" />
            <strong>{activeCount}</strong> active rule{activeCount !== 1 ? 's' : ''} automatically monitoring your pipeline for stale leads.
          </p>
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-2">
          {rules.map((rule) => {
            const expanded = expandedRule === rule.id;
            const trigger = TRIGGERS.find((t) => t.value === rule.trigger);
            const action = ACTIONS.find((a) => a.value === rule.action);

            return (
              <div key={rule.id} className={cn('rounded-xl border transition-all', rule.isActive ? 'border-green-500/30' : 'border-th-border/50')}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleRule(rule.id)} className={cn(
                    'w-8 h-5 rounded-full flex items-center shrink-0 transition-colors',
                    rule.isActive ? 'bg-green-500 justify-end' : 'bg-surface-tertiary justify-start'
                  )}>
                    <div className="w-4 h-4 rounded-full bg-white shadow mx-0.5" />
                  </button>
                  <button onClick={() => setExpandedRule(expanded ? null : rule.id)} className="flex-1 text-left flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-th-text-primary">{rule.name}</p>
                      <p className="text-[10px] text-th-text-tertiary">
                        When {trigger?.label?.toLowerCase()} ≥ {rule.triggerValue}{trigger?.unit ? ` ${trigger.unit}` : ''} → {action?.label}
                      </p>
                    </div>
                    {rule.triggeredCount > 0 && (
                      <span className="text-[10px] text-th-text-tertiary tabular-nums">{rule.triggeredCount} triggered</span>
                    )}
                    {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                  </button>
                </div>

                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-th-border/30 space-y-3">
                    <div>
                      <label className="text-[10px] text-th-text-tertiary">Rule Name</label>
                      <input type="text" value={rule.name} onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                        className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Trigger</label>
                        <select value={rule.trigger} onChange={(e) => updateRule(rule.id, { trigger: e.target.value as AutoRule['trigger'] })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Threshold</label>
                        <input type="number" value={rule.triggerValue} onChange={(e) => updateRule(rule.id, { triggerValue: Number(e.target.value) })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Action</label>
                        <select value={rule.action} onChange={(e) => updateRule(rule.id, { action: e.target.value as AutoRule['action'] })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Stage Filter</label>
                        <select value={rule.stageFilter} onChange={(e) => updateRule(rule.id, { stageFilter: e.target.value })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          {STAGES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Stages' : s}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeRule(rule.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete Rule
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={addRule} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
