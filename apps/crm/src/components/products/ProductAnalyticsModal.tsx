import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Users, DollarSign, TrendingUp, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductAnalyticsModalProps { open: boolean; onClose: () => void; planCount: number; }

const MOCK_PLANS = [
  { name: 'Essentials', enrollments: 186, revenue: 74400, avgPremium: 400, growth: 12, color: '#3b82f6' },
  { name: 'MEC+ Essentials', enrollments: 142, revenue: 71000, avgPremium: 500, growth: 8, color: '#10b981' },
  { name: 'Care Plus', enrollments: 98, revenue: 63700, avgPremium: 650, growth: 15, color: '#8b5cf6' },
  { name: 'Direct', enrollments: 64, revenue: 48000, avgPremium: 750, growth: -3, color: '#f59e0b' },
  { name: 'Secure HSA', enrollments: 38, revenue: 34200, avgPremium: 900, growth: 22, color: '#ef4444' },
];

export function ProductAnalyticsModal({ open, onClose, planCount }: ProductAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalEnrollments = MOCK_PLANS.reduce((s, p) => s + p.enrollments, 0);
  const totalRevenue = MOCK_PLANS.reduce((s, p) => s + p.revenue, 0);
  const maxEnroll = Math.max(...MOCK_PLANS.map((p) => p.enrollments), 1);

  return (
    <Modal open={open} onClose={onClose} title="Product Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Plans', value: String(planCount), icon: BarChart3, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Enrollments', value: totalEnrollments.toLocaleString(), icon: Users, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Avg Premium', value: fmt(totalRevenue / totalEnrollments), icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {MOCK_PLANS.map((plan) => (
            <div key={plan.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-th-text-primary">{plan.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', plan.growth >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>
                      {plan.growth >= 0 ? '+' : ''}{plan.growth}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(plan.enrollments / maxEnroll) * 100}%`, backgroundColor: plan.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{plan.enrollments}</p><p className="text-[8px] text-th-text-tertiary">Members</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(plan.avgPremium)}</p><p className="text-[8px] text-th-text-tertiary">Avg/mo</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(plan.revenue)}</p><p className="text-[8px] text-th-text-tertiary">Revenue</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Product Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Secure HSA</strong> has the highest growth at +22% despite being the smallest plan. Consider promoting it more aggressively.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
