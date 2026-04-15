import { Modal } from '../Modal';
import { AlertTriangle, Clock, TrendingUp, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageBottleneckModalProps { open: boolean; onClose: () => void; }

const MOCK = [
  { stage: 'Qualification', avgDays: 3.2, stuckCount: 1, deals: 18, color: '#3b82f6' },
  { stage: 'Needs Analysis', avgDays: 5.8, stuckCount: 2, deals: 14, color: '#8b5cf6' },
  { stage: 'Value Proposition', avgDays: 7.4, stuckCount: 3, deals: 11, color: '#f59e0b' },
  { stage: 'Decision Makers', avgDays: 4.1, stuckCount: 1, deals: 8, color: '#10b981' },
  { stage: 'Proposal', avgDays: 9.6, stuckCount: 4, deals: 6, color: '#ef4444' },
  { stage: 'Negotiation', avgDays: 6.2, stuckCount: 2, deals: 4, color: '#06b6d4' },
];

export function StageBottleneckModal({ open, onClose }: StageBottleneckModalProps) {
  const maxDays = Math.max(...MOCK.map((s) => s.avgDays), 1);
  const bottleneck = MOCK.reduce((a, b) => a.avgDays > b.avgDays ? a : b);
  const totalStuck = MOCK.reduce((s, st) => s + st.stuckCount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Stage Bottlenecks" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{bottleneck.stage}</p>
            <p className="text-[10px] text-th-text-tertiary">Worst Bottleneck</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{bottleneck.avgDays}d</p>
            <p className="text-[10px] text-th-text-tertiary">Slowest Stage</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalStuck}</p>
            <p className="text-[10px] text-th-text-tertiary">Stuck Deals</p>
          </div>
        </div>

        <div className="space-y-2">
          {MOCK.map((stage) => {
            const isBottleneck = stage.stage === bottleneck.stage;
            return (
              <div key={stage.stage} className={cn('p-3 rounded-xl border', isBottleneck ? 'border-red-500/30 bg-red-500/5' : 'border-th-border/50')}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-th-text-primary">{stage.stage}</span>
                      {isBottleneck && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">Bottleneck</span>}
                      {stage.stuckCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">{stage.stuckCount} stuck</span>}
                    </div>
                    <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(stage.avgDays / maxDays) * 100}%`, backgroundColor: stage.avgDays === maxDays ? '#ef4444' : stage.color }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center shrink-0">
                    <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{stage.avgDays}d</p><p className="text-[8px] text-th-text-tertiary">Avg Time</p></div>
                    <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{stage.deals}</p><p className="text-[8px] text-th-text-tertiary">Deals</p></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Bottleneck Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Proposal</strong> stage averages {bottleneck.avgDays} days with {bottleneck.stuckCount} stuck deals. Streamline proposal templates to reduce cycle time.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
