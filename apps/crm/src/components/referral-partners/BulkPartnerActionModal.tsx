import { useState } from 'react';
import { Modal } from '../Modal';
import { CheckSquare, Play, Pause, Tag, Trash2 } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MOCK = [
  { id: '1', name: 'Jane Roberts', type: 'CPA', active: true, referrals: 42 },
  { id: '2', name: 'Tom Chen', type: 'Financial Advisor', active: true, referrals: 36 },
  { id: '3', name: 'Sarah Kim', type: 'HR Consultant', active: true, referrals: 28 },
  { id: '4', name: 'Mike Johnson', type: 'Attorney', active: false, referrals: 22 },
  { id: '5', name: 'ADP Payroll', type: 'Payroll', active: true, referrals: 18 },
  { id: '6', name: 'David Lee', type: 'Financial Advisor', active: false, referrals: 12 },
];

const ACTIONS = [
  { id: 'activate', label: 'Activate', icon: Play, color: 'text-green-500', desc: 'Set partners as active' },
  { id: 'deactivate', label: 'Deactivate', icon: Pause, color: 'text-amber-500', desc: 'Set partners as inactive' },
  { id: 'tag', label: 'Add Tag', icon: Tag, color: 'text-blue-500', desc: 'Apply a tag to partners' },
  { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-500', desc: 'Remove partners' },
];

export function BulkPartnerActionModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState('');
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK.length ? new Set() : new Set(MOCK.map((p) => p.id)));

  return (
    <Modal open={open} onClose={onClose} title="Bulk Partner Actions" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-[10px] text-th-accent-500 font-medium">{selected.size === MOCK.length ? 'Deselect All' : 'Select All'}</button>
          <span className="text-[10px] text-th-text-tertiary">{selected.size} of {MOCK.length} selected</span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {MOCK.map((p) => (
            <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-th-accent-500 rounded" />
              <span className="text-xs font-medium text-th-text-primary flex-1">{p.name}</span>
              <span className="text-[9px] text-th-text-tertiary">{p.type}</span>
              <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium', p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{p.active ? 'Active' : 'Inactive'}</span>
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
