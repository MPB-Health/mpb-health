import { Modal } from '../Modal';
import { DollarSign, PieChart, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductMarginModalProps { open: boolean; onClose: () => void; }

const PLANS_MARGIN = [
  { plan: 'Essentials', revenue: 74400, enrollFees: 23250, annualFees: 0, tobaccoFees: 0, margin: 31.3, color: '#3b82f6' },
  { plan: 'MEC+ Essentials', revenue: 71000, enrollFees: 17750, annualFees: 0, tobaccoFees: 0, margin: 25.0, color: '#10b981' },
  { plan: 'Care Plus', revenue: 63700, enrollFees: 12250, annualFees: 7350, tobaccoFees: 4900, margin: 38.5, color: '#8b5cf6' },
  { plan: 'Direct', revenue: 48000, enrollFees: 8000, annualFees: 4800, tobaccoFees: 3200, margin: 33.3, color: '#f59e0b' },
  { plan: 'Secure HSA', revenue: 34200, enrollFees: 4750, annualFees: 2850, tobaccoFees: 1900, margin: 27.8, color: '#ef4444' },
];

const FEE_BREAKDOWN = [
  { label: 'Enrollment Fees', value: 66000, pct: 42, color: '#3b82f6' },
  { label: 'Annual Membership', value: 15000, pct: 10, color: '#8b5cf6' },
  { label: 'Tobacco Surcharges', value: 10000, pct: 6, color: '#f59e0b' },
  { label: 'Monthly Contributions', value: 291300, pct: 42, color: '#10b981' },
];

export function ProductMarginModal({ open, onClose }: ProductMarginModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalRevenue = PLANS_MARGIN.reduce((s, p) => s + p.revenue, 0);
  const totalFees = PLANS_MARGIN.reduce((s, p) => s + p.enrollFees + p.annualFees + p.tobaccoFees, 0);
  const maxRevenue = Math.max(...PLANS_MARGIN.map((p) => p.revenue), 1);

  return (
    <Modal open={open} onClose={onClose} title="Revenue & Margin Analysis" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalRevenue)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <PieChart className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalFees)}</p>
            <p className="text-[10px] text-th-text-tertiary">Fee Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">31.2%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Margin</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Revenue by Plan</p>
          <div className="space-y-1.5">
            {PLANS_MARGIN.map((p) => (
              <div key={p.plan} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-primary w-28 truncate">{p.plan}</span>
                <div className="flex-1 h-5 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded flex items-center px-2" style={{ width: `${(p.revenue / maxRevenue) * 100}%`, backgroundColor: p.color + '30' }}>
                    <span className="text-[8px] font-bold text-th-text-primary tabular-nums">{fmt(p.revenue)}</span>
                  </div>
                </div>
                <span className={cn('text-[10px] font-bold tabular-nums w-10 text-right', p.margin >= 35 ? 'text-green-500' : p.margin >= 28 ? 'text-amber-500' : 'text-red-500')}>{p.margin}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Fee Revenue Breakdown</p>
          <div className="h-5 rounded-full bg-surface-tertiary overflow-hidden flex mb-2">
            {FEE_BREAKDOWN.map((f) => (
              <div key={f.label} className="h-full" style={{ width: `${f.pct}%`, backgroundColor: f.color }} title={f.label} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FEE_BREAKDOWN.map((f) => (
              <div key={f.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: f.color }} />
                <span className="text-[10px] text-th-text-tertiary flex-1">{f.label}</span>
                <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(f.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-surface-secondary/50">
              <th className="text-left px-3 py-1.5 font-medium text-th-text-tertiary">Plan</th>
              <th className="text-right px-3 py-1.5 font-medium text-th-text-tertiary">Enroll</th>
              <th className="text-right px-3 py-1.5 font-medium text-th-text-tertiary">Annual</th>
              <th className="text-right px-3 py-1.5 font-medium text-th-text-tertiary">Tobacco</th>
              <th className="text-right px-3 py-1.5 font-medium text-th-text-tertiary">Total Fees</th>
            </tr></thead>
            <tbody>{PLANS_MARGIN.map((p) => (
              <tr key={p.plan} className="border-t border-th-border/20">
                <td className="px-3 py-1.5 font-medium text-th-text-primary">{p.plan}</td>
                <td className="text-right px-3 py-1.5 tabular-nums text-th-text-secondary">{fmt(p.enrollFees)}</td>
                <td className="text-right px-3 py-1.5 tabular-nums text-th-text-secondary">{fmt(p.annualFees)}</td>
                <td className="text-right px-3 py-1.5 tabular-nums text-th-text-secondary">{fmt(p.tobaccoFees)}</td>
                <td className="text-right px-3 py-1.5 font-bold tabular-nums text-th-text-primary">{fmt(p.enrollFees + p.annualFees + p.tobaccoFees)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Margin Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Care Plus</strong> delivers the highest margin at 38.5% due to strong IUA contributions + fee stack. Focus upselling from Essentials to Care Plus for maximum revenue impact.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
