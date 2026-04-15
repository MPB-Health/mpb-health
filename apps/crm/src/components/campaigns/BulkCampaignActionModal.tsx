import { useState } from 'react';
import { Modal } from '../Modal';
import { CheckSquare, Play, Pause, Archive, Trash2, AlertTriangle, Copy } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MOCK = [
  { id: '1', name: 'Open Enrollment Q2', status: 'active', budget: 4500, members: 142 },
  { id: '2', name: 'Health Fair 2026', status: 'active', budget: 8000, members: 98 },
  { id: '3', name: 'LinkedIn Outreach', status: 'paused', budget: 2500, members: 76 },
  { id: '4', name: 'Google Ads — Plans', status: 'active', budget: 12000, members: 220 },
  { id: '5', name: 'Referral Bonus May', status: 'draft', budget: 3000, members: 0 },
  { id: '6', name: 'Summer Webinar Series', status: 'scheduled', budget: 1800, members: 0 },
];

const ACTIONS = [
  { id: 'activate', label: 'Activate', icon: Play, color: 'text-green-500', desc: 'Start selected campaigns' },
  { id: 'pause', label: 'Pause', icon: Pause, color: 'text-amber-500', desc: 'Pause active campaigns' },
  { id: 'clone', label: 'Clone', icon: Copy, color: 'text-blue-500', desc: 'Duplicate campaigns' },
  { id: 'archive', label: 'Archive', icon: Archive, color: 'text-violet-500', desc: 'Move to archive' },
];

const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', paused: 'bg-yellow-100 text-yellow-700', draft: 'bg-gray-100 text-gray-700', scheduled: 'bg-blue-100 text-blue-700' };

export function BulkCampaignActionModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState('');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK.length ? new Set() : new Set(MOCK.map((c) => c.id)));
  const selectedBudget = MOCK.filter((c) => selected.has(c.id)).reduce((s, c) => s + c.budget, 0);

  return (
    <Modal open={open} onClose={onClose} title="Bulk Campaign Actions" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-[10px] text-th-accent-500 font-medium">{selected.size === MOCK.length ? 'Deselect All' : 'Select All'}</button>
          <span className="text-[10px] text-th-text-tertiary">{selected.size} selected • {fmt(selectedBudget)} budget</span>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {MOCK.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary/50 cursor-pointer">
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-th-accent-500 rounded" />
              <span className="text-xs font-medium text-th-text-primary flex-1 truncate">{c.name}</span>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize', statusColors[c.status] || '')}>{c.status}</span>
              <span className="text-[10px] text-th-text-tertiary tabular-nums">{fmt(c.budget)}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => setAction(a.id)} disabled={selected.size === 0} className={cn('flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all disabled:opacity-30', action === a.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
              <a.icon className={cn('w-4 h-4', a.color)} />
              <div><p className="text-xs font-medium text-th-text-primary">{a.label}</p><p className="text-[9px] text-th-text-tertiary">{a.desc}</p></div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button disabled={selected.size === 0 || !action} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-th-accent-600">Apply to {selected.size} Campaign{selected.size !== 1 ? 's' : ''}</button>
        </div>
      </div>
    </Modal>
  );
}
