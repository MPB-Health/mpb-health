import { Modal } from '../Modal';
import { Brain, Target, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteWinProbabilityModalProps { open: boolean; onClose: () => void; }

const SCORED_QUOTES = [
  { name: 'Q-2024-091 — BrightCare', value: 24800, probability: 82, trend: 'up' as const, factors: ['Strong account history', 'Competitive pricing', 'Decision-maker engaged'], risks: ['Long sales cycle'] },
  { name: 'Q-2024-094 — Wellness Group', value: 9100, probability: 68, trend: 'stable' as const, factors: ['Budget confirmed', 'Multiple contacts engaged'], risks: ['Competitor proposal pending', 'First-time buyer'] },
  { name: 'Q-2024-089 — Acme Corp', value: 12500, probability: 45, trend: 'down' as const, factors: ['Existing relationship'], risks: ['No response in 14 days', 'Budget cut rumored', 'Champion left company'] },
  { name: 'Q-2024-098 — FitLife Partners', value: 6200, probability: 72, trend: 'up' as const, factors: ['Referred lead', 'Fast response time'], risks: ['Small budget'] },
  { name: 'Q-2024-076 — TechStart LLC', value: 8400, probability: 35, trend: 'down' as const, factors: ['Initial interest shown'], risks: ['Gone silent', 'Competitor selected', 'Budget freeze'] },
];

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export function QuoteWinProbabilityModal({ open, onClose }: QuoteWinProbabilityModalProps) {
  const avgProb = Math.round(SCORED_QUOTES.reduce((s, q) => s + q.probability, 0) / SCORED_QUOTES.length);
  const weightedValue = SCORED_QUOTES.reduce((s, q) => s + q.value * (q.probability / 100), 0);

  return (
    <Modal open={open} onClose={onClose} title="AI Win Probability" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Brain className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{avgProb}%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Win Prob</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(weightedValue)}</p>
            <p className="text-[10px] text-th-text-tertiary">Weighted Value</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{SCORED_QUOTES.filter((q) => q.probability < 50).length}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk</p>
          </div>
        </div>

        <div className="space-y-2">
          {SCORED_QUOTES.sort((a, b) => b.probability - a.probability).map((q) => (
            <div key={q.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', q.probability >= 70 ? 'bg-green-500' : q.probability >= 50 ? 'bg-amber-500' : 'bg-red-500')}>{q.probability}%</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary truncate">{q.name}</p>
                  <p className="text-[9px] text-th-text-tertiary tabular-nums">{fmt(q.value)} • Weighted: {fmt(q.value * q.probability / 100)}</p>
                </div>
                {q.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-500 shrink-0" /> : q.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400 shrink-0" /> : null}
              </div>
              <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-2">
                <div className={cn('h-full rounded-full transition-all', q.probability >= 70 ? 'bg-green-500/60' : q.probability >= 50 ? 'bg-amber-500/60' : 'bg-red-500/60')} style={{ width: `${q.probability}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] font-semibold text-green-500 mb-0.5">WIN FACTORS</p>
                  {q.factors.map((f) => <p key={f} className="text-[9px] text-th-text-tertiary">+ {f}</p>)}
                </div>
                <div>
                  <p className="text-[8px] font-semibold text-red-400 mb-0.5">RISK FACTORS</p>
                  {q.risks.map((r) => <p key={r} className="text-[9px] text-th-text-tertiary">- {r}</p>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Win Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>TechStart LLC</strong> and <strong>Acme Corp</strong> are trending down. Consider a direct outreach call to Acme (45% → potential 60% with engagement) before it expires in 2 days.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
