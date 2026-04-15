import { Modal } from '../Modal';
import { Target, DollarSign, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PipelineCoverageModalProps { open: boolean; onClose: () => void; totalValue: number; weightedValue: number; }

export function PipelineCoverageModal({ open, onClose, totalValue, weightedValue }: PipelineCoverageModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const quota = 600000;
  const committed = Math.round(totalValue * 0.18);
  const bestCase = Math.round(totalValue * 0.35);
  const pipeline = totalValue - committed - bestCase;
  const totalCoverage = Math.round((totalValue / quota) * 100);
  const weightedCoverage = Math.round((weightedValue / quota) * 100);
  const gap = Math.max(quota - weightedValue, 0);

  const categories = [
    { name: 'Committed (≥90%)', value: committed, color: '#22c55e', pct: Math.round((committed / quota) * 100) },
    { name: 'Best Case (60-89%)', value: bestCase, color: '#3b82f6', pct: Math.round((bestCase / quota) * 100) },
    { name: 'Pipeline (<60%)', value: pipeline, color: '#f59e0b', pct: Math.round((pipeline / quota) * 100) },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Coverage" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Quota', value: fmt(quota), icon: Target, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Pipeline', value: fmt(totalValue), icon: DollarSign, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Coverage', value: `${totalCoverage}%`, icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Gap', value: gap > 0 ? fmt(gap) : 'None', icon: AlertCircle, color: gap > 0 ? 'text-red-500' : 'text-green-500', bg: gap > 0 ? 'from-red-500/10 to-rose-500/10' : 'from-green-500/10 to-emerald-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-3">Coverage Breakdown</p>
          <div className="h-6 rounded-full bg-surface-tertiary overflow-hidden flex">
            {categories.map((c) => (
              <div key={c.name} className="h-full flex items-center justify-center" style={{ width: `${Math.max(c.pct, 2)}%`, backgroundColor: c.color }}>
                {c.pct > 8 && <span className="text-[8px] font-bold text-white">{c.pct}%</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {categories.map((c) => (
              <span key={c.name} className="flex items-center gap-1 text-[9px] text-th-text-tertiary">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: c.color }} />{c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
              <div className="w-3 h-6 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-th-text-primary">{cat.name}</span>
              </div>
              <span className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(cat.value)}</span>
              <span className="text-[10px] text-th-text-tertiary tabular-nums w-10 text-right">{cat.pct}%</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Coverage Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">
            {weightedCoverage >= 100
              ? 'Weighted pipeline exceeds quota. You\'re in a strong position.'
              : `Weighted coverage is ${weightedCoverage}%. You need ${fmt(gap)} more weighted pipeline to hit quota.`}
          </p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
