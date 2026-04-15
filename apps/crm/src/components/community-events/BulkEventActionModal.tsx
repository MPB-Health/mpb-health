import { useState } from 'react';
import { Modal } from '../Modal';
import { CheckSquare, Copy, Trash2, Tag, Archive } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MOCK = [
  { id: '1', name: 'Grace Community Fellowship', type: 'Church Partnership', date: 'Apr 12', leads: 12 },
  { id: '2', name: 'Downtown Health Expo', type: 'Health Fair', date: 'Apr 8', leads: 18 },
  { id: '3', name: 'Spring Marathon Booth', type: 'Hydration Booth', date: 'Mar 22', leads: 10 },
  { id: '4', name: 'Metro Chamber Mixer', type: 'Chamber / BNI', date: 'Mar 15', leads: 11 },
  { id: '5', name: 'United Way Partnership Day', type: 'Co-sponsored', date: 'Mar 5', leads: 16 },
  { id: '6', name: 'Riverbank 5K Hydration', type: 'Hydration Booth', date: 'Feb 20', leads: 6 },
];

const ACTIONS = [
  { id: 'duplicate', label: 'Duplicate', icon: Copy, color: 'text-blue-500', desc: 'Clone events as templates' },
  { id: 'tag', label: 'Add Tag', icon: Tag, color: 'text-green-500', desc: 'Apply tags for organization' },
  { id: 'archive', label: 'Archive', icon: Archive, color: 'text-amber-500', desc: 'Move to archive' },
  { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-500', desc: 'Remove events permanently' },
];

export function BulkEventActionModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState('');
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK.length ? new Set() : new Set(MOCK.map((e) => e.id)));

  return (
    <Modal open={open} onClose={onClose} title="Bulk Event Actions" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-[10px] text-th-accent-500 font-medium">{selected.size === MOCK.length ? 'Deselect All' : 'Select All'}</button>
          <span className="text-[10px] text-th-text-tertiary">{selected.size} of {MOCK.length} selected</span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {MOCK.map((e) => (
            <label key={e.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} className="accent-th-accent-500 rounded" />
              <span className="text-xs font-medium text-th-text-primary flex-1">{e.name}</span>
              <span className="text-[9px] text-th-text-tertiary">{e.type}</span>
              <span className="text-[9px] text-th-text-tertiary">{e.date}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{e.leads} leads</span>
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
