import { useState } from 'react';
import { Modal } from '../Modal';
import {
  BarChart3, TrendingUp, TrendingDown, Clock, Users, ArrowRight,
  Target, DollarSign, Sparkles, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageMetric {
  stage: string;
  color: string;
  leads: number;
  avgDaysInStage: number;
  conversionRate: number;
  dropOffRate: number;
  velocity: 'fast' | 'normal' | 'slow';
}

interface PipelineAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  stages?: { name: string; display_name: string; color: string }[];
  leadsByStage?: Record<string, unknown[]>;
}

const MOCK_METRICS: StageMetric[] = [
  { stage: 'New', color: '#3b82f6', leads: 98, avgDaysInStage: 2.1, conversionRate: 72, dropOffRate: 28, velocity: 'fast' },
  { stage: 'Contacted', color: '#8b5cf6', leads: 64, avgDaysInStage: 4.5, conversionRate: 58, dropOffRate: 14, velocity: 'normal' },
  { stage: 'Qualified', color: '#f59e0b', leads: 42, avgDaysInStage: 6.8, conversionRate: 65, dropOffRate: 7, velocity: 'slow' },
  { stage: 'Proposal', color: '#ef4444', leads: 28, avgDaysInStage: 3.2, conversionRate: 71, dropOffRate: 8, velocity: 'normal' },
  { stage: 'Negotiation', color: '#10b981', leads: 18, avgDaysInStage: 5.1, conversionRate: 78, dropOffRate: 5, velocity: 'fast' },
  { stage: 'Won', color: '#22c55e', leads: 14, avgDaysInStage: 0, conversionRate: 100, dropOffRate: 0, velocity: 'fast' },
];

const VELOCITY_CONFIG = {
  fast: { label: 'Fast', color: 'text-green-500 bg-green-500/10' },
  normal: { label: 'Normal', color: 'text-amber-500 bg-amber-500/10' },
  slow: { label: 'Slow', color: 'text-red-500 bg-red-500/10' },
};

export function PipelineAnalyticsModal({ open, onClose }: PipelineAnalyticsModalProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const metrics = MOCK_METRICS;
  const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
  const avgCycleTime = metrics.filter((m) => m.avgDaysInStage > 0).reduce((s, m) => s + m.avgDaysInStage, 0);
  const overallConversion = metrics.length > 1 ? ((metrics[metrics.length - 1].leads / metrics[0].leads) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Analytics" size="2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}</button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total in Pipeline', value: totalLeads, icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Overall Conversion', value: `${overallConversion.toFixed(1)}%`, icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Avg Cycle Time', value: `${avgCycleTime.toFixed(0)}d`, icon: Clock, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Bottleneck', value: 'Qualified', icon: AlertTriangle, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Stage-by-stage table */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Stage</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Leads</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Avg Days</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Conversion</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Drop-off</th>
                <th className="text-center px-3 py-2 font-medium text-th-text-tertiary">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, idx) => (
                <tr key={m.stage} className="border-t border-th-border/30">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="font-medium text-th-text-primary">{m.stage}</span>
                    </div>
                  </td>
                  <td className="text-right px-3 py-2.5 font-bold text-th-text-primary tabular-nums">{m.leads}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{m.avgDaysInStage > 0 ? `${m.avgDaysInStage}d` : '—'}</td>
                  <td className="text-right px-3 py-2.5">
                    {idx < metrics.length - 1 && (
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${m.conversionRate}%` }} />
                        </div>
                        <span className="tabular-nums text-th-text-secondary">{m.conversionRate}%</span>
                      </div>
                    )}
                  </td>
                  <td className="text-right px-3 py-2.5">
                    {m.dropOffRate > 0 && <span className="text-red-500 tabular-nums">{m.dropOffRate}%</span>}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    {m.avgDaysInStage > 0 && (
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', VELOCITY_CONFIG[m.velocity].color)}>
                        {VELOCITY_CONFIG[m.velocity].label}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insights */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Pipeline Insights</span>
          </div>
          <div className="space-y-1 text-xs text-th-text-secondary">
            <p><strong>Qualified stage</strong> is your bottleneck — 6.8 days avg with the slowest velocity. Add a touchpoint at day 3.</p>
            <p>Leads that reach <strong>Negotiation</strong> convert at 78%. Focus energy on getting more leads past Proposal.</p>
            <p>Your <strong>New → Contacted</strong> drop-off of 28% is above benchmark (20%). Speed up first-contact SLA.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
