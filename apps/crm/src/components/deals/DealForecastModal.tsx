import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, DollarSign, Target, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealForecastModalProps { open: boolean; onClose: () => void; }

const MOCK_CATEGORIES = [
  { name: 'Committed', count: 8, value: 245000, pct: 92, color: '#22c55e', desc: 'Probability ≥ 90%' },
  { name: 'Best Case', count: 12, value: 380000, pct: 65, color: '#3b82f6', desc: 'Probability 60-89%' },
  { name: 'Pipeline', count: 24, value: 620000, pct: 35, color: '#f59e0b', desc: 'Probability < 60%' },
  { name: 'At Risk', count: 6, value: 142000, pct: 15, color: '#ef4444', desc: 'Stale > 30 days' },
];

const MOCK_QUARTERLY = [
  { quarter: 'Q1 2026', target: 500000, actual: 486000, attainment: 97 },
  { quarter: 'Q2 2026', target: 600000, forecast: 525000, attainment: 88 },
  { quarter: 'Q3 2026', target: 650000, forecast: 0, attainment: 0 },
];

export function DealForecastModal({ open, onClose }: DealForecastModalProps) {
  const [view, setView] = useState<'categories' | 'quarterly'>('categories');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalForecast = MOCK_CATEGORIES.reduce((s, c) => s + Math.round(c.value * c.pct / 100), 0);

  return (
    <Modal open={open} onClose={onClose} title="Revenue Forecast" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(MOCK_CATEGORIES[0].value)}</p>
            <p className="text-[10px] text-th-text-tertiary">Committed</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalForecast)}</p>
            <p className="text-[10px] text-th-text-tertiary">Weighted Forecast</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(MOCK_CATEGORIES.reduce((s, c) => s + c.value, 0))}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Pipeline</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'categories' as const, label: 'Forecast Categories' }, { id: 'quarterly' as const, label: 'Quarterly View' }].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              view === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {view === 'categories' && (
          <div className="space-y-2">
            {MOCK_CATEGORIES.map((cat) => {
              const weighted = Math.round(cat.value * cat.pct / 100);
              return (
                <div key={cat.name} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-th-text-primary">{cat.name}</span>
                        <span className="text-[10px] text-th-text-tertiary">{cat.desc}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-th-text-primary tabular-nums">{cat.count} deals</p>
                      <p className="text-[10px] text-th-text-tertiary tabular-nums">{fmt(cat.value)} → <span className="font-bold" style={{ color: cat.color }}>{fmt(weighted)}</span></p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'quarterly' && (
          <div className="space-y-2">
            {MOCK_QUARTERLY.map((q) => {
              const actual = q.actual || q.forecast || 0;
              const attPct = q.attainment;
              return (
                <div key={q.quarter} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-th-text-primary">{q.quarter}</span>
                    <span className={cn('text-xs font-bold tabular-nums', attPct >= 90 ? 'text-green-500' : attPct >= 70 ? 'text-amber-500' : 'text-red-500')}>
                      {attPct > 0 ? `${attPct}%` : 'No data'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-th-text-tertiary">Target:</span> <span className="font-medium text-th-text-primary tabular-nums">{fmt(q.target)}</span></div>
                    <div><span className="text-th-text-tertiary">{q.actual ? 'Actual' : 'Forecast'}:</span> <span className="font-medium text-th-text-primary tabular-nums">{actual > 0 ? fmt(actual) : '—'}</span></div>
                  </div>
                  {attPct > 0 && (
                    <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mt-2">
                      <div className={cn('h-full rounded-full', attPct >= 90 ? 'bg-green-500' : attPct >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(attPct, 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Forecast Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Q2 forecast is at <strong>88% attainment</strong>. Focus on converting 3 "Best Case" deals to close the {fmt(75000)} gap.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
