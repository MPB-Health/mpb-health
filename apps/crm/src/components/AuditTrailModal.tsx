import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { History, Filter, ArrowRight } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AuditEntry {
  id: string;
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByAvatar?: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'restore';
}

interface AuditTrailModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  recordName: string;
  entries: AuditEntry[];
  loading?: boolean;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Created', color: 'text-green-600 dark:text-green-400 bg-green-500/10' },
  update: { label: 'Updated', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  delete: { label: 'Deleted', color: 'text-red-600 dark:text-red-400 bg-red-500/10' },
  restore: { label: 'Restored', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function AuditTrailModal({
  open, onClose, entityType, recordName, entries, loading,
}: AuditTrailModalProps) {
  const [filterField, setFilterField] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');

  const fields = useMemo(() => {
    const set = new Set(entries.map((e) => e.fieldLabel));
    return Array.from(set).sort();
  }, [entries]);

  const users = useMemo(() => {
    const set = new Set(entries.map((e) => e.changedBy));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterField && e.fieldLabel !== filterField) return false;
      if (filterUser && e.changedBy !== filterUser) return false;
      return true;
    });
  }, [entries, filterField, filterUser]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, AuditEntry[]>();
    filtered.forEach((e) => {
      const date = new Date(e.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      const arr = groups.get(date) || [];
      arr.push(e);
      groups.set(date, arr);
    });
    return Array.from(groups.entries());
  }, [filtered]);

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Audit Trail — ${recordName}`} size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary">
          <History className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-text-secondary">
            Field-level change history for this {entityLabel.toLowerCase()}. {entries.length} total changes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary shrink-0" />
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="text-xs rounded-lg border border-th-border/50 bg-surface-secondary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
          >
            <option value="">All fields</option>
            {fields.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="text-xs rounded-lg border border-th-border/50 bg-surface-secondary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
          >
            <option value="">All users</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {(filterField || filterUser) && (
            <button
              onClick={() => { setFilterField(''); setFilterUser(''); }}
              className="text-xs text-th-accent-500 hover:text-th-accent-600"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-th-text-tertiary tabular-nums">
            {filtered.length} change{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timeline */}
        <div className="max-h-[360px] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-500" />
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-th-text-tertiary text-center py-8">No changes found</p>
          ) : (
            grouped.map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">{date}</p>
                <div className="space-y-2">
                  {items.map((entry) => {
                    const actionStyle = ACTION_LABELS[entry.action] || ACTION_LABELS.update;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-th-border/30 hover:border-th-border/50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-surface-tertiary flex items-center justify-center shrink-0 text-[10px] font-semibold text-th-text-secondary mt-0.5">
                          {entry.changedBy.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-th-text-primary">{entry.changedBy}</span>
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', actionStyle.color)}>
                              {actionStyle.label}
                            </span>
                            <span className="text-xs font-medium text-th-accent-500">{entry.fieldLabel}</span>
                          </div>
                          {entry.action === 'update' && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs">
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 line-through max-w-[140px] truncate">
                                {entry.oldValue || '(empty)'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-th-text-tertiary shrink-0" />
                              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 max-w-[140px] truncate">
                                {entry.newValue || '(empty)'}
                              </span>
                            </div>
                          )}
                          {entry.action === 'create' && (
                            <p className="text-xs text-th-text-tertiary mt-1">
                              Set to: <span className="text-th-text-secondary">{entry.newValue}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-th-text-tertiary shrink-0 mt-1">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
