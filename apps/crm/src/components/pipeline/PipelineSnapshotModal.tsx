import { useState } from 'react';
import { Modal } from '../Modal';
import { Camera, Calendar, TrendingUp, TrendingDown, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Snapshot { date: string; label: string; stages: { name: string; count: number; color: string }[]; totalValue: number; }
interface PipelineSnapshotModalProps { open: boolean; onClose: () => void; }

const MOCK_SNAPSHOTS: Snapshot[] = [
  { date: '2026-04-14', label: 'Today', stages: [
    { name: 'New', count: 98, color: '#3b82f6' }, { name: 'Contacted', count: 64, color: '#8b5cf6' },
    { name: 'Qualified', count: 42, color: '#f59e0b' }, { name: 'Proposal', count: 28, color: '#ef4444' },
    { name: 'Negotiation', count: 18, color: '#10b981' }, { name: 'Won', count: 14, color: '#22c55e' },
  ], totalValue: 264 },
  { date: '2026-04-07', label: '1 Week Ago', stages: [
    { name: 'New', count: 112, color: '#3b82f6' }, { name: 'Contacted', count: 58, color: '#8b5cf6' },
    { name: 'Qualified', count: 38, color: '#f59e0b' }, { name: 'Proposal', count: 24, color: '#ef4444' },
    { name: 'Negotiation', count: 15, color: '#10b981' }, { name: 'Won', count: 11, color: '#22c55e' },
  ], totalValue: 258 },
  { date: '2026-03-14', label: '1 Month Ago', stages: [
    { name: 'New', count: 134, color: '#3b82f6' }, { name: 'Contacted', count: 72, color: '#8b5cf6' },
    { name: 'Qualified', count: 35, color: '#f59e0b' }, { name: 'Proposal', count: 18, color: '#ef4444' },
    { name: 'Negotiation', count: 12, color: '#10b981' }, { name: 'Won', count: 6, color: '#22c55e' },
  ], totalValue: 277 },
  { date: '2026-01-14', label: '3 Months Ago', stages: [
    { name: 'New', count: 156, color: '#3b82f6' }, { name: 'Contacted', count: 48, color: '#8b5cf6' },
    { name: 'Qualified', count: 22, color: '#f59e0b' }, { name: 'Proposal', count: 12, color: '#ef4444' },
    { name: 'Negotiation', count: 8, color: '#10b981' }, { name: 'Won', count: 3, color: '#22c55e' },
  ], totalValue: 249 },
];

export function PipelineSnapshotModal({ open, onClose }: PipelineSnapshotModalProps) {
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  const snapA = MOCK_SNAPSHOTS[compareA];
  const snapB = MOCK_SNAPSHOTS[compareB];

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Snapshots" size="2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-th-text-tertiary">Compare</label>
            <select value={compareA} onChange={(e) => setCompareA(Number(e.target.value))}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
              {MOCK_SNAPSHOTS.map((s, i) => <option key={i} value={i}>{s.label} ({s.date})</option>)}
            </select>
          </div>
          <ArrowRight className="w-4 h-4 text-th-text-tertiary mt-4" />
          <div className="flex-1">
            <label className="text-[10px] text-th-text-tertiary">With</label>
            <select value={compareB} onChange={(e) => setCompareB(Number(e.target.value))}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
              {MOCK_SNAPSHOTS.map((s, i) => <option key={i} value={i}>{s.label} ({s.date})</option>)}
            </select>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Stage</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">{snapA.label}</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">{snapB.label}</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Change</th>
              </tr>
            </thead>
            <tbody>
              {snapA.stages.map((stageA, idx) => {
                const stageB = snapB.stages[idx];
                const diff = stageA.count - (stageB?.count || 0);
                const pctChange = stageB?.count ? ((diff / stageB.count) * 100) : 0;
                return (
                  <tr key={stageA.name} className="border-t border-th-border/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stageA.color }} />
                        <span className="font-medium text-th-text-primary">{stageA.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 font-bold text-th-text-primary tabular-nums">{stageA.count}</td>
                    <td className="text-right px-3 py-2.5 text-th-text-secondary tabular-nums">{stageB?.count || 0}</td>
                    <td className="text-right px-3 py-2.5">
                      <span className={cn('font-bold tabular-nums', diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-th-text-tertiary')}>
                        {diff > 0 ? '+' : ''}{diff}
                        <span className="text-[10px] ml-0.5">({pctChange > 0 ? '+' : ''}{pctChange.toFixed(0)}%)</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-th-border bg-surface-secondary/30">
                <td className="px-3 py-2.5 font-semibold text-th-text-primary">Total</td>
                <td className="text-right px-3 py-2.5 font-bold text-th-text-primary tabular-nums">{snapA.totalValue}</td>
                <td className="text-right px-3 py-2.5 text-th-text-secondary tabular-nums">{snapB.totalValue}</td>
                <td className="text-right px-3 py-2.5">
                  {(() => { const d = snapA.totalValue - snapB.totalValue; return (
                    <span className={cn('font-bold tabular-nums', d > 0 ? 'text-green-500' : d < 0 ? 'text-red-500' : 'text-th-text-tertiary')}>
                      {d > 0 ? '+' : ''}{d}
                    </span>
                  ); })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visual bars */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-th-text-secondary">Visual Comparison</p>
          {snapA.stages.map((stageA, idx) => {
            const stageB = snapB.stages[idx];
            const maxVal = Math.max(stageA.count, stageB?.count || 0, 1);
            return (
              <div key={stageA.name} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-20 text-right">{stageA.name}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="h-2.5 rounded-full" style={{ width: `${(stageA.count / maxVal) * 100}%`, backgroundColor: stageA.color + '80' }} />
                  <div className="h-2.5 rounded-full" style={{ width: `${((stageB?.count || 0) / maxVal) * 100}%`, backgroundColor: stageA.color + '30' }} />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-3 h-2 rounded" style={{ backgroundColor: '#3b82f680' }} /> {snapA.label}</span>
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-3 h-2 rounded" style={{ backgroundColor: '#3b82f630' }} /> {snapB.label}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
