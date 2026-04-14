import { useState } from 'react';
import { Modal } from '../Modal';
import { Target, DollarSign, TrendingUp, Sparkles, Save, RotateCcw } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageProb { name: string; color: string; probability: number; leads: number; avgValue: number; }
interface StageProbabilityModalProps { open: boolean; onClose: () => void; }

const DEFAULT_STAGES: StageProb[] = [
  { name: 'New', color: '#3b82f6', probability: 10, leads: 98, avgValue: 1200 },
  { name: 'Contacted', color: '#8b5cf6', probability: 25, leads: 64, avgValue: 1400 },
  { name: 'Qualified', color: '#f59e0b', probability: 50, leads: 42, avgValue: 1800 },
  { name: 'Proposal', color: '#ef4444', probability: 70, leads: 28, avgValue: 2200 },
  { name: 'Negotiation', color: '#10b981', probability: 85, leads: 18, avgValue: 2600 },
  { name: 'Won', color: '#22c55e', probability: 100, leads: 14, avgValue: 2400 },
];

function currencyFmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
}

export function StageProbabilityModal({ open, onClose }: StageProbabilityModalProps) {
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [modified, setModified] = useState(false);

  const totalWeighted = stages.reduce((s, st) => s + (st.leads * st.avgValue * (st.probability / 100)), 0);
  const totalUnweighted = stages.reduce((s, st) => s + (st.leads * st.avgValue), 0);

  const updateProb = (idx: number, val: number) => {
    setStages((prev) => prev.map((s, i) => i === idx ? { ...s, probability: Math.min(100, Math.max(0, val)) } : s));
    setModified(true);
  };

  const reset = () => { setStages(DEFAULT_STAGES); setModified(false); };

  return (
    <Modal open={open} onClose={onClose} title="Stage Win Probability" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30">
            <DollarSign className="w-4 h-4 text-green-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(totalWeighted)}</p>
            <p className="text-[10px] text-th-text-tertiary">Weighted Pipeline Value</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30">
            <Target className="w-4 h-4 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(totalUnweighted)}</p>
            <p className="text-[10px] text-th-text-tertiary">Unweighted Pipeline Value</p>
          </div>
        </div>

        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const stageValue = stage.leads * stage.avgValue;
            const weightedValue = stageValue * (stage.probability / 100);
            return (
              <div key={stage.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-th-text-primary">{stage.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-th-text-tertiary">{stage.leads} leads</span>
                        <span className="text-[10px] text-th-text-tertiary">Avg {currencyFmt(stage.avgValue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={stage.probability}
                        onChange={(e) => updateProb(idx, Number(e.target.value))}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: stage.color }} />
                      <div className="flex items-center gap-1 w-16">
                        <input type="number" min={0} max={100} value={stage.probability}
                          onChange={(e) => updateProb(idx, Number(e.target.value))}
                          className="w-10 text-xs font-bold text-center rounded border border-th-border/50 bg-surface-primary py-0.5 focus:outline-none tabular-nums" />
                        <span className="text-xs text-th-text-tertiary">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-surface-tertiary overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${stage.probability}%`, backgroundColor: stage.color }} />
                      </div>
                      <span className="text-xs font-bold text-green-500 ml-3 tabular-nums">{currencyFmt(weightedValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Recommendation</span>
          </div>
          <p className="text-xs text-th-text-secondary">Based on historical win rates, your <strong>Qualified</strong> probability should be ~43% (currently 50%). Adjusting would give a more accurate forecast by {currencyFmt(42 * 1800 * 0.07)}.</p>
        </div>

        <div className="flex gap-2 pt-1">
          {modified && (
            <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save Probabilities
          </button>
        </div>
      </div>
    </Modal>
  );
}
