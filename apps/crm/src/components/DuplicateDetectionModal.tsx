import { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, GitMerge, X, Check } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DuplicateMatch {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  matchScore: number;
  matchReasons: string[];
  createdAt: string;
}

interface DuplicateDetectionModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  newRecordName: string;
  duplicates: DuplicateMatch[];
  onMerge: (duplicateId: string) => void;
  onSkip: () => void;
}

export function DuplicateDetectionModal({
  open, onClose, entityType, newRecordName, duplicates, onMerge, onSkip,
}: DuplicateDetectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scoreColor = (score: number) => {
    if (score >= 90) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title="Potential Duplicates Found" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            We found <span className="font-semibold">{duplicates.length}</span> potential duplicate{duplicates.length !== 1 ? 's' : ''} for <span className="font-semibold">{newRecordName}</span>.
          </p>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {duplicates.map((dup) => (
            <label
              key={dup.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                selectedId === dup.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-border'
              )}
            >
              <input
                type="radio"
                name="duplicate"
                checked={selectedId === dup.id}
                onChange={() => setSelectedId(dup.id)}
                className="mt-1 text-th-accent-500 focus:ring-th-accent-500/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-th-text-primary">{dup.name}</span>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', scoreColor(dup.matchScore))}>
                    {dup.matchScore}% match
                  </span>
                </div>
                <p className="text-xs text-th-text-tertiary mt-0.5">
                  {[dup.email, dup.phone].filter(Boolean).join(' · ')}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {dup.matchReasons.map((reason) => (
                    <span key={reason} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-th-text-tertiary">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-th-text-tertiary shrink-0">{dup.createdAt}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Not a Duplicate
          </button>
          <button
            onClick={() => selectedId && onMerge(selectedId)}
            disabled={!selectedId}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <GitMerge className="w-4 h-4" />
            Merge with Selected
          </button>
        </div>
      </div>
    </Modal>
  );
}
