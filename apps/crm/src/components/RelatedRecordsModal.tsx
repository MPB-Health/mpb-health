import { useState } from 'react';
import { Modal } from './Modal';
import { Link2, Search, Check, Plus } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface RelatedRecord {
  id: string;
  name: string;
  type: 'contact' | 'account' | 'deal' | 'lead';
  subtitle?: string;
  alreadyLinked?: boolean;
}

interface RelatedRecordsModalProps {
  open: boolean;
  onClose: () => void;
  sourceEntityType: string;
  sourceRecordName: string;
  targetEntityType: string;
  records: RelatedRecord[];
  onLink: (recordIds: string[]) => Promise<void>;
  loading?: boolean;
}

export function RelatedRecordsModal({
  open, onClose, sourceEntityType, sourceRecordName, targetEntityType, records, onLink, loading,
}: RelatedRecordsModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);

  const filtered = records.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLink = async () => {
    setLinking(true);
    try {
      await onLink(Array.from(selected));
      onClose();
    } catch {
      // parent handles
    } finally {
      setLinking(false);
    }
  };

  const targetLabel = targetEntityType.charAt(0).toUpperCase() + targetEntityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Link ${targetLabel}s to ${sourceRecordName}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-th-accent-500/10 border border-th-accent-500/20">
          <Link2 className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-accent-600 dark:text-th-accent-400">
            Associate {targetLabel.toLowerCase()} records with this {sourceEntityType.toLowerCase()}.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${targetLabel.toLowerCase()}s...`}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-th-border/50 bg-surface-secondary focus:border-th-accent-500/50 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-th-text-tertiary text-center py-8">
              {search ? 'No records match your search' : `No ${targetLabel.toLowerCase()}s available`}
            </p>
          ) : (
            filtered.map((record) => (
              <label
                key={record.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  record.alreadyLinked ? 'border-green-500/20 bg-green-500/5 cursor-default' :
                  selected.has(record.id) ? 'border-th-accent-500/30 bg-th-accent-500/5 cursor-pointer' :
                  'border-th-border/50 hover:border-th-border cursor-pointer'
                )}
              >
                {record.alreadyLinked ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <input
                    type="checkbox"
                    checked={selected.has(record.id)}
                    onChange={() => toggle(record.id)}
                    className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-th-text-primary">{record.name}</p>
                  {record.subtitle && <p className="text-xs text-th-text-tertiary">{record.subtitle}</p>}
                </div>
                {record.alreadyLinked && (
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Linked</span>
                )}
              </label>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button
            onClick={handleLink}
            disabled={linking || selected.size === 0}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            {linking ? 'Linking...' : `Link ${selected.size} Record${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
