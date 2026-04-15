import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, DollarSign, TrendingUp, ArrowUp, ArrowDown, Sparkles, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuotePricingOptimizerModalProps { open: boolean; onClose: () => void; }

const SUGGESTIONS = [
  { quote: 'Q-2024-089 — Acme Corp', current: 12500, suggested: 11200, change: -10.4, reason: 'Price sensitivity detected — 3 rejected quotes at similar values. Reducing 10% increases win probability from 35% to 62%.', winDelta: 27, color: 'from-green-500/10 to-emerald-500/10' },
  { quote: 'Q-2024-091 — BrightCare', current: 24800, suggested: 26500, change: 6.9, reason: 'Account has accepted 2 quotes above $25k. Room to increase margin without impacting close rate.', winDelta: -3, color: 'from-blue-500/10 to-sky-500/10' },
  { quote: 'Q-2024-094 — Wellness Group', current: 9100, suggested: 8500, change: -6.6, reason: 'Competitor quotes for similar coverage average $8.2k. Small reduction positions you competitively.', winDelta: 18, color: 'from-violet-500/10 to-purple-500/10' },
];

export function QuotePricingOptimizerModal({ open, onClose }: QuotePricingOptimizerModalProps) {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const potentialGain = SUGGESTIONS.filter((s) => !applied.has(s.quote)).reduce((sum, s) => sum + (s.winDelta > 0 ? s.suggested : 0), 0);

  return (
    <Modal open={open} onClose={onClose} title="AI Pricing Optimizer" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI analyzed your open quotes against historical win data, competitor pricing, and account behavior.</span></div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{SUGGESTIONS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Suggestions</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">+14%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Win Rate Boost</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(potentialGain)}</p>
            <p className="text-[10px] text-th-text-tertiary">Potential Revenue</p>
          </div>
        </div>

        <div className="space-y-2">
          {SUGGESTIONS.map((s) => (
            <div key={s.quote} className={cn('p-3 rounded-xl border border-th-border/50', applied.has(s.quote) && 'opacity-50')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-th-text-primary flex-1">{s.quote}</span>
                {applied.has(s.quote) && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">APPLIED</span>}
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-center">
                  <p className="text-[9px] text-th-text-tertiary">Current</p>
                  <p className="text-sm font-bold text-th-text-primary tabular-nums">{fmt(s.current)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {s.change < 0 ? <ArrowDown className="w-4 h-4 text-red-400" /> : <ArrowUp className="w-4 h-4 text-green-500" />}
                  <span className={cn('text-xs font-bold', s.change < 0 ? 'text-red-400' : 'text-green-500')}>{s.change > 0 ? '+' : ''}{s.change}%</span>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-th-text-tertiary">Suggested</p>
                  <p className="text-sm font-bold text-th-accent-500 tabular-nums">{fmt(s.suggested)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] text-th-text-tertiary">Win Rate</p>
                  <p className={cn('text-xs font-bold', s.winDelta > 0 ? 'text-green-500' : 'text-red-400')}>{s.winDelta > 0 ? '+' : ''}{s.winDelta}%</p>
                </div>
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-2">{s.reason}</p>
              {!applied.has(s.quote) && (
                <button onClick={() => setApplied((prev) => new Set([...prev, s.quote]))} className="w-full py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20 transition-colors">Apply Suggestion</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
