import { Modal } from '../Modal';
import { DollarSign, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface PricingAnalyticsModalProps { open: boolean; onClose: () => void; }

const MOCK_BANDS = [
  { range: '$100-199', members: 186, pct: 35, color: '#3b82f6' },
  { range: '$200-349', members: 142, pct: 27, color: '#10b981' },
  { range: '$350-499', members: 98, pct: 19, color: '#8b5cf6' },
  { range: '$500-749', members: 64, pct: 12, color: '#f59e0b' },
  { range: '$750+', members: 38, pct: 7, color: '#ef4444' },
];

const MOCK_IUA = [
  { amount: '$1,000', members: 42, avgContrib: 284 },
  { amount: '$2,500', members: 86, avgContrib: 348 },
  { amount: '$5,000', members: 62, avgContrib: 412 },
  { amount: '$10,000', members: 28, avgContrib: 486 },
];

export function PricingAnalyticsModal({ open, onClose }: PricingAnalyticsModalProps) {
  const fmt = (n: number) => `$${n}`;
  const maxBand = Math.max(...MOCK_BANDS.map((b) => b.members), 1);
  const avgPremium = Math.round(MOCK_BANDS.reduce((s, b) => s + b.members * ((parseInt(b.range.replace(/[^0-9]/g, '')) || 500)), 0) / MOCK_BANDS.reduce((s, b) => s + b.members, 0));

  return (
    <Modal open={open} onClose={onClose} title="Pricing Analytics" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{fmt(avgPremium)}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Premium</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{fmt(142)}</p>
            <p className="text-[10px] text-th-text-tertiary">Lowest Starting</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <BarChart3 className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">$200-349</p>
            <p className="text-[10px] text-th-text-tertiary">Most Popular Band</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Premium Distribution</p>
          <div className="space-y-1.5">
            {MOCK_BANDS.map((b) => (
              <div key={b.range} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-16">{b.range}</span>
                <div className="flex-1 h-4 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded flex items-center px-1.5" style={{ width: `${(b.members / maxBand) * 100}%`, backgroundColor: b.color + '40' }}>
                    <span className="text-[8px] font-bold text-th-text-primary">{b.members}</span>
                  </div>
                </div>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-6 text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50"><p className="text-xs font-semibold text-th-text-secondary">IUA Level Analysis</p></div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-th-border/30">
              <th className="text-left px-3 py-2 text-th-text-tertiary font-medium">IUA Amount</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Members</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Avg Contribution</th>
            </tr></thead>
            <tbody>{MOCK_IUA.map((r) => (
              <tr key={r.amount} className="border-t border-th-border/20">
                <td className="px-3 py-2 font-medium text-th-text-primary">{r.amount}</td>
                <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{r.members}</td>
                <td className="text-right px-3 py-2 tabular-nums font-bold text-green-500">{fmt(r.avgContrib)}/mo</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Pricing Insight</span></div>
          <p className="text-xs text-th-text-secondary">The <strong>$2,500 IUA</strong> tier is most popular with 86 members. The $100-199 premium band captures 35% of all members — your affordability strategy is working.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
