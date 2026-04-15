import { useState } from 'react';
import { Modal } from '../Modal';
import { DollarSign, TrendingUp, TrendingDown, Building2, Target, Sparkles, BarChart3 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AccountRevenue { name: string; currentRevenue: number; forecastRevenue: number; deals: number; trend: 'up' | 'down' | 'stable'; growthPct: number; }
interface AccountRevenueModalProps { open: boolean; onClose: () => void; }

const MOCK_REVENUE: AccountRevenue[] = [
  { name: 'Acme Health Group', currentRevenue: 680000, forecastRevenue: 820000, deals: 12, trend: 'up', growthPct: 20.6 },
  { name: 'BlueCross Partners', currentRevenue: 420000, forecastRevenue: 460000, deals: 8, trend: 'up', growthPct: 9.5 },
  { name: 'Medicare Solutions', currentRevenue: 256000, forecastRevenue: 230000, deals: 6, trend: 'down', growthPct: -10.2 },
  { name: 'Senior Care Alliance', currentRevenue: 198000, forecastRevenue: 220000, deals: 5, trend: 'up', growthPct: 11.1 },
  { name: 'Wellness First Corp', currentRevenue: 142000, forecastRevenue: 185000, deals: 4, trend: 'up', growthPct: 30.3 },
  { name: 'National Health Plan', currentRevenue: 118000, forecastRevenue: 95000, deals: 3, trend: 'down', growthPct: -19.5 },
];

function currencyFmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export function AccountRevenueModal({ open, onClose }: AccountRevenueModalProps) {
  const [sort, setSort] = useState<'revenue' | 'forecast' | 'growth'>('revenue');

  const sorted = [...MOCK_REVENUE].sort((a, b) => {
    if (sort === 'revenue') return b.currentRevenue - a.currentRevenue;
    if (sort === 'forecast') return b.forecastRevenue - a.forecastRevenue;
    return b.growthPct - a.growthPct;
  });

  const totalCurrent = MOCK_REVENUE.reduce((s, a) => s + a.currentRevenue, 0);
  const totalForecast = MOCK_REVENUE.reduce((s, a) => s + a.forecastRevenue, 0);
  const maxRevenue = Math.max(...MOCK_REVENUE.map((a) => Math.max(a.currentRevenue, a.forecastRevenue)), 1);

  return (
    <Modal open={open} onClose={onClose} title="Account Revenue" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30">
            <DollarSign className="w-4 h-4 text-green-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(totalCurrent)}</p>
            <p className="text-[10px] text-th-text-tertiary">Current Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30">
            <Target className="w-4 h-4 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(totalForecast)}</p>
            <p className="text-[10px] text-th-text-tertiary">Forecast Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30">
            <TrendingUp className="w-4 h-4 text-violet-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{((totalForecast / totalCurrent - 1) * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-th-text-tertiary">Projected Growth</p>
          </div>
        </div>

        <div className="flex gap-1">
          {[{ id: 'revenue' as const, label: 'By Revenue' }, { id: 'forecast' as const, label: 'By Forecast' }, { id: 'growth' as const, label: 'By Growth' }].map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              sort === s.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{s.label}</button>
          ))}
        </div>

        <div className="max-h-[280px] overflow-y-auto space-y-2">
          {sorted.map((acct) => (
            <div key={acct.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-th-accent-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-th-accent-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-th-text-primary">{acct.name}</span>
                  <span className="text-[10px] text-th-text-tertiary ml-2">{acct.deals} deals</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {acct.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={cn('text-xs font-bold tabular-nums', acct.growthPct > 0 ? 'text-green-500' : 'text-red-500')}>
                    {acct.growthPct > 0 ? '+' : ''}{acct.growthPct}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-14">Current</span>
                  <div className="flex-1 h-3 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded bg-green-500/50" style={{ width: `${(acct.currentRevenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-th-text-primary w-12 text-right tabular-nums">{currencyFmt(acct.currentRevenue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-14">Forecast</span>
                  <div className="flex-1 h-3 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded bg-blue-500/50" style={{ width: `${(acct.forecastRevenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-th-text-primary w-12 text-right tabular-nums">{currencyFmt(acct.forecastRevenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Revenue Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Wellness First Corp</strong> is your fastest-growing account at +30.3%. Consider upselling additional coverage lines. <strong>National Health Plan</strong> is declining — schedule a retention call.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
