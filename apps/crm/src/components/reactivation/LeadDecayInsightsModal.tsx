import { useState } from 'react';
import { Modal } from '../Modal';
import {
  TrendingDown, Calendar, AlertTriangle, Clock, BarChart3,
  ArrowRight, Sparkles, Users, Target,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DecayBucket {
  label: string;
  range: string;
  count: number;
  pct: number;
  color: string;
}

interface MonthlyDecay {
  month: string;
  newStale: number;
  recovered: number;
  net: number;
}

interface LeadDecayInsightsModalProps {
  open: boolean;
  onClose: () => void;
}

const DECAY_BUCKETS: DecayBucket[] = [
  { label: 'At Risk', range: '30-60 days', count: 42, pct: 17, color: 'bg-amber-500' },
  { label: 'Stale', range: '60-90 days', count: 64, pct: 26, color: 'bg-orange-500' },
  { label: 'Cold', range: '90-120 days', count: 53, pct: 21, color: 'bg-red-500' },
  { label: 'Frozen', range: '120-180 days', count: 48, pct: 19, color: 'bg-red-700' },
  { label: 'Dead', range: '180+ days', count: 40, pct: 16, color: 'bg-gray-500' },
];

const MONTHLY_DECAY: MonthlyDecay[] = [
  { month: 'Nov', newStale: 28, recovered: 8, net: 20 },
  { month: 'Dec', newStale: 45, recovered: 12, net: 33 },
  { month: 'Jan', newStale: 52, recovered: 15, net: 37 },
  { month: 'Feb', newStale: 38, recovered: 18, net: 20 },
  { month: 'Mar', newStale: 31, recovered: 22, net: 9 },
  { month: 'Apr', newStale: 18, recovered: 25, net: -7 },
];

const STAGE_DECAY = [
  { stage: 'new → stale', avgDays: 45, count: 89, risk: 'high' },
  { stage: 'contacted → stale', avgDays: 68, count: 64, risk: 'medium' },
  { stage: 'qualified → stale', avgDays: 92, count: 42, risk: 'low' },
  { stage: 'proposal → stale', avgDays: 35, count: 31, risk: 'high' },
  { stage: 'negotiation → stale', avgDays: 21, count: 21, risk: 'critical' },
];

const RISK_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-500/10', high: 'text-orange-500 bg-orange-500/10',
  medium: 'text-amber-500 bg-amber-500/10', low: 'text-green-500 bg-green-500/10',
};

export function LeadDecayInsightsModal({ open, onClose }: LeadDecayInsightsModalProps) {
  const totalStale = DECAY_BUCKETS.reduce((s, b) => s + b.count, 0);

  return (
    <Modal open={open} onClose={onClose} title="Lead Decay Insights" size="2xl">
      <div className="space-y-4">
        {/* Decay distribution */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Decay Distribution ({totalStale} stale leads)</p>
          <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden">
            {DECAY_BUCKETS.map((b) => (
              <div key={b.label} className={cn('flex items-center justify-center transition-all', b.color)} style={{ width: `${b.pct}%` }}>
                <span className="text-[9px] font-bold text-white">{b.count}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            {DECAY_BUCKETS.map((b) => (
              <div key={b.label} className="flex items-center gap-1 text-[10px] text-th-text-tertiary">
                <span className={cn('w-2 h-2 rounded', b.color)} /> {b.label} ({b.range})
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Monthly trend */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Decay vs Recovery</p>
            <div className="space-y-1.5">
              {MONTHLY_DECAY.map((m) => (
                <div key={m.month} className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-8">{m.month}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-3 rounded-full bg-surface-tertiary overflow-hidden flex">
                      <div className="h-full bg-red-500/60 rounded-l" style={{ width: `${(m.newStale / 60) * 100}%` }} />
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-surface-tertiary overflow-hidden flex justify-end">
                      <div className="h-full bg-green-500/60 rounded-r" style={{ width: `${(m.recovered / 30) * 100}%` }} />
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold tabular-nums w-8 text-right', m.net < 0 ? 'text-green-500' : 'text-red-500')}>
                    {m.net > 0 ? '+' : ''}{m.net}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-red-500/60" /> New stale</span>
              <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-green-500/60" /> Recovered</span>
            </div>
          </div>

          {/* Stage decay speed */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Decay Speed by Stage</p>
            <div className="space-y-1.5">
              {STAGE_DECAY.map((sd) => (
                <div key={sd.stage} className="flex items-center gap-2 p-2 rounded-lg border border-th-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-th-text-primary">{sd.stage}</p>
                    <p className="text-[10px] text-th-text-tertiary">{sd.count} leads · avg {sd.avgDays} days</p>
                  </div>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', RISK_COLORS[sd.risk])}>
                    {sd.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Decay Pattern Insights</span>
          </div>
          <div className="space-y-1 text-xs text-th-text-secondary">
            <p><strong>Negotiation stage</strong> has the fastest decay (21d avg) — these leads need immediate attention or they're lost.</p>
            <p><strong>December spike</strong> in new stale leads correlates with holiday season. Schedule pre-holiday outreach in November.</p>
            <p><strong>April recovery</strong> exceeded new stale for the first time — reactivation efforts are paying off.</p>
            <p>Leads that go <strong>120+ days stale</strong> have only a 6% win-back rate. Focus cadence energy on the &lt;120 day bucket.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
