import { useState } from 'react';
import { Modal } from './Modal';
import { Zap, Plus, Trash2, Save, GripVertical } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ScoringRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_not_set';
  value: string;
  points: number;
}

interface ScoringRulesModalProps {
  open: boolean;
  onClose: () => void;
  entityType: 'lead' | 'deal';
  rules: ScoringRule[];
  onSave: (rules: ScoringRule[]) => Promise<void>;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_set', label: 'Is set' },
  { value: 'is_not_set', label: 'Is not set' },
];

const LEAD_FIELDS = [
  { value: 'source', label: 'Lead Source' },
  { value: 'pipeline_stage', label: 'Pipeline Stage' },
  { value: 'priority', label: 'Priority' },
  { value: 'plan_type', label: 'Plan Type' },
  { value: 'state', label: 'State' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'age', label: 'Age' },
];

const DEAL_FIELDS = [
  { value: 'amount', label: 'Deal Amount' },
  { value: 'stage_id', label: 'Stage' },
  { value: 'probability', label: 'Probability' },
  { value: 'deal_type', label: 'Deal Type' },
];

export function ScoringRulesModal({ open, onClose, entityType, rules: initialRules, onSave }: ScoringRulesModalProps) {
  const [rules, setRules] = useState<ScoringRule[]>(initialRules);
  const [saving, setSaving] = useState(false);

  const fields = entityType === 'lead' ? LEAD_FIELDS : DEAL_FIELDS;

  const addRule = () => {
    setRules((prev) => [...prev, {
      id: String(Date.now()),
      field: '',
      operator: 'equals',
      value: '',
      points: 10,
    }]);
  };

  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));

  const updateRule = (id: string, updates: Partial<ScoringRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rules.filter((r) => r.field));
      onClose();
    } catch {
      // parent handles
    } finally {
      setSaving(false);
    }
  };

  const totalMaxPoints = rules.reduce((sum, r) => sum + Math.abs(r.points), 0);

  return (
    <Modal open={open} onClose={onClose} title={`${entityType === 'lead' ? 'Lead' : 'Deal'} Scoring Rules`} size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-th-text-secondary">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Max score: <span className="font-semibold tabular-nums">{totalMaxPoints}</span> points across {rules.length} rules</span>
          </div>
          <button onClick={addRule} className="flex items-center gap-1.5 text-xs font-medium text-th-accent-500 hover:text-th-accent-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-th-text-tertiary">No scoring rules defined yet</p>
              <button onClick={addRule} className="mt-2 text-sm text-th-accent-500 hover:text-th-accent-600">
                Add your first rule
              </button>
            </div>
          ) : (
            rules.map((rule, idx) => {
              const needsValue = !['is_set', 'is_not_set'].includes(rule.operator);
              return (
                <div key={rule.id} className="flex items-start gap-2 p-3 rounded-xl border border-th-border/50 bg-surface-secondary/30">
                  <GripVertical className="w-4 h-4 text-th-text-tertiary mt-2 shrink-0 cursor-grab" />
                  <div className="flex-1 grid grid-cols-[1fr_1fr_1fr_80px] gap-2">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                      className="text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
                    >
                      <option value="">Field...</option>
                      {fields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value as ScoringRule['operator'] })}
                      className="text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
                    >
                      {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {needsValue ? (
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        placeholder="Value..."
                        className="text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
                      />
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={rule.points}
                        onChange={(e) => updateRule(rule.id, { points: parseInt(e.target.value) || 0 })}
                        className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 text-center tabular-nums focus:border-th-accent-500/50 focus:outline-none"
                      />
                      <span className="text-[10px] text-th-text-tertiary shrink-0">pts</span>
                    </div>
                  </div>
                  <button onClick={() => removeRule(rule.id)} className="p-1.5 text-th-text-tertiary hover:text-red-500 transition-colors mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
