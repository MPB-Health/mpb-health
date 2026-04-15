import { Modal } from '../Modal';
import { DollarSign, Target, TrendingUp, Sparkles, Layers } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PipelineValueModalProps { open: boolean; onClose: () => void; stageTotals: Record<string, { count: number; value: number }>; stageNames: string[]; }

const STAGE_PROB: Record<string, number> = { 'Qualification': 10, 'Needs Analysis': 25, 'Value Proposition': 40, 'Identify Decision Makers': 55, 'Proposal': 70, 'Negotiation': 85 };

export function PipelineValueModal({ open, onClose, stageTotals, stageNames }: PipelineValueModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const stages = stageNames.map((name) => {
    const totals = stageTotals[name] || { count: 0, value: 0 };
    const prob = STAGE_PROB[name] || 30;
    return { name, ...totals, prob, weighted: Math.round(totals.value * prob / 100) };
  });

  const totalValue = stages.reduce((s, st) => s + st.value, 0);
  const totalWeighted = stages.reduce((s, st) => s + st.weighted, 0);
  const maxValue = Math.max(...stages.map((s) => s.value), 1);
  const quota = 600000;
  const coverage = totalValue > 0 ? ((totalValue / quota) * 100).toFixed(0) : '0';
  const wCoverage = totalWeighted > 0 ? ((totalWeighted / quota) * 100).toFixed(0) : '0';

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Value Analysis" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Pipeline', value: fmt(totalValue), icon: DollarSign, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Weighted', value: fmt(totalWeighted), icon: Layers, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Coverage', value: `${coverage}%`, icon: Target, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Wtd Coverage', value: `${wCoverage}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-surface-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Stage</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Deals</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Value</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Prob</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Weighted</th>
            </tr></thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.name} className="border-t border-th-border/20">
                  <td className="px-3 py-2.5 font-medium text-th-text-primary">{stage.name}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{stage.count}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{fmt(stage.value)}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{stage.prob}%</td>
                  <td className="text-right px-3 py-2.5 tabular-nums font-bold text-green-500">{fmt(stage.weighted)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-th-border bg-surface-secondary/30">
                <td className="px-3 py-2.5 font-bold text-th-text-primary">Total</td>
                <td className="text-right px-3 py-2.5 tabular-nums font-bold text-th-text-primary">{stages.reduce((s, st) => s + st.count, 0)}</td>
                <td className="text-right px-3 py-2.5 tabular-nums font-bold text-th-text-primary">{fmt(totalValue)}</td>
                <td className="text-right px-3 py-2.5" />
                <td className="text-right px-3 py-2.5 tabular-nums font-bold text-green-500">{fmt(totalWeighted)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Value Distribution</p>
          <div className="space-y-1.5">
            {stages.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-28 truncate">{s.name}</span>
                <div className="flex-1 h-3.5 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded bg-blue-500/40 flex items-center px-1" style={{ width: `${(s.value / maxValue) * 100}%` }}>
                    {s.value > 0 && <span className="text-[8px] font-bold text-th-text-primary">{fmt(s.value)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Value Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Pipeline coverage is <strong>{coverage}%</strong> of quota ({fmt(quota)}). Weighted coverage is <strong>{wCoverage}%</strong>. {Number(wCoverage) < 80 ? 'You need more pipeline to safely hit quota.' : 'Coverage looks healthy.'}</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
