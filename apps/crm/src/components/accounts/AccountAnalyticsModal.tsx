import { useState } from 'react';
import { Modal } from '../Modal';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Building2,
  Star, Sparkles, ArrowRight,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AccountAnalyticsModalProps { open: boolean; onClose: () => void; totalAccounts: number; }

const MOCK_BY_TYPE = [
  { type: 'Customer', count: 42, revenue: 1240000, color: '#22c55e' },
  { type: 'Prospect', count: 38, revenue: 0, color: '#3b82f6' },
  { type: 'Partner', count: 8, revenue: 340000, color: '#8b5cf6' },
  { type: 'Vendor', count: 6, revenue: 0, color: '#f59e0b' },
  { type: 'Other', count: 4, revenue: 0, color: '#6b7280' },
];

const MOCK_BY_RATING = [
  { rating: 'Hot', count: 18, pct: 18, color: '#ef4444' },
  { rating: 'Warm', count: 32, pct: 33, color: '#f59e0b' },
  { rating: 'Cold', count: 24, pct: 24, color: '#3b82f6' },
  { rating: 'Unrated', count: 24, pct: 25, color: '#d1d5db' },
];

const MOCK_TOP_ACCOUNTS = [
  { name: 'Acme Health Group', revenue: 428000, deals: 12, rating: 'hot' },
  { name: 'BlueCross Partners', revenue: 312000, deals: 8, rating: 'hot' },
  { name: 'Medicare Solutions Inc', revenue: 256000, deals: 6, rating: 'warm' },
  { name: 'Senior Care Alliance', revenue: 198000, deals: 5, rating: 'warm' },
  { name: 'Wellness First Corp', revenue: 142000, deals: 4, rating: 'hot' },
];

function currencyFmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export function AccountAnalyticsModal({ open, onClose, totalAccounts }: AccountAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const totalRevenue = MOCK_BY_TYPE.reduce((s, t) => s + t.revenue, 0);
  const maxCount = Math.max(...MOCK_BY_TYPE.map((t) => t.count), 1);

  return (
    <Modal open={open} onClose={onClose} title="Account Analytics" size="2xl">
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
            { label: 'Total Accounts', value: String(totalAccounts), icon: Building2, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Total Revenue', value: currencyFmt(totalRevenue), icon: DollarSign, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Avg per Account', value: currencyFmt(totalRevenue / (totalAccounts || 1)), icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Hot Accounts', value: '18', icon: Star, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* By Type */}
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">By Type</p>
            <div className="space-y-2">
              {MOCK_BY_TYPE.map((t) => (
                <div key={t.type} className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-16">{t.type}</span>
                  <div className="flex-1 h-4 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded flex items-center px-1.5"
                      style={{ width: `${(t.count / maxCount) * 100}%`, backgroundColor: t.color + '40' }}>
                      <span className="text-[9px] font-bold text-th-text-primary">{t.count}</span>
                    </div>
                  </div>
                  {t.revenue > 0 && <span className="text-[10px] text-green-500 font-medium tabular-nums w-12 text-right">{currencyFmt(t.revenue)}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* By Rating */}
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">By Rating</p>
            <div className="space-y-2">
              {MOCK_BY_RATING.map((r) => (
                <div key={r.rating} className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-16">{r.rating}</span>
                  <div className="flex-1 h-4 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${r.pct}%`, backgroundColor: r.color + '60' }} />
                  </div>
                  <span className="text-[10px] text-th-text-secondary tabular-nums w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top accounts */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50">
            <p className="text-xs font-semibold text-th-text-secondary">Top Accounts by Revenue</p>
          </div>
          {MOCK_TOP_ACCOUNTS.map((acct, idx) => (
            <div key={acct.name} className="flex items-center gap-3 px-3 py-2 border-t border-th-border/30">
              <span className="text-xs font-bold text-th-text-tertiary w-4 tabular-nums">{idx + 1}</span>
              <div className="w-7 h-7 rounded-lg bg-th-accent-100 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-th-accent-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-th-text-primary truncate">{acct.name}</p>
                <p className="text-[10px] text-th-text-tertiary">{acct.deals} deals</p>
              </div>
              <span className="text-sm font-bold text-green-500 tabular-nums">{currencyFmt(acct.revenue)}</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Account Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Your top 5 accounts generate <strong>85%</strong> of total revenue. Consider expanding to more warm accounts — 32 are untapped with potential cross-sell opportunities.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
