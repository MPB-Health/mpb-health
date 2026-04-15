import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MONTHLY = [
  { month: 'Jan', referrals: 18, conversions: 6, revenue: 9600 },
  { month: 'Feb', referrals: 22, conversions: 8, revenue: 12800 },
  { month: 'Mar', referrals: 28, conversions: 12, revenue: 19200 },
  { month: 'Apr', referrals: 34, conversions: 16, revenue: 25600 },
  { month: 'May', referrals: 24, conversions: 10, revenue: 16000 },
  { month: 'Jun', referrals: 40, conversions: 18, revenue: 28800 },
];

const BY_TYPE = [
  { type: 'CPA', referrals: 57, conversions: 24, growth: 18, color: '#3b82f6' },
  { type: 'Financial Advisor', referrals: 48, conversions: 19, growth: 12, color: '#10b981' },
  { type: 'HR Consultant', referrals: 28, conversions: 12, growth: 8, color: '#8b5cf6' },
  { type: 'Payroll', referrals: 18, conversions: 10, growth: 32, color: '#ef4444' },
  { type: 'Attorney', referrals: 22, conversions: 8, growth: -5, color: '#f59e0b' },
];

export function PartnerTrendModal({ open, onClose }: Props) {
  const [period, setPeriod] = useState<'6m' | '12m' | 'ytd'>('6m');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const maxRef = Math.max(...MONTHLY.map((m) => m.referrals), 1);

  return (
    <Modal open={open} onClose={onClose} title="Referral Trends" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['6m', '12m', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '6m' ? '6 Months' : p === '12m' ? '12 Months' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Referrals</p>
          <div className="flex items-end gap-1.5 h-24">
            {MONTHLY.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-th-accent-500/20 rounded-t" style={{ height: `${(m.referrals / maxRef) * 100}%` }}>
                  <div className="text-[7px] font-bold text-th-accent-500 text-center pt-0.5">{m.referrals}</div>
                </div>
                <span className="text-[8px] text-th-text-tertiary mt-1">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">By Partner Type</p>
          <div className="space-y-1.5">
            {BY_TYPE.map((t) => (
              <div key={t.type} className="flex items-center gap-2">
                <div className="w-2.5 h-4 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-medium text-th-text-primary w-28">{t.type}</span>
                <div className="flex-1 h-3 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(t.referrals / 60) * 100}%`, backgroundColor: t.color + '40' }} />
                </div>
                <span className="text-[10px] tabular-nums text-th-text-secondary w-8">{t.referrals}</span>
                <span className={cn('text-[9px] font-bold tabular-nums w-10 text-right', t.growth >= 0 ? 'text-green-500' : 'text-red-500')}>{t.growth >= 0 ? '+' : ''}{t.growth}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Trend Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Payroll partners</strong> are growing fastest at +32% with the best conversion rates. <strong>Attorney</strong> referrals are declining — schedule a re-engagement call.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
