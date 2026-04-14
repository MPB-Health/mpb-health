import { useState } from 'react';
import { Modal } from '../Modal';
import {
  TrendingUp, DollarSign, Users, Target, BarChart3, Sparkles,
  ArrowRight, Clock, CheckCircle2, Zap,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ForecastScenario {
  id: string;
  label: string;
  description: string;
  enrollRate: number;
  winBackRate: number;
  avgRevenue: number;
  totalLeadsTargeted: number;
  projectedConversions: number;
  projectedRevenue: number;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
}

interface ReactivationForecastModalProps {
  open: boolean;
  onClose: () => void;
  staleLeadCount?: number;
}

const SCENARIOS: ForecastScenario[] = [
  { id: 'conservative', label: 'Conservative', description: 'Email-only cadence, existing stale leads',
    enrollRate: 40, winBackRate: 8, avgRevenue: 1800, totalLeadsTargeted: 100, projectedConversions: 3,
    projectedRevenue: 5400, timeframe: '60 days', effort: 'low' },
  { id: 'moderate', label: 'Moderate', description: 'Multi-channel cadence (email + calls), prioritized by AI score',
    enrollRate: 65, winBackRate: 15, avgRevenue: 2200, totalLeadsTargeted: 160, projectedConversions: 16,
    projectedRevenue: 35200, timeframe: '90 days', effort: 'medium' },
  { id: 'aggressive', label: 'Aggressive', description: 'Full multi-channel + segmented campaigns + competitive pitches',
    enrollRate: 85, winBackRate: 22, avgRevenue: 2600, totalLeadsTargeted: 210, projectedConversions: 39,
    projectedRevenue: 101400, timeframe: '120 days', effort: 'high' },
];

const EFFORT_COLORS: Record<string, string> = {
  low: 'text-green-500 bg-green-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  high: 'text-red-500 bg-red-500/10',
};

const MONTHLY_PROJECTION = [
  { month: 'May', conservative: 1800, moderate: 8800, aggressive: 20000 },
  { month: 'Jun', conservative: 1800, moderate: 13200, aggressive: 33800 },
  { month: 'Jul', conservative: 1800, moderate: 13200, aggressive: 33800 },
  { month: 'Aug', conservative: 0, moderate: 0, aggressive: 13800 },
];

function currencyFmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
}

export function ReactivationForecastModal({ open, onClose, staleLeadCount = 247 }: ReactivationForecastModalProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('moderate');
  const scenario = SCENARIOS.find((s) => s.id === selectedScenario)!;

  return (
    <Modal open={open} onClose={onClose} title="Reactivation Revenue Forecast" size="2xl">
      <div className="space-y-4">
        {/* Starting point */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>{staleLeadCount}</strong> stale leads in your pipeline. Here's what reactivation could recover based on historical win-back data.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-3 gap-3">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => setSelectedScenario(s.id)} className={cn(
              'p-4 rounded-xl border text-left transition-all',
              selectedScenario === s.id ? 'border-th-accent-500/50 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-accent-500/30'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-th-text-primary">{s.label}</span>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', EFFORT_COLORS[s.effort])}>
                  {s.effort} effort
                </span>
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-3">{s.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-th-text-tertiary">Projected conversions</span>
                  <span className="font-bold text-th-text-primary tabular-nums">{s.projectedConversions}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-th-text-tertiary">Projected revenue</span>
                  <span className="font-bold text-green-500 tabular-nums">{currencyFmt(s.projectedRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-th-text-tertiary">Timeframe</span>
                  <span className="font-medium text-th-text-primary">{s.timeframe}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Conversion funnel */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Projected Funnel — {scenario.label}</p>
            <div className="space-y-2">
              {[
                { label: 'Stale Leads', value: staleLeadCount, pct: 100, color: 'bg-red-500' },
                { label: 'Enrolled in Cadence', value: Math.round(staleLeadCount * scenario.enrollRate / 100), pct: scenario.enrollRate, color: 'bg-amber-500' },
                { label: 'Re-engaged', value: Math.round(staleLeadCount * scenario.enrollRate / 100 * scenario.winBackRate / 100 * 2.5), pct: scenario.enrollRate * 0.4, color: 'bg-blue-500' },
                { label: 'Converted', value: scenario.projectedConversions, pct: (scenario.projectedConversions / staleLeadCount) * 100, color: 'bg-green-500' },
              ].map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-th-text-secondary flex-1">{step.label}</span>
                    <span className="text-xs font-bold text-th-text-primary tabular-nums">{step.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', step.color)} style={{ width: `${Math.max(2, step.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly projection */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Revenue Projection</p>
            <div className="space-y-1.5">
              {MONTHLY_PROJECTION.map((m) => {
                const value = m[selectedScenario as keyof typeof m] as number;
                const maxVal = Math.max(...MONTHLY_PROJECTION.map((x) => x[selectedScenario as keyof typeof x] as number));
                const pct = maxVal ? (value / maxVal) * 100 : 0;
                return (
                  <div key={m.month} className="flex items-center gap-2">
                    <span className="text-xs text-th-text-tertiary w-8">{m.month}</span>
                    <div className="flex-1 h-4 rounded bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded bg-green-500/50 flex items-center justify-end px-1 transition-all" style={{ width: `${pct}%` }}>
                        {value > 0 && <span className="text-[9px] font-bold text-green-900 dark:text-green-100">{currencyFmt(value)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-[10px] text-th-text-tertiary">Total Projected</p>
              <p className="text-lg font-bold text-green-500 tabular-nums">{currencyFmt(scenario.projectedRevenue)}</p>
              <p className="text-[10px] text-th-text-tertiary">over {scenario.timeframe}</p>
            </div>
          </div>
        </div>

        {/* AI recommendation */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Recommendation</span>
          </div>
          <p className="text-xs text-th-text-secondary">
            Based on your historical data, the <strong>Moderate</strong> scenario offers the best ROI — {currencyFmt(SCENARIOS[1].projectedRevenue)} projected revenue
            with manageable effort. Start with AI-scored leads (score 70+) for the highest conversion probability, then expand to the full pipeline.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
