import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, DollarSign, TrendingUp, Target, Sparkles, Layers } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
}

const MOCK_BY_TYPE = [
  { type: 'New Business', count: 42, value: 840000, pct: 48, color: '#3b82f6' },
  { type: 'Existing Business', count: 28, value: 560000, pct: 32, color: '#10b981' },
  { type: 'Renewal', count: 18, value: 360000, pct: 20, color: '#f59e0b' },
];

const MOCK_MONTHLY = [
  { month: 'Nov', created: 12, won: 5, value: 125000 },
  { month: 'Dec', created: 8, won: 4, value: 98000 },
  { month: 'Jan', created: 15, won: 7, value: 186000 },
  { month: 'Feb', created: 11, won: 6, value: 142000 },
  { month: 'Mar', created: 18, won: 8, value: 210000 },
  { month: 'Apr', created: 9, won: 3, value: 78000 },
];

const MOCK_BY_SOURCE = [
  { source: 'Referral', count: 24, winRate: 62, avgSize: 28500, color: '#8b5cf6' },
  { source: 'Website', count: 18, winRate: 38, avgSize: 15200, color: '#3b82f6' },
  { source: 'Cold Call', count: 14, winRate: 22, avgSize: 12800, color: '#ef4444' },
  { source: 'Partner', count: 10, winRate: 55, avgSize: 32400, color: '#10b981' },
  { source: 'Trade Show', count: 8, winRate: 45, avgSize: 22600, color: '#f59e0b' },
];

export function DealAnalyticsModal({ open, onClose, totalDeals, totalValue, weightedValue }: DealAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const maxMonthly = Math.max(...MOCK_MONTHLY.map((m) => m.created), 1);
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

  return (
    <Modal open={open} onClose={onClose} title="Deal Analytics" size="2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Open Deals', value: String(totalDeals), icon: Target, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Total Value', value: fmt(totalValue), icon: DollarSign, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Weighted', value: fmt(weightedValue), icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Avg Size', value: fmt(avgDealSize), icon: Layers, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">By Deal Type</p>
            <div className="space-y-2">
              {MOCK_BY_TYPE.map((t) => (
                <div key={t.type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-[11px] text-th-text-primary w-28 truncate">{t.type}</span>
                  <div className="flex-1 h-4 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded flex items-center px-1.5" style={{ width: `${t.pct}%`, backgroundColor: t.color + '40' }}>
                      <span className="text-[9px] font-bold text-th-text-primary">{t.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary tabular-nums w-14 text-right">{fmt(t.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Trend</p>
            <div className="flex items-end gap-1.5 h-[80px]">
              {MOCK_MONTHLY.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-blue-500/40" style={{ height: `${(m.created / maxMonthly) * 60}px` }} />
                  <span className="text-[8px] text-th-text-tertiary">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50">
            <p className="text-xs font-semibold text-th-text-secondary">Performance by Source</p>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-th-border/30">
              <th className="text-left px-3 py-2 text-th-text-tertiary font-medium">Source</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Deals</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Win Rate</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Avg Size</th>
            </tr></thead>
            <tbody>
              {MOCK_BY_SOURCE.map((s) => (
                <tr key={s.source} className="border-t border-th-border/20">
                  <td className="px-3 py-2 font-medium text-th-text-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.source}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{s.count}</td>
                  <td className="text-right px-3 py-2"><span className={cn('tabular-nums font-bold', s.winRate >= 50 ? 'text-green-500' : 'text-amber-500')}>{s.winRate}%</span></td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{fmt(s.avgSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Deal Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Referral</strong> deals have the highest win rate (62%) and largest average size ({fmt(28500)}). Prioritize referral-source deals for maximum ROI.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
