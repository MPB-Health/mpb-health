import { Modal } from '../Modal';
import { BarChart3, DollarSign, ArrowRight, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PipelineSummaryModalProps { open: boolean; onClose: () => void; stageTotals: Record<string, { count: number; value: number }>; stageNames: string[]; }

export function PipelineSummaryModal({ open, onClose, stageTotals, stageNames }: PipelineSummaryModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const stages = stageNames.map((name) => ({ name, ...(stageTotals[name] || { count: 0, value: 0 }) }));
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const totalDeals = stages.reduce((s, st) => s + st.count, 0);
  const totalValue = stages.reduce((s, st) => s + st.value, 0);

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Summary" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalDeals}</p>
            <p className="text-[10px] text-th-text-tertiary">Open Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalValue)}</p>
            <p className="text-[10px] text-th-text-tertiary">Pipeline Value</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{totalDeals > 0 ? fmt(totalValue / totalDeals) : '$0'}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Deal Size</p>
          </div>
        </div>

        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const widthPct = Math.max((stage.count / maxCount) * 100, 8);
            const prevCount = idx > 0 ? stages[idx - 1].count : stage.count;
            const convRate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(0) : '100';
            const dropOff = idx > 0 ? prevCount - stage.count : 0;
            return (
              <div key={stage.name}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 py-1 px-4">
                    <ArrowRight className="w-3 h-3 text-th-text-tertiary rotate-90" />
                    <span className="text-[10px] text-green-500 font-medium">{convRate}%</span>
                    {dropOff > 0 && <span className="text-[10px] text-red-500">({dropOff} dropped)</span>}
                  </div>
                )}
                <div className="flex items-center gap-3 p-2">
                  <span className="text-xs font-medium text-th-text-secondary w-28 text-right truncate">{stage.name}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 rounded-lg overflow-hidden flex items-center bg-blue-500/10" style={{ width: `${widthPct}%` }}>
                      <div className="h-full rounded-lg flex items-center px-3 w-full bg-blue-500/30">
                        <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{stage.count} deals</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary tabular-nums w-14 text-right">{fmt(stage.value)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Pipeline Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Your pipeline has <strong>{totalDeals}</strong> active deals worth <strong>{fmt(totalValue)}</strong>. Focus on advancing deals from the stages with the highest drop-off.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
