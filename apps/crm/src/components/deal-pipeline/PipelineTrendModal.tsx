import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, DollarSign, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PipelineTrendModalProps { open: boolean; onClose: () => void; }

const MOCK_WEEKS = [
  { week: 'W1 Mar', added: 8, won: 3, lost: 1, moved: 5, netValue: 142000 },
  { week: 'W2 Mar', added: 6, won: 2, lost: 2, moved: 4, netValue: 98000 },
  { week: 'W3 Mar', added: 10, won: 4, lost: 1, moved: 7, netValue: 186000 },
  { week: 'W4 Mar', added: 5, won: 2, lost: 0, moved: 6, netValue: 112000 },
  { week: 'W1 Apr', added: 7, won: 3, lost: 1, moved: 5, netValue: 134000 },
  { week: 'W2 Apr', added: 4, won: 1, lost: 0, moved: 3, netValue: 82000 },
];

export function PipelineTrendModal({ open, onClose }: PipelineTrendModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const maxBar = Math.max(...MOCK_WEEKS.map((w) => Math.max(w.added, w.won, w.lost)), 1);
  const totalAdded = MOCK_WEEKS.reduce((s, w) => s + w.added, 0);
  const totalWon = MOCK_WEEKS.reduce((s, w) => s + w.won, 0);
  const totalLost = MOCK_WEEKS.reduce((s, w) => s + w.lost, 0);
  const netDeals = totalAdded - totalWon - totalLost;

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Trend" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Added', value: String(totalAdded), icon: ArrowUpRight, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Won', value: String(totalWon), icon: Target, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Lost', value: String(totalLost), icon: ArrowDownRight, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
            { label: 'Net Change', value: `${netDeals >= 0 ? '+' : ''}${netDeals}`, icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Weekly Activity</p>
          <div className="space-y-2">
            {MOCK_WEEKS.map((w) => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-[10px] text-th-text-tertiary w-14">{w.week}</span>
                <div className="flex-1 flex items-center gap-1 h-4">
                  <div className="h-full rounded bg-green-500/50" style={{ width: `${(w.added / maxBar) * 40}%` }} title={`${w.added} added`} />
                  <div className="h-full rounded bg-blue-500/50" style={{ width: `${(w.won / maxBar) * 40}%` }} title={`${w.won} won`} />
                  {w.lost > 0 && <div className="h-full rounded bg-red-500/40" style={{ width: `${(w.lost / maxBar) * 40}%` }} title={`${w.lost} lost`} />}
                </div>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-14 text-right">{fmt(w.netValue)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-green-500/50" />Added</span>
            <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-blue-500/50" />Won</span>
            <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-red-500/40" />Lost</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Trend Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Pipeline is growing with a net <strong>+{netDeals} deals</strong> over 6 weeks. Week 3 of March was strongest with 10 new deals added.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
