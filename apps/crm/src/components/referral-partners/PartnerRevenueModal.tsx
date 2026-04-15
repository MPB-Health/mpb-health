import { Modal } from '../Modal';
import { DollarSign, PieChart, TrendingUp, Sparkles, Wallet } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const PARTNERS = [
  { name: 'Jane Roberts', revenue: 28800, commission: 2880, paidOut: 2160, pending: 720, rate: 10, color: '#3b82f6' },
  { name: 'Tom Chen', revenue: 22400, commission: 2240, paidOut: 2240, pending: 0, rate: 10, color: '#10b981' },
  { name: 'Sarah Kim', revenue: 19200, commission: 1920, paidOut: 1440, pending: 480, rate: 10, color: '#8b5cf6' },
  { name: 'ADP Payroll', revenue: 16000, commission: 2400, paidOut: 1800, pending: 600, rate: 15, color: '#ef4444' },
  { name: 'Mike Johnson', revenue: 12800, commission: 1280, paidOut: 960, pending: 320, rate: 10, color: '#f59e0b' },
];

export function PartnerRevenueModal({ open, onClose }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalRevenue = PARTNERS.reduce((s, p) => s + p.revenue, 0);
  const totalCommission = PARTNERS.reduce((s, p) => s + p.commission, 0);
  const totalPending = PARTNERS.reduce((s, p) => s + p.pending, 0);
  const maxRevenue = Math.max(...PARTNERS.map((p) => p.revenue), 1);

  return (
    <Modal open={open} onClose={onClose} title="Partner Revenue & Commissions" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Commissions', value: fmt(totalCommission), icon: Wallet, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Pending Payout', value: fmt(totalPending), icon: PieChart, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Avg Rate', value: '10.8%', icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {PARTNERS.map((p) => (
            <div key={p.name} className="p-2.5 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{p.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{p.rate}% rate</span>
              </div>
              <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${(p.revenue / maxRevenue) * 100}%`, backgroundColor: p.color }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(p.revenue)}</p><p className="text-[7px] text-th-text-tertiary">Revenue</p></div>
                <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{fmt(p.commission)}</p><p className="text-[7px] text-th-text-tertiary">Commission</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(p.paidOut)}</p><p className="text-[7px] text-th-text-tertiary">Paid</p></div>
                <div><p className={cn('text-[10px] font-bold tabular-nums', p.pending > 0 ? 'text-amber-500' : 'text-th-text-tertiary')}>{fmt(p.pending)}</p><p className="text-[7px] text-th-text-tertiary">Pending</p></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Revenue Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>{fmt(totalPending)}</strong> in pending payouts across 3 partners. Process before month-end to maintain partner satisfaction.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
