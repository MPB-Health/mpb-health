import { useState } from 'react';
import { Modal } from '../Modal';
import { CheckSquare, CheckCircle2, UserPlus, Calendar, Trash2, Clock } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MOCK = [
  { id: '1', title: 'Call Brett Baker — Quick Rate follow-up', lead: 'Brett Baker', due: 'Today', priority: 'high' as const },
  { id: '2', title: 'Send quote to Acme Corp', lead: 'Acme Corp', due: 'Today', priority: 'high' as const },
  { id: '3', title: 'Follow-up enrollment — TechStart', lead: 'TechStart LLC', due: 'Tomorrow', priority: 'medium' as const },
  { id: '4', title: 'Document request — Baker HSA', lead: 'Brett Baker', due: 'Apr 16', priority: 'low' as const },
  { id: '5', title: 'Midwest Mfg follow-up (OVERDUE)', lead: 'Midwest Mfg', due: '3d overdue', priority: 'high' as const },
  { id: '6', title: 'Partner commission review', lead: 'Partners', due: 'Apr 18', priority: 'medium' as const },
];

const ACTIONS = [
  { id: 'complete', label: 'Complete', icon: CheckCircle2, color: 'text-green-500', desc: 'Mark as completed' },
  { id: 'reassign', label: 'Reassign', icon: UserPlus, color: 'text-blue-500', desc: 'Change assigned rep' },
  { id: 'reschedule', label: 'Reschedule', icon: Calendar, color: 'text-amber-500', desc: 'Change due date' },
  { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-500', desc: 'Remove tasks' },
];

const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' };

export function BulkTaskActionModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState('');
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK.length ? new Set() : new Set(MOCK.map((t) => t.id)));

  return (
    <Modal open={open} onClose={onClose} title="Bulk Task Actions" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-[10px] text-th-accent-500 font-medium">{selected.size === MOCK.length ? 'Deselect All' : 'Select All'}</button>
          <span className="text-[10px] text-th-text-tertiary">{selected.size} of {MOCK.length} selected</span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {MOCK.map((t) => (
            <label key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="accent-th-accent-500 rounded" />
              <span className="text-xs font-medium text-th-text-primary flex-1 truncate">{t.title}</span>
              <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium', priorityColors[t.priority])}>{t.priority}</span>
              <span className={cn('text-[9px]', t.due.includes('overdue') ? 'text-red-500 font-bold' : 'text-th-text-tertiary')}>{t.due}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => setAction(a.id)} disabled={selected.size === 0} className={cn('flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all disabled:opacity-30', action === a.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
              <a.icon className={cn('w-4 h-4', a.color)} /><div><p className="text-xs font-medium text-th-text-primary">{a.label}</p><p className="text-[9px] text-th-text-tertiary">{a.desc}</p></div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button disabled={selected.size === 0 || !action} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50', action === 'delete' ? 'bg-red-500' : 'bg-th-accent-500')}>Apply to {selected.size}</button>
        </div>
      </div>
    </Modal>
  );
}
