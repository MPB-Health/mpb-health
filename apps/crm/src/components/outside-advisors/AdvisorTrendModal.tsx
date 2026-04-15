import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MONTHLY = [
  { month: 'Jan', sourced: 14, closed: 5, production: 13000 },
  { month: 'Feb', sourced: 18, closed: 7, production: 18200 },
  { month: 'Mar', sourced: 24, closed: 10, production: 26000 },
  { month: 'Apr', sourced: 30, closed: 14, production: 36400 },
  { month: 'May', sourced: 20, closed: 8, production: 20800 },
  { month: 'Jun', sourced: 36, closed: 16, production: 41600 },
];

const BY_TYPE = [
  { type: 'Benefits Broker', sourced: 48, closed: 20, growth: 15, color: '#3b82f6' },
  { type: 'Independent Agent', sourced: 40, closed: 15, growth: 10, color: '#10b981' },
  { type: 'General Agent', sourced: 26, closed: 10, growth: 5, color: '#8b5cf6' },
  { type: 'FMO', sourced: 20, closed: 9, growth: 22, color: '#f59e0b' },
  { type: 'Wholesale', sourced: 14, closed: 8, growth: 35, color: '#ef4444' },
];

export function AdvisorTrendModal({ open, onClose }: Props) {
  const [period, setPeriod] = useState<'6m' | '12m' | 'ytd'>('6m');
  const maxSourced = Math.max(...MONTHLY.map((m) => m.sourced), 1);

  return (
    <Modal open={open} onClose={onClose} title="Advisor Sourcing Trends" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['6m', '12m', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '6m' ? '6 Months' : p === '12m' ? '12 Months' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Sourced Leads</p>
          <div className="flex items-end gap-1.5 h-24">
            {MONTHLY.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-th-accent-500/20 rounded-t" style={{ height: `${(m.sourced / maxSourced) * 100}%` }}>
                  <div className="text-[7px] font-bold text-th-accent-500 text-center pt-0.5">{m.sourced}</div>
                </div>
                <span className="text-[8px] text-th-text-tertiary mt-1">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">By Advisor Channel</p>
          <div className="space-y-1.5">
            {BY_TYPE.map((t) => (
              <div key={t.type} className="flex items-center gap-2">
                <div className="w-2.5 h-4 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-medium text-th-text-primary w-28">{t.type}</span>
                <div className="flex-1 h-3 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(t.sourced / 50) * 100}%`, backgroundColor: t.color + '40' }} />
                </div>
                <span className="text-[10px] tabular-nums text-th-text-secondary w-8">{t.sourced}</span>
                <span className={cn('text-[9px] font-bold tabular-nums w-10 text-right', t.growth >= 0 ? 'text-green-500' : 'text-red-500')}>+{t.growth}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Trend Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Wholesale</strong> channel is growing fastest at +35% with the best conversion rate. <strong>FMO</strong> is also strong at +22%. Prioritize these high-quality channels.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
