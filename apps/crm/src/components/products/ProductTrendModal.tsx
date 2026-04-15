import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, Calendar, Users, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductTrendModalProps { open: boolean; onClose: () => void; }

const MONTHLY = [
  { month: 'Jan', essentials: 12, mec: 8, carePlus: 6, direct: 4, hsa: 2 },
  { month: 'Feb', essentials: 15, mec: 10, carePlus: 8, direct: 5, hsa: 3 },
  { month: 'Mar', essentials: 22, mec: 14, carePlus: 12, direct: 7, hsa: 4 },
  { month: 'Apr', essentials: 18, mec: 12, carePlus: 10, direct: 6, hsa: 5 },
  { month: 'May', essentials: 28, mec: 18, carePlus: 14, direct: 8, hsa: 6 },
  { month: 'Jun', essentials: 32, mec: 22, carePlus: 16, direct: 10, hsa: 7 },
];

const PLANS = [
  { key: 'essentials', name: 'Essentials', color: '#3b82f6' },
  { key: 'mec', name: 'MEC+', color: '#10b981' },
  { key: 'carePlus', name: 'Care Plus', color: '#8b5cf6' },
  { key: 'direct', name: 'Direct', color: '#f59e0b' },
  { key: 'hsa', name: 'HSA', color: '#ef4444' },
];

const SEASONAL = [
  { period: 'Q1 (Jan-Mar)', trend: 'up', note: 'New year health goals drive signups', growth: 42 },
  { period: 'Q2 (Apr-Jun)', trend: 'up', note: 'Open enrollment season peaks', growth: 28 },
  { period: 'Q3 (Jul-Sep)', trend: 'down', note: 'Summer slowdown typical', growth: -12 },
  { period: 'Q4 (Oct-Dec)', trend: 'up', note: 'Year-end tax planning + ACA gap', growth: 35 },
];

export function ProductTrendModal({ open, onClose }: ProductTrendModalProps) {
  const [period, setPeriod] = useState<'6m' | '12m' | 'ytd'>('6m');
  const getVal = (m: typeof MONTHLY[number], key: string) => (m as unknown as Record<string, number>)[key] ?? 0;
  const maxVal = Math.max(...MONTHLY.flatMap((m) => PLANS.map((p) => getVal(m, p.key))));

  return (
    <Modal open={open} onClose={onClose} title="Enrollment Trends" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['6m', '12m', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{p === '6m' ? '6 Months' : p === '12m' ? '12 Months' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-3">Monthly Enrollments by Plan</p>
          <div className="space-y-2">
            {MONTHLY.map((row) => (
              <div key={row.month} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-6">{row.month}</span>
                <div className="flex-1 flex h-4 rounded gap-0.5 overflow-hidden">
                  {PLANS.map((p) => {
                    const val = getVal(row, p.key);
                    return (
                      <div key={p.key} className="h-full rounded" style={{ width: `${(val / maxVal) * 20}%`, backgroundColor: p.color, minWidth: val > 0 ? '4px' : 0 }} title={`${p.name}: ${val}`} />
                    );
                  })}
                </div>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-6 text-right">{PLANS.reduce((s, p) => s + getVal(row, p.key), 0)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {PLANS.map((p) => (<span key={p.key} className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded" style={{ backgroundColor: p.color }} />{p.name}</span>))}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Seasonal Patterns</p>
          <div className="space-y-1.5">
            {SEASONAL.map((s) => (
              <div key={s.period} className="flex items-center gap-2 py-1.5">
                {s.trend === 'up' ? <ArrowUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="text-xs font-medium text-th-text-primary w-28 shrink-0">{s.period}</span>
                <span className="text-[10px] text-th-text-tertiary flex-1">{s.note}</span>
                <span className={cn('text-[10px] font-bold tabular-nums', s.growth >= 0 ? 'text-green-500' : 'text-red-500')}>{s.growth >= 0 ? '+' : ''}{s.growth}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Trend Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Essentials</strong> enrollment is accelerating (+78% MoM) while HSA is the fastest growing by percentage (+250% since Jan). Recommend staffing up for Q4 open enrollment surge.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
