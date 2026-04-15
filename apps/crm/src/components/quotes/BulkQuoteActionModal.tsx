import { useState } from 'react';
import { Modal } from '../Modal';
import { CheckSquare, Send, XCircle, Copy, Trash2, AlertTriangle, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface BulkQuoteActionModalProps { open: boolean; onClose: () => void; }

const MOCK_QUOTES = [
  { id: '1', name: 'Q-2024-089 — Acme Corp', value: 12500, status: 'pending' },
  { id: '2', name: 'Q-2024-091 — BrightCare', value: 24800, status: 'sent' },
  { id: '3', name: 'Q-2024-094 — Wellness Group', value: 9100, status: 'pending' },
  { id: '4', name: 'Q-2024-082 — HealthFirst Inc', value: 15800, status: 'draft' },
  { id: '5', name: 'Q-2024-076 — TechStart LLC', value: 8400, status: 'sent' },
  { id: '6', name: 'Q-2024-098 — FitLife Partners', value: 6200, status: 'draft' },
];

const ACTIONS = [
  { id: 'send', label: 'Send Selected', icon: Send, color: 'text-blue-500', description: 'Send quotes to clients' },
  { id: 'expire', label: 'Mark Expired', icon: XCircle, color: 'text-amber-500', description: 'Close as expired' },
  { id: 'clone', label: 'Clone Selected', icon: Copy, color: 'text-violet-500', description: 'Create copies' },
  { id: 'delete', label: 'Delete Selected', icon: Trash2, color: 'text-red-500', description: 'Remove permanently' },
];

export function BulkQuoteActionModal({ open, onClose }: BulkQuoteActionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState('');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK_QUOTES.length ? new Set() : new Set(MOCK_QUOTES.map((q) => q.id)));
  const selectedValue = MOCK_QUOTES.filter((q) => selected.has(q.id)).reduce((s, q) => s + q.value, 0);

  return (
    <Modal open={open} onClose={onClose} title="Bulk Quote Actions" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-[10px] text-th-accent-500 font-medium">{selected.size === MOCK_QUOTES.length ? 'Deselect All' : 'Select All'}</button>
          <span className="text-[10px] text-th-text-tertiary">{selected.size} of {MOCK_QUOTES.length} selected • {fmt(selectedValue)}</span>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {MOCK_QUOTES.map((q) => (
            <label key={q.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="accent-th-accent-500 rounded" />
              <span className="text-xs font-medium text-th-text-primary flex-1 truncate">{q.name}</span>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize',
                q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : q.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              )}>{q.status}</span>
              <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(q.value)}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => setAction(a.id)} disabled={selected.size === 0} className={cn('flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all disabled:opacity-30', action === a.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-border')}>
              <a.icon className={cn('w-4 h-4 shrink-0', a.color)} />
              <div>
                <p className="text-xs font-medium text-th-text-primary">{a.label}</p>
                <p className="text-[9px] text-th-text-tertiary">{a.description}</p>
              </div>
            </button>
          ))}
        </div>

        {action === 'delete' && selected.size > 0 && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[10px] text-red-700 dark:text-red-300">This will permanently delete {selected.size} quote{selected.size > 1 ? 's' : ''} worth {fmt(selectedValue)}. This cannot be undone.</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button disabled={selected.size === 0 || !action} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors', action === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-th-accent-500 hover:bg-th-accent-600')}>
            Apply to {selected.size} Quote{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}
