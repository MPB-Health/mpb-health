import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, DollarSign, Target, Sparkles, Calendar } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteForecastModalProps { open: boolean; onClose: () => void; pendingValue: number; }

const FORECAST = [
  { scenario: 'Conservative', winRate: 30, label: '30% win rate', color: '#ef4444' },
  { scenario: 'Realistic', winRate: 43, label: '43% (current)', color: '#f59e0b' },
  { scenario: 'Optimistic', winRate: 60, label: '60% win rate', color: '#10b981' },
];

const MONTHLY_FORECAST = [
  { month: 'Apr', expected: 18000, best: 28000, worst: 10000 },
  { month: 'May', expected: 22000, best: 34000, worst: 12000 },
  { month: 'Jun', expected: 26000, best: 40000, worst: 14000 },
  { month: 'Jul', expected: 20000, best: 32000, worst: 11000 },
];

const PIPELINE_BY_STATUS = [
  { status: 'Sent (awaiting response)', value: 32000, probability: 55, expected: 17600 },
  { status: 'Pending (in review)', value: 24000, probability: 70, expected: 16800 },
  { status: 'Draft (not yet sent)', value: 18000, probability: 25, expected: 4500 },
];

export function QuoteForecastModal({ open, onClose, pendingValue }: QuoteForecastModalProps) {
  const [scenario, setScenario] = useState(1);
  const totalPipeline = 74000;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const maxMonthly = Math.max(...MONTHLY_FORECAST.map((m) => m.best), 1);

  return (
    <Modal open={open} onClose={onClose} title="Revenue Forecast" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalPipeline)}</p>
            <p className="text-[10px] text-th-text-tertiary">Pipeline Value</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(Math.round(totalPipeline * (FORECAST[scenario].winRate / 100)))}</p>
            <p className="text-[10px] text-th-text-tertiary">Expected Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(38900)}</p>
            <p className="text-[10px] text-th-text-tertiary">Weighted Forecast</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Scenario Modeling</p>
          <div className="space-y-1.5">
            {FORECAST.map((f, i) => (
              <button key={f.scenario} onClick={() => setScenario(i)} className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left', scenario === i ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/30')}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: f.color }}>{f.winRate}%</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-th-text-primary">{f.scenario}</p>
                  <p className="text-[9px] text-th-text-tertiary">{f.label}</p>
                </div>
                <span className="text-sm font-bold text-th-text-primary tabular-nums">{fmt(Math.round(totalPipeline * (f.winRate / 100)))}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Forecast (Next 4 Months)</p>
          <div className="space-y-1.5">
            {MONTHLY_FORECAST.map((m) => (
              <div key={m.month} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-6">{m.month}</span>
                <div className="flex-1 h-5 rounded bg-surface-tertiary overflow-hidden relative">
                  <div className="absolute h-full rounded bg-green-500/15" style={{ width: `${(m.best / maxMonthly) * 100}%` }} />
                  <div className="absolute h-full rounded bg-amber-500/30" style={{ width: `${(m.expected / maxMonthly) * 100}%` }} />
                  <div className="absolute h-full rounded bg-red-500/20" style={{ width: `${(m.worst / maxMonthly) * 100}%` }} />
                </div>
                <span className="text-[9px] font-bold text-th-text-primary tabular-nums w-12 text-right">{fmt(m.expected)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-1.5 text-[8px] text-th-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/40" />Worst</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/40" />Expected</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/40" />Best</span>
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50"><p className="text-xs font-semibold text-th-text-secondary">Weighted Pipeline</p></div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-th-border/30">
              <th className="text-left px-3 py-1.5 text-th-text-tertiary font-medium">Status</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Value</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Prob</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Expected</th>
            </tr></thead>
            <tbody>{PIPELINE_BY_STATUS.map((p) => (
              <tr key={p.status} className="border-t border-th-border/20">
                <td className="px-3 py-2 text-th-text-primary font-medium">{p.status}</td>
                <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{fmt(p.value)}</td>
                <td className="text-right px-3 py-2 tabular-nums text-th-text-tertiary">{p.probability}%</td>
                <td className="text-right px-3 py-2 tabular-nums font-bold text-green-500">{fmt(p.expected)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Forecast Insight</span></div>
          <p className="text-xs text-th-text-secondary">Your weighted pipeline of <strong>{fmt(38900)}</strong> is strong. Pending quotes ($24k) have a 70% close probability — prioritize follow-ups there for the best ROI.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
