import { useState } from 'react';
import { Modal } from './Modal';
import { RefreshCw, Plus, Trash2, AlertTriangle } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
}

interface UpdateRule {
  id: string;
  field: string;
  value: string;
}

interface MassUpdateModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  selectedCount: number;
  fields: FieldDefinition[];
  onUpdate: (updates: { field: string; value: string }[]) => Promise<void>;
}

export function MassUpdateModal({
  open, onClose, entityType, selectedCount, fields, onUpdate,
}: MassUpdateModalProps) {
  const [rules, setRules] = useState<UpdateRule[]>([
    { id: '1', field: '', value: '' },
  ]);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const addRule = () => {
    setRules((prev) => [...prev, { id: String(Date.now()), field: '', value: '' }]);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, key: 'field' | 'value', val: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  };

  const validRules = rules.filter((r) => r.field && r.value);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await onUpdate(validRules.map((r) => ({ field: r.field, value: r.value })));
      onClose();
    } catch {
      // parent handles error
    } finally {
      setUpdating(false);
      setShowConfirm(false);
    }
  };

  const getFieldDef = (name: string) => fields.find((f) => f.name === name);

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Mass Update ${entityLabel}s`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-th-accent-500/10 border border-th-accent-500/20">
          <RefreshCw className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-accent-600 dark:text-th-accent-400">
            Update <span className="font-semibold">{selectedCount}</span> {entityLabel.toLowerCase()}{selectedCount !== 1 ? 's' : ''} at once
          </p>
        </div>

        {!showConfirm ? (
          <>
            <div className="space-y-3">
              {rules.map((rule, index) => {
                const fieldDef = getFieldDef(rule.field);
                return (
                  <div key={rule.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-th-text-tertiary w-4 shrink-0 tabular-nums">{index + 1}.</span>
                        <select
                          value={rule.field}
                          onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                          className="flex-1 text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                        >
                          <option value="">Select field...</option>
                          {fields.map((f) => (
                            <option key={f.name} value={f.name} disabled={rules.some((r) => r.id !== rule.id && r.field === f.name)}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {rule.field && (
                        <div className="ml-6">
                          {fieldDef?.type === 'select' && fieldDef.options ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                            >
                              <option value="">Select value...</option>
                              {fieldDef.options.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          ) : fieldDef?.type === 'date' ? (
                            <input
                              type="date"
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                            />
                          ) : (
                            <input
                              type={fieldDef?.type === 'number' ? 'number' : 'text'}
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                              placeholder="Enter new value..."
                              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {rules.length > 1 && (
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="p-2 text-th-text-tertiary hover:text-red-500 transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={addRule}
              className="flex items-center gap-2 text-xs font-medium text-th-accent-500 hover:text-th-accent-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another field
            </button>

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                Cancel
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={validRules.length === 0}
                className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Changes
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-surface-secondary space-y-3">
              <p className="text-sm font-semibold text-th-text-primary">Changes to Apply</p>
              {validRules.map((rule) => {
                const fieldDef = getFieldDef(rule.field);
                return (
                  <div key={rule.id} className="flex items-center gap-2 text-sm">
                    <span className="text-th-text-secondary">{fieldDef?.label || rule.field}:</span>
                    <span className="font-medium text-th-text-primary">{rule.value}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This will update {selectedCount} record{selectedCount !== 1 ? 's' : ''}. This action cannot be easily undone.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                Back
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={cn('w-4 h-4', updating && 'animate-spin')} />
                {updating ? 'Updating...' : `Update ${selectedCount} Records`}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
