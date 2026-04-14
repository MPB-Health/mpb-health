import { useState } from 'react';
import { Modal } from './Modal';
import { Sparkles, Check, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface EnrichmentField {
  field: string;
  label: string;
  currentValue: string;
  suggestedValue: string;
  confidence: number;
  source: string;
}

interface DataEnrichmentModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  recordName: string;
  recordId: string;
  suggestions: EnrichmentField[];
  loading?: boolean;
  onEnrich: (fields: { field: string; value: string }[]) => Promise<void>;
  onRefresh?: () => void;
}

export function DataEnrichmentModal({
  open, onClose, entityType, recordName, recordId, suggestions, loading, onEnrich, onRefresh,
}: DataEnrichmentModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(suggestions.map((s) => s.field)));
  const [enriching, setEnriching] = useState(false);

  const toggle = (field: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const fields = suggestions
        .filter((s) => selected.has(s.field))
        .map((s) => ({ field: s.field, value: s.suggestedValue }));
      await onEnrich(fields);
      onClose();
    } catch {
      // parent handles
    } finally {
      setEnriching(false);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-green-600 dark:text-green-400 bg-green-500/10';
    if (c >= 0.5) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
    return 'text-red-600 dark:text-red-400 bg-red-500/10';
  };

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`AI Data Enrichment — ${recordName}`} size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-th-accent-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              AI-powered enrichment found <span className="font-semibold">{suggestions.length}</span> field suggestions for this {entityLabel.toLowerCase()}.
            </p>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors" title="Re-scan">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-th-accent-500 animate-spin" />
            <span className="ml-2 text-sm text-th-text-secondary">Scanning external data sources...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-th-text-secondary">All fields are up to date. No enrichment needed.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {suggestions.map((s) => (
              <label
                key={s.field}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  selected.has(s.field) ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.field)}
                  onChange={() => toggle(s.field)}
                  className="mt-1 w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-th-text-primary">{s.label}</span>
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', confidenceColor(s.confidence))}>
                      {Math.round(s.confidence * 100)}% confident
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-th-text-tertiary">{s.currentValue || '(empty)'}</span>
                    <span className="text-th-text-tertiary">→</span>
                    <span className="font-medium text-th-accent-500">{s.suggestedValue}</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary mt-0.5">Source: {s.source}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Skip</button>
            <button
              onClick={handleEnrich}
              disabled={enriching || selected.size === 0}
              className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {enriching ? 'Enriching...' : `Apply ${selected.size} Updates`}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
