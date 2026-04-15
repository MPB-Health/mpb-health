import { Modal } from '../Modal';
import { DollarSign, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const EVENTS = [
  { type: 'Church Partnership', cost: 500, leads: 68, costPerLead: 7.35, converted: 14, revenue: 22400, roi: 4380, color: '#3b82f6' },
  { type: 'Hydration Booth', cost: 1200, leads: 45, costPerLead: 26.67, converted: 6, revenue: 9600, roi: 700, color: '#10b981' },
  { type: 'Chamber / BNI', cost: 800, leads: 42, costPerLead: 19.05, converted: 10, revenue: 16000, roi: 1900, color: '#8b5cf6' },
  { type: 'Health Fair', cost: 2000, leads: 86, costPerLead: 23.26, converted: 12, revenue: 19200, roi: 860, color: '#f59e0b' },
  { type: 'Co-sponsored', cost: 1500, leads: 52, costPerLead: 28.85, converted: 13, revenue: 20800, roi: 1287, color: '#ef4444' },
];

export function EventROIModal({ open, onClose }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalCost = EVENTS.reduce((s, e) => s + e.cost, 0);
  const totalRevenue = EVENTS.reduce((s, e) => s + e.revenue, 0);
  const totalLeads = EVENTS.reduce((s, e) => s + e.leads, 0);
  const overallROI = Math.round((totalRevenue - totalCost) / totalCost * 100);
  const maxROI = Math.max(...EVENTS.map((e) => e.roi), 1);

  return (
    <Modal open={open} onClose={onClose} title="Event ROI Calculator" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Spend', value: fmt(totalCost), icon: DollarSign, color: 'text-red-500', bg: 'from-red-500/10 to-pink-500/10' },
            { label: 'Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Net Return', value: fmt(totalRevenue - totalCost), icon: TrendingUp, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Overall ROI', value: `${overallROI}%`, icon: BarChart3, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {EVENTS.sort((a, b) => b.roi - a.roi).map((e) => (
            <div key={e.type} className="p-2.5 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{e.type}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', e.roi >= 2000 ? 'bg-green-500/10 text-green-500' : e.roi >= 1000 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{e.roi}% ROI</span>
              </div>
              <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${(e.roi / maxROI) * 100}%`, backgroundColor: e.color }} />
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div><p className="text-[10px] font-bold text-red-500 tabular-nums">{fmt(e.cost)}</p><p className="text-[7px] text-th-text-tertiary">Cost</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{e.leads}</p><p className="text-[7px] text-th-text-tertiary">Leads</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(e.costPerLead)}</p><p className="text-[7px] text-th-text-tertiary">CPL</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{e.converted}</p><p className="text-[7px] text-th-text-tertiary">Conv</p></div>
                <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{fmt(e.revenue)}</p><p className="text-[7px] text-th-text-tertiary">Revenue</p></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">ROI Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Church partnerships</strong> deliver the best ROI at 4,380% with the lowest cost per lead ($7.35). Double down on church events. <strong>Hydration booths</strong> have the lowest ROI — consider reducing frequency.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
