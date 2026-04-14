import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, TrendingDown, ArrowRight, Calendar, BarChart3, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PeriodData { label: string; stages: { name: string; count: number; color: string }[]; totalValue: number; conversionRate: number; avgCycleTime: number; }
interface PipelineComparisonModalProps { open: boolean; onClose: () => void; }

const MOCK_PERIODS: Record<string, PeriodData> = {
  'this-week': { label: 'This Week', stages: [
    { name: 'New', count: 32, color: '#3b82f6' }, { name: 'Contacted', count: 18, color: '#8b5cf6' },
    { name: 'Qualified', count: 12, color: '#f59e0b' }, { name: 'Proposal', count: 8, color: '#ef4444' },
    { name: 'Negotiation', count: 5, color: '#10b981' }, { name: 'Won', count: 4, color: '#22c55e' },
  ], totalValue: 79, conversionRate: 12.5, avgCycleTime: 21 },
  'last-week': { label: 'Last Week', stages: [
    { name: 'New', count: 28, color: '#3b82f6' }, { name: 'Contacted', count: 22, color: '#8b5cf6' },
    { name: 'Qualified', count: 10, color: '#f59e0b' }, { name: 'Proposal', count: 6, color: '#ef4444' },
    { name: 'Negotiation', count: 4, color: '#10b981' }, { name: 'Won', count: 3, color: '#22c55e' },
  ], totalValue: 73, conversionRate: 10.7, avgCycleTime: 24 },
  'this-month': { label: 'This Month', stages: [
    { name: 'New', count: 98, color: '#3b82f6' }, { name: 'Contacted', count: 64, color: '#8b5cf6' },
    { name: 'Qualified', count: 42, color: '#f59e0b' }, { name: 'Proposal', count: 28, color: '#ef4444' },
    { name: 'Negotiation', count: 18, color: '#10b981' }, { name: 'Won', count: 14, color: '#22c55e' },
  ], totalValue: 264, conversionRate: 14.3, avgCycleTime: 22 },
  'last-month': { label: 'Last Month', stages: [
    { name: 'New', count: 112, color: '#3b82f6' }, { name: 'Contacted', count: 58, color: '#8b5cf6' },
    { name: 'Qualified', count: 38, color: '#f59e0b' }, { name: 'Proposal', count: 24, color: '#ef4444' },
    { name: 'Negotiation', count: 15, color: '#10b981' }, { name: 'Won', count: 11, color: '#22c55e' },
  ], totalValue: 258, conversionRate: 9.8, avgCycleTime: 26 },
};

export function PipelineComparisonModal({ open, onClose }: PipelineComparisonModalProps) {
  const [periodA, setPeriodA] = useState('this-week');
  const [periodB, setPeriodB] = useState('last-week');

  const a = MOCK_PERIODS[periodA];
  const b = MOCK_PERIODS[periodB];

  const kpis = [
    { label: 'Total Leads', valA: a.stages.reduce((s, st) => s + st.count, 0), valB: b.stages.reduce((s, st) => s + st.count, 0), fmt: (n: number) => String(n) },
    { label: 'Pipeline Value', valA: a.totalValue, valB: b.totalValue, fmt: (n: number) => `$${n}k` },
    { label: 'Conversion Rate', valA: a.conversionRate, valB: b.conversionRate, fmt: (n: number) => `${n}%` },
    { label: 'Avg Cycle Time', valA: a.avgCycleTime, valB: b.avgCycleTime, fmt: (n: number) => `${n}d`, invert: true },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Comparison" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select value={periodA} onChange={(e) => setPeriodA(e.target.value)}
            className="flex-1 text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
            {Object.entries(MOCK_PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-xs text-th-text-tertiary font-medium">vs</span>
          <select value={periodB} onChange={(e) => setPeriodB(e.target.value)}
            className="flex-1 text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
            {Object.entries(MOCK_PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* KPI comparison */}
        <div className="grid grid-cols-4 gap-2">
          {kpis.map((kpi) => {
            const diff = kpi.valA - kpi.valB;
            const improved = kpi.invert ? diff < 0 : diff > 0;
            return (
              <div key={kpi.label} className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                <p className="text-[10px] text-th-text-tertiary mb-1">{kpi.label}</p>
                <p className="text-lg font-bold text-th-text-primary tabular-nums">{kpi.fmt(kpi.valA)}</p>
                <div className="flex items-center justify-center gap-1">
                  {improved ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={cn('text-[10px] font-bold tabular-nums', improved ? 'text-green-500' : 'text-red-500')}>
                    {diff > 0 ? '+' : ''}{typeof kpi.valA === 'number' && kpi.valA % 1 !== 0 ? diff.toFixed(1) : diff}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage-by-stage bars */}
        <div className="rounded-xl border border-th-border/50 p-3 space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-3 h-2 rounded bg-th-accent-500/60" /> {a.label}</span>
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-3 h-2 rounded bg-th-accent-500/20" /> {b.label}</span>
          </div>
          {a.stages.map((stageA, idx) => {
            const stageB = b.stages[idx];
            const maxVal = Math.max(stageA.count, stageB?.count || 0, 1);
            const diff = stageA.count - (stageB?.count || 0);
            return (
              <div key={stageA.name} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-20 text-right">{stageA.name}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 rounded" style={{ width: `${(stageA.count / maxVal) * 100}%`, backgroundColor: stageA.color + '80' }} />
                    <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{stageA.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 rounded" style={{ width: `${((stageB?.count || 0) / maxVal) * 100}%`, backgroundColor: stageA.color + '30' }} />
                    <span className="text-[10px] text-th-text-tertiary tabular-nums">{stageB?.count || 0}</span>
                  </div>
                </div>
                <span className={cn('text-[10px] font-bold w-8 text-right tabular-nums', diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-th-text-tertiary')}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Trend Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Conversion rate is <strong>up {(a.conversionRate - b.conversionRate).toFixed(1)}%</strong> compared to {b.label.toLowerCase()}. Keep the momentum going by maintaining faster first-contact times.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
