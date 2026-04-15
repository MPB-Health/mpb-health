import { useState } from 'react';
import { Modal } from '../Modal';
import { Camera, Calendar, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PipelineSnapshotModalProps { open: boolean; onClose: () => void; }

const MOCK_SNAPSHOTS = [
  { date: 'Apr 14', deals: 50, value: 1175000, weighted: 468000 },
  { date: 'Apr 7', deals: 48, value: 1120000, weighted: 445000 },
  { date: 'Mar 31', deals: 44, value: 980000, weighted: 392000 },
  { date: 'Mar 24', deals: 42, value: 920000, weighted: 368000 },
  { date: 'Mar 17', deals: 38, value: 845000, weighted: 338000 },
];

export function PipelineSnapshotModal({ open, onClose }: PipelineSnapshotModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const latest = MOCK_SNAPSHOTS[0];
  const prev = MOCK_SNAPSHOTS[1];
  const dealDelta = latest.deals - prev.deals;
  const valueDelta = latest.value - prev.value;

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Snapshots" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Camera className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{latest.deals}</p>
            <p className="text-[10px] text-th-text-tertiary">Current Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            {dealDelta >= 0 ? <ArrowUpRight className="w-4 h-4 text-green-500 mx-auto mb-1" /> : <ArrowDownRight className="w-4 h-4 text-red-500 mx-auto mb-1" />}
            <p className={cn('text-lg font-bold tabular-nums', dealDelta >= 0 ? 'text-green-500' : 'text-red-500')}>{dealDelta >= 0 ? '+' : ''}{dealDelta}</p>
            <p className="text-[10px] text-th-text-tertiary">vs Last Week</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            {valueDelta >= 0 ? <ArrowUpRight className="w-4 h-4 text-green-500 mx-auto mb-1" /> : <ArrowDownRight className="w-4 h-4 text-red-500 mx-auto mb-1" />}
            <p className={cn('text-sm font-bold tabular-nums', valueDelta >= 0 ? 'text-green-500' : 'text-red-500')}>{valueDelta >= 0 ? '+' : ''}{fmt(valueDelta)}</p>
            <p className="text-[10px] text-th-text-tertiary">Value Change</p>
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-surface-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Date</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Deals</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Value</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Weighted</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Change</th>
            </tr></thead>
            <tbody>
              {MOCK_SNAPSHOTS.map((snap, idx) => {
                const prevSnap = MOCK_SNAPSHOTS[idx + 1];
                const change = prevSnap ? snap.value - prevSnap.value : 0;
                return (
                  <tr key={snap.date} className={cn('border-t border-th-border/20', idx === 0 && 'bg-blue-500/5')}>
                    <td className="px-3 py-2.5 font-medium text-th-text-primary flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-th-text-tertiary" />{snap.date}
                      {idx === 0 && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">Latest</span>}
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{snap.deals}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{fmt(snap.value)}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{fmt(snap.weighted)}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">
                      {prevSnap ? (
                        <span className={cn('font-bold', change >= 0 ? 'text-green-500' : 'text-red-500')}>{change >= 0 ? '+' : ''}{fmt(change)}</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Snapshot Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Pipeline has grown <strong>{fmt(latest.value - MOCK_SNAPSHOTS[MOCK_SNAPSHOTS.length - 1].value)}</strong> over 4 weeks with consistent week-over-week increases.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
