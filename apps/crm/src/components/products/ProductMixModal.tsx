import { Modal } from '../Modal';
import { Layers, Users, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductMixModalProps { open: boolean; onClose: () => void; }

const MOCK = [
  { plan: 'Essentials', deals: 24, contacts: 186, revenue: 74400, dealPct: 32, color: '#3b82f6' },
  { plan: 'MEC+ Essentials', deals: 18, contacts: 142, revenue: 71000, dealPct: 24, color: '#10b981' },
  { plan: 'Care Plus', deals: 14, contacts: 98, revenue: 63700, dealPct: 19, color: '#8b5cf6' },
  { plan: 'Direct', deals: 12, contacts: 64, revenue: 48000, dealPct: 16, color: '#f59e0b' },
  { plan: 'Secure HSA', deals: 7, contacts: 38, revenue: 34200, dealPct: 9, color: '#ef4444' },
];

const MOCK_CROSS = [
  { combo: 'Essentials + Dental', occurrences: 42, pct: 22 },
  { combo: 'Care Plus + Dental', occurrences: 28, pct: 15 },
  { combo: 'Direct + Vision', occurrences: 18, pct: 10 },
];

export function ProductMixModal({ open, onClose }: ProductMixModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalDeals = MOCK.reduce((s, p) => s + p.deals, 0);
  const totalContacts = MOCK.reduce((s, p) => s + p.contacts, 0);

  return (
    <Modal open={open} onClose={onClose} title="Product Mix Analysis" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Layers className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalDeals}</p>
            <p className="text-[10px] text-th-text-tertiary">Active Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalContacts}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Members</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(MOCK.reduce((s, p) => s + p.revenue, 0))}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Revenue</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Plan Mix (by Deals)</p>
          <div className="h-5 rounded-full bg-surface-tertiary overflow-hidden flex">
            {MOCK.map((p) => (
              <div key={p.plan} className="h-full flex items-center justify-center" style={{ width: `${p.dealPct}%`, backgroundColor: p.color }}>
                {p.dealPct > 10 && <span className="text-[8px] font-bold text-white">{p.dealPct}%</span>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {MOCK.map((p) => (<span key={p.plan} className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded" style={{ backgroundColor: p.color }} />{p.plan}</span>))}
          </div>
        </div>

        <div className="space-y-1.5">
          {MOCK.map((p) => (
            <div key={p.plan} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
              <div className="w-2.5 h-6 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-medium text-th-text-primary flex-1">{p.plan}</span>
              <span className="text-[10px] text-th-text-tertiary tabular-nums">{p.deals} deals</span>
              <span className="text-[10px] text-th-text-tertiary tabular-nums">{p.contacts} members</span>
              <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(p.revenue)}</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Cross-Sell Opportunities</p>
          {MOCK_CROSS.map((c) => (
            <div key={c.combo} className="flex items-center gap-2 py-1.5">
              <span className="text-[10px] text-th-text-primary flex-1">{c.combo}</span>
              <div className="w-20 h-2 rounded bg-surface-tertiary overflow-hidden"><div className="h-full rounded bg-violet-500/50" style={{ width: `${c.pct * 3}%` }} /></div>
              <span className="text-[10px] font-bold text-violet-500 tabular-nums">{c.pct}%</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
