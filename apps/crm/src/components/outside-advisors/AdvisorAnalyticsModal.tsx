import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Users, DollarSign, TrendingUp, Target, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; advisorCount: number; }

const ADVISORS = [
  { name: 'Maria Santos — Benefits Broker', sourced: 38, closed: 16, production: 42000, rate: 42.1, color: '#3b82f6' },
  { name: 'David Park — Independent Agent', sourced: 32, closed: 13, production: 34000, rate: 40.6, color: '#10b981' },
  { name: 'Rachel Green — GA', sourced: 26, closed: 10, production: 26000, rate: 38.5, color: '#8b5cf6' },
  { name: 'James Wilson — FMO', sourced: 20, closed: 9, production: 23500, rate: 45.0, color: '#f59e0b' },
  { name: 'Linda Chen — Wholesale', sourced: 14, closed: 8, production: 21000, rate: 57.1, color: '#ef4444' },
];

export function AdvisorAnalyticsModal({ open, onClose, advisorCount }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalSourced = ADVISORS.reduce((s, a) => s + a.sourced, 0);
  const totalClosed = ADVISORS.reduce((s, a) => s + a.closed, 0);
  const totalProduction = ADVISORS.reduce((s, a) => s + a.production, 0);
  const maxSourced = Math.max(...ADVISORS.map((a) => a.sourced), 1);

  return (
    <Modal open={open} onClose={onClose} title="Advisor Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Advisors', value: String(advisorCount || ADVISORS.length), icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Leads Sourced', value: totalSourced.toLocaleString(), icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Closed', value: totalClosed.toLocaleString(), icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Production', value: fmt(totalProduction), icon: DollarSign, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {ADVISORS.map((a) => (
            <div key={a.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-th-text-primary truncate">{a.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', a.rate >= 50 ? 'bg-green-500/10 text-green-500' : a.rate >= 40 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{a.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a.sourced / maxSourced) * 100}%`, backgroundColor: a.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{a.sourced}</p><p className="text-[8px] text-th-text-tertiary">Sourced</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{a.closed}</p><p className="text-[8px] text-th-text-tertiary">Closed</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(a.production)}</p><p className="text-[8px] text-th-text-tertiary">Prod</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Advisor Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Linda Chen</strong> has the highest close rate at 57.1% despite fewer sourced leads. Wholesale channel is your highest-quality source — consider expanding.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
