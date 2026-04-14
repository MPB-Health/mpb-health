import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { GitMerge, Search, Check, AlertTriangle, ArrowRight } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FieldValue {
  field: string;
  label: string;
  values: string[];
}

interface DuplicateRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  source?: string;
  score?: number;
  fields: Record<string, string>;
}

interface MergeRecordsModalProps {
  open: boolean;
  onClose: () => void;
  entityType: 'lead' | 'contact' | 'account';
  primaryRecord: DuplicateRecord;
  duplicates: DuplicateRecord[];
  onMerge: (primaryId: string, mergedFields: Record<string, string>, duplicateIds: string[]) => Promise<void>;
}

export function MergeRecordsModal({
  open, onClose, entityType, primaryRecord, duplicates, onMerge,
}: MergeRecordsModalProps) {
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(
    new Set(duplicates.map((d) => d.id))
  );
  const [step, setStep] = useState<'select' | 'resolve' | 'confirm'>('select');
  const [mergedFields, setMergedFields] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState(false);
  const [search, setSearch] = useState('');

  const allRecords = useMemo(
    () => [primaryRecord, ...duplicates],
    [primaryRecord, duplicates]
  );

  const conflictFields = useMemo(() => {
    const selected = allRecords.filter(
      (r) => r.id === primaryRecord.id || selectedDuplicates.has(r.id)
    );
    const fields: FieldValue[] = [];
    const allFields = new Set<string>();
    selected.forEach((r) => Object.keys(r.fields).forEach((k) => allFields.add(k)));

    allFields.forEach((field) => {
      const values = selected.map((r) => r.fields[field] || '').filter(Boolean);
      const unique = [...new Set(values)];
      if (unique.length > 1) {
        fields.push({ field, label: field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), values: unique });
      }
    });
    return fields;
  }, [allRecords, selectedDuplicates, primaryRecord.id]);

  const toggleDuplicate = (id: string) => {
    setSelectedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      await onMerge(primaryRecord.id, mergedFields, Array.from(selectedDuplicates));
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setMerging(false);
    }
  };

  const filteredDuplicates = duplicates.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Merge ${entityLabel}s`} size="xl">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {['Select Duplicates', 'Resolve Conflicts', 'Confirm'].map((label, i) => {
            const stepId = ['select', 'resolve', 'confirm'][i];
            const isActive = step === stepId;
            const isPast = ['select', 'resolve', 'confirm'].indexOf(step) > i;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-3 h-3 text-th-text-tertiary" />}
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  isActive ? 'bg-th-accent-500 text-white' : isPast ? 'bg-green-500/10 text-green-600' : 'bg-surface-tertiary text-th-text-tertiary'
                )}>
                  {isPast && <Check className="w-3 h-3 inline mr-1" />}
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {step === 'select' && (
          <>
            {/* Primary record */}
            <div className="p-3 rounded-xl border-2 border-th-accent-500/30 bg-th-accent-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-th-accent-500 font-semibold">Primary Record</span>
                  <p className="text-sm font-semibold text-th-text-primary">{primaryRecord.name}</p>
                  <p className="text-xs text-th-text-tertiary">{primaryRecord.email} · {primaryRecord.phone}</p>
                </div>
                <GitMerge className="w-5 h-5 text-th-accent-500" />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search duplicates..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-th-border/50 bg-surface-secondary focus:border-th-accent-500/50 focus:outline-none"
              />
            </div>

            {/* Duplicates list */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {filteredDuplicates.map((dup) => (
                <label
                  key={dup.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    selectedDuplicates.has(dup.id) ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-border'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedDuplicates.has(dup.id)}
                    onChange={() => toggleDuplicate(dup.id)}
                    className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary">{dup.name}</p>
                    <p className="text-xs text-th-text-tertiary truncate">{dup.email} · {dup.phone}</p>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary">{dup.createdAt}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setStep(conflictFields.length > 0 ? 'resolve' : 'confirm')}
              disabled={selectedDuplicates.size === 0}
              className="w-full py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue ({selectedDuplicates.size} selected)
            </button>
          </>
        )}

        {step === 'resolve' && (
          <>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {conflictFields.length} field{conflictFields.length !== 1 ? 's have' : ' has'} conflicting values. Choose which to keep.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {conflictFields.map((cf) => (
                <div key={cf.field} className="space-y-1.5">
                  <label className="text-xs font-semibold text-th-text-secondary">{cf.label}</label>
                  <div className="space-y-1">
                    {cf.values.map((val) => (
                      <label
                        key={val}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm',
                          mergedFields[cf.field] === val ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                        )}
                      >
                        <input
                          type="radio"
                          name={cf.field}
                          checked={mergedFields[cf.field] === val}
                          onChange={() => setMergedFields((prev) => ({ ...prev, [cf.field]: val }))}
                          className="text-th-accent-500 focus:ring-th-accent-500/40"
                        />
                        <span className="text-th-text-primary">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('select')} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                Back
              </button>
              <button onClick={() => setStep('confirm')} className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="p-4 rounded-xl bg-surface-secondary space-y-3">
              <p className="text-sm font-semibold text-th-text-primary">Merge Summary</p>
              <div className="text-xs text-th-text-secondary space-y-1">
                <p>Primary: <span className="font-medium text-th-text-primary">{primaryRecord.name}</span></p>
                <p>Merging: <span className="font-medium text-th-text-primary">{selectedDuplicates.size} duplicate record{selectedDuplicates.size !== 1 ? 's' : ''}</span></p>
                <p>Conflicts resolved: <span className="font-medium text-th-text-primary">{Object.keys(mergedFields).length}</span></p>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  Duplicate records will be permanently deleted. All activities and notes will be moved to the primary record.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('resolve')} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                Back
              </button>
              <button
                onClick={handleMerge}
                disabled={merging}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <GitMerge className="w-4 h-4" />
                {merging ? 'Merging...' : 'Merge Records'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
