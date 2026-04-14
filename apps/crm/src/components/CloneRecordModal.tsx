import { useState } from 'react';
import { Modal } from './Modal';
import { Copy, Check } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FieldOverride {
  name: string;
  label: string;
  value: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  editable: boolean;
}

interface CloneRecordModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  recordName: string;
  fields: FieldOverride[];
  onClone: (overrides: Record<string, string>, options: { includeNotes: boolean; includeActivities: boolean }) => Promise<void>;
}

export function CloneRecordModal({
  open, onClose, entityType, recordName, fields, onClone,
}: CloneRecordModalProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => { initial[f.name] = f.value; });
    return initial;
  });
  const [cloning, setCloning] = useState(false);
  const [includeActivities, setIncludeActivities] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);

  const handleClone = async () => {
    setCloning(true);
    try {
      await onClone(overrides, { includeNotes, includeActivities });
      onClose();
    } catch {
      // parent handles
    } finally {
      setCloning(false);
    }
  };

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Clone ${entityLabel}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-th-accent-500/10 border border-th-accent-500/20">
          <Copy className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-accent-600 dark:text-th-accent-400">
            Create a copy of <span className="font-semibold">{recordName}</span>. Modify fields before cloning.
          </p>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {fields.filter((f) => f.editable).map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-xs font-semibold text-th-text-secondary">{field.label}</label>
              {field.type === 'select' && field.options ? (
                <select
                  value={overrides[field.name] || ''}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                >
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  value={overrides[field.name] || ''}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={overrides[field.name] || ''}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Clone options */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-th-text-secondary">Clone Options</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
            />
            <span className="text-sm text-th-text-secondary">Include notes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeActivities}
              onChange={(e) => setIncludeActivities(e.target.checked)}
              className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
            />
            <span className="text-sm text-th-text-secondary">Include activity history</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={cloning}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cloning ? (
              <>Cloning...</>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Clone {entityLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
