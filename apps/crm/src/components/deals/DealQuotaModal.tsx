import { useState } from 'react';
import { Modal } from '../Modal';
import { Target, DollarSign, TrendingUp, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealQuotaModalProps { open: boolean; onClose: () => void; }

const MOCK_REPS = [
  { name: 'Julia Smith', quota: 150000, closed: 128000, pipeline: 86000, attainment: 85 },
  { name: 'Mark Davis', quota: 140000, closed: 112000, pipeline: 72000, attainment: 80 },
  { name: 'Sarah Johnson', quota: 120000, closed: 98000, pipeline: 64000, attainment: 82 },
  { name: 'Tom Wilson', quota: 100000, closed: 102000, pipeline: 48000, attainment: 102 },
];

export function DealQuotaModal({ open, onClose }: DealQuotaModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalQuota = MOCK_REPS.reduce((s, r) => s + r.quota, 0);
  const totalClosed = MOCK_REPS.reduce((s, r) => s + r.closed, 0);
  const teamAttainment = Math.round((totalClosed / totalQuota) * 100);
  const onTrack = MOCK_REPS.filter((r) => r.attainment >= 80).length;

  return (
    <Modal open={open} onClose={onClose} title="Quota Tracking" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalQuota)}</p>
            <p className="text-[10px] text-th-text-tertiary">Team Quota</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalClosed)}</p>
            <p className="text-[10px] text-th-text-tertiary">Closed ({teamAttainment}%)</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{onTrack}/{MOCK_REPS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">On Track</p>
          </div>
        </div>

        <div className="space-y-2">
          {MOCK_REPS.map((rep) => {
            const closedPct = Math.round((rep.closed / rep.quota) * 100);
            const pipelinePct = Math.min(Math.round(((rep.closed + rep.pipeline) / rep.quota) * 100), 100);
            const status = closedPct >= 100 ? 'exceeded' : closedPct >= 80 ? 'on-track' : closedPct >= 60 ? 'behind' : 'at-risk';
            const statusColors = { exceeded: 'bg-green-500/10 text-green-500', 'on-track': 'bg-blue-500/10 text-blue-500', behind: 'bg-amber-500/10 text-amber-500', 'at-risk': 'bg-red-500/10 text-red-500' };
            return (
              <div key={rep.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-th-text-primary">{rep.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize', statusColors[status])}>{status.replace('-', ' ')}</span>
                  </div>
                  <span className="text-xs font-bold text-th-text-primary tabular-nums">{rep.attainment}%</span>
                </div>
                <div className="h-3 rounded-full bg-surface-tertiary overflow-hidden relative">
                  <div className="h-full rounded-full bg-blue-500/30 absolute" style={{ width: `${Math.min(pipelinePct, 100)}%` }} />
                  <div className={cn('h-full rounded-full absolute', closedPct >= 100 ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${Math.min(closedPct, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-th-text-tertiary">Closed: {fmt(rep.closed)}</span>
                  <span className="text-[10px] text-th-text-tertiary">Pipeline: {fmt(rep.pipeline)}</span>
                  <span className="text-[10px] text-th-text-tertiary">Quota: {fmt(rep.quota)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Quota Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Tom Wilson</strong> exceeded quota at 102%. Team overall is at {teamAttainment}% — {fmt(totalQuota - totalClosed)} gap to close this period.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
