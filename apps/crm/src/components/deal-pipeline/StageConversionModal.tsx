import { Modal } from '../Modal';
import { ArrowRight, TrendingUp, TrendingDown, Sparkles, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageConversionModalProps { open: boolean; onClose: () => void; }

const MOCK = [
  { from: 'Qualification', to: 'Needs Analysis', entered: 42, passed: 34, rate: 81, avgDays: 3.2 },
  { from: 'Needs Analysis', to: 'Value Proposition', entered: 34, passed: 26, rate: 76, avgDays: 5.8 },
  { from: 'Value Proposition', to: 'Decision Makers', entered: 26, passed: 18, rate: 69, avgDays: 7.4 },
  { from: 'Decision Makers', to: 'Proposal', entered: 18, passed: 14, rate: 78, avgDays: 4.1 },
  { from: 'Proposal', to: 'Negotiation', entered: 14, passed: 9, rate: 64, avgDays: 9.6 },
  { from: 'Negotiation', to: 'Won', entered: 9, passed: 6, rate: 67, avgDays: 6.2 },
];

export function StageConversionModal({ open, onClose }: StageConversionModalProps) {
  const overallConversion = MOCK.length > 0 ? ((MOCK[MOCK.length - 1].passed / MOCK[0].entered) * 100).toFixed(1) : '0';
  const worstStep = MOCK.reduce((a, b) => a.rate < b.rate ? a : b);

  return (
    <Modal open={open} onClose={onClose} title="Stage Conversion Rates" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{overallConversion}%</p>
            <p className="text-[10px] text-th-text-tertiary">Overall Conversion</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{worstStep.from} → {worstStep.to}</p>
            <p className="text-[10px] text-th-text-tertiary">Biggest Drop ({worstStep.rate}%)</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK.reduce((s, m) => s + m.avgDays, 0).toFixed(0)}d</p>
            <p className="text-[10px] text-th-text-tertiary">Total Avg Cycle</p>
          </div>
        </div>

        <div className="space-y-0">
          {MOCK.map((step, idx) => {
            const dropOff = step.entered - step.passed;
            return (
              <div key={idx}>
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-th-text-primary">{step.from}</span>
                      <ArrowRight className="w-3 h-3 text-th-text-tertiary" />
                      <span className="text-xs font-medium text-th-text-primary">{step.to}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mt-1.5">
                      <div className={cn('h-full rounded-full', step.rate >= 75 ? 'bg-green-500' : step.rate >= 65 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${step.rate}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center shrink-0">
                    <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{step.entered}</p><p className="text-[7px] text-th-text-tertiary">In</p></div>
                    <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{step.passed}</p><p className="text-[7px] text-th-text-tertiary">Passed</p></div>
                    <div><p className="text-[10px] font-bold text-red-500 tabular-nums">{dropOff}</p><p className="text-[7px] text-th-text-tertiary">Lost</p></div>
                    <div><p className={cn('text-[10px] font-bold tabular-nums', step.rate >= 75 ? 'text-green-500' : step.rate >= 65 ? 'text-amber-500' : 'text-red-500')}>{step.rate}%</p><p className="text-[7px] text-th-text-tertiary">Rate</p></div>
                  </div>
                </div>
                {idx < MOCK.length - 1 && <div className="flex justify-center py-0.5"><ArrowRight className="w-3 h-3 text-th-text-tertiary rotate-90" /></div>}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Conversion Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">The <strong>{worstStep.from} → {worstStep.to}</strong> transition has the lowest conversion at {worstStep.rate}%. Improving this by 10% would add ~{Math.round(worstStep.entered * 0.1)} more deals to later stages.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
