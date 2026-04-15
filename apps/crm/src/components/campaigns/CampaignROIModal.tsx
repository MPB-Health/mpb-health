import { Modal } from '../Modal';
import { DollarSign, TrendingUp, PieChart, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const DATA = [
  { name: 'Google Ads — Plans', budget: 12000, spent: 10500, revenue: 31290, leads: 220, cpl: 48, roi: 198, color: '#ef4444' },
  { name: 'Referral Bonus May', budget: 3000, spent: 2800, revenue: 14560, leads: 54, cpl: 52, roi: 420, color: '#f59e0b' },
  { name: 'Open Enrollment Q2', budget: 4500, spent: 3800, revenue: 14592, leads: 142, cpl: 27, roi: 284, color: '#3b82f6' },
  { name: 'Health Fair 2026', budget: 8000, spent: 7200, revenue: 20592, leads: 98, cpl: 73, roi: 186, color: '#10b981' },
  { name: 'LinkedIn Outreach', budget: 2500, spent: 2100, revenue: 9282, leads: 76, cpl: 28, roi: 342, color: '#8b5cf6' },
];

export function CampaignROIModal({ open, onClose }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalBudget = DATA.reduce((s, d) => s + d.budget, 0);
  const totalSpent = DATA.reduce((s, d) => s + d.spent, 0);
  const totalRevenue = DATA.reduce((s, d) => s + d.revenue, 0);
  const avgCpl = Math.round(totalSpent / DATA.reduce((s, d) => s + d.leads, 0));
  const overallRoi = Math.round(((totalRevenue - totalSpent) / totalSpent) * 100);
  const maxRevenue = Math.max(...DATA.map((d) => d.revenue), 1);

  return (
    <Modal open={open} onClose={onClose} title="Campaign ROI" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Budget', value: fmt(totalBudget), icon: DollarSign, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Spent', value: fmt(totalSpent), icon: PieChart, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Revenue', value: fmt(totalRevenue), icon: TrendingUp, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Avg CPL', value: fmt(avgCpl), icon: DollarSign, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
          <p className="text-[10px] text-th-text-tertiary">Overall ROI</p>
          <p className="text-3xl font-extrabold text-green-500">{overallRoi}%</p>
          <p className="text-[10px] text-th-text-tertiary">Net return: {fmt(totalRevenue - totalSpent)}</p>
        </div>

        <div className="space-y-1.5">
          {DATA.sort((a, b) => b.roi - a.roi).map((d) => {
            const budgetUsed = Math.round((d.spent / d.budget) * 100);
            return (
              <div key={d.name} className="p-2.5 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-semibold text-th-text-primary flex-1 truncate">{d.name}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', d.roi >= 300 ? 'bg-green-500/10 text-green-500' : d.roi >= 200 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{d.roi}% ROI</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(d.budget)}</p><p className="text-[7px] text-th-text-tertiary">Budget</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(d.spent)}</p><p className="text-[7px] text-th-text-tertiary">Spent ({budgetUsed}%)</p></div>
                  <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{fmt(d.revenue)}</p><p className="text-[7px] text-th-text-tertiary">Revenue</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(d.cpl)}</p><p className="text-[7px] text-th-text-tertiary">CPL</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(d.revenue - d.spent)}</p><p className="text-[7px] text-th-text-tertiary">Net</p></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">ROI Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Open Enrollment Q2</strong> has the lowest CPL at $27 — scale this channel. <strong>Health Fair</strong> CPL of $73 is high but leads convert at 24%, above average.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
