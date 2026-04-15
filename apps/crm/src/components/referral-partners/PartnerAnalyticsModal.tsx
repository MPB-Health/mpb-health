import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Users, DollarSign, TrendingUp, Target, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; partnerCount: number; }

const PARTNERS = [
  { name: 'Jane Roberts — CPA', referrals: 42, conversions: 18, revenue: 28800, rate: 42.9, color: '#3b82f6' },
  { name: 'Tom Chen — Financial Advisor', referrals: 36, conversions: 14, revenue: 22400, rate: 38.9, color: '#10b981' },
  { name: 'Sarah Kim — HR Consultant', referrals: 28, conversions: 12, revenue: 19200, rate: 42.9, color: '#8b5cf6' },
  { name: 'Mike Johnson — Attorney', referrals: 22, conversions: 8, revenue: 12800, rate: 36.4, color: '#f59e0b' },
  { name: 'ADP Payroll — Payroll', referrals: 18, conversions: 10, revenue: 16000, rate: 55.6, color: '#ef4444' },
];

export function PartnerAnalyticsModal({ open, onClose, partnerCount }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalReferrals = PARTNERS.reduce((s, p) => s + p.referrals, 0);
  const totalConversions = PARTNERS.reduce((s, p) => s + p.conversions, 0);
  const totalRevenue = PARTNERS.reduce((s, p) => s + p.revenue, 0);
  const maxRef = Math.max(...PARTNERS.map((p) => p.referrals), 1);

  return (
    <Modal open={open} onClose={onClose} title="Partner Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Partners', value: String(partnerCount || PARTNERS.length), icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Referrals', value: totalReferrals.toLocaleString(), icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Conversions', value: totalConversions.toLocaleString(), icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {PARTNERS.map((p) => (
            <div key={p.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-th-text-primary truncate">{p.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', p.rate >= 50 ? 'bg-green-500/10 text-green-500' : p.rate >= 40 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{p.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(p.referrals / maxRef) * 100}%`, backgroundColor: p.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{p.referrals}</p><p className="text-[8px] text-th-text-tertiary">Refs</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{p.conversions}</p><p className="text-[8px] text-th-text-tertiary">Conv</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(p.revenue)}</p><p className="text-[8px] text-th-text-tertiary">Rev</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Partner Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>ADP Payroll</strong> has the highest conversion rate at 55.6% despite fewer referrals. Prioritize payroll partnerships for quality over quantity.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
