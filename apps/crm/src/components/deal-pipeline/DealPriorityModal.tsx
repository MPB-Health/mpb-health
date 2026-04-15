import { Modal } from '../Modal';
import { Sparkles, DollarSign, Clock, Star, ExternalLink, TrendingUp } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealPriorityModalProps { open: boolean; onClose: () => void; onNavigateToDeal?: (id: string) => void; }

const MOCK = [
  { id: 'p1', rank: 1, name: 'Enterprise Health Plan', amount: 85000, probability: 82, daysToClose: 8, urgency: 'critical' as const, reason: 'High value + closing soon + strong signals' },
  { id: 'p2', name: 'Dental Plan Upgrade', rank: 2, amount: 28000, probability: 86, daysToClose: 5, urgency: 'critical' as const, reason: 'Highest probability + closing this week' },
  { id: 'p3', name: 'Group Medicare Package', rank: 3, amount: 62000, probability: 65, daysToClose: 14, urgency: 'high' as const, reason: 'Large deal + needs nudge to close' },
  { id: 'p4', name: 'Family Coverage Plus', rank: 4, amount: 42000, probability: 54, daysToClose: 22, urgency: 'medium' as const, reason: 'At risk — declining engagement' },
  { id: 'p5', name: 'Corporate Wellness Pkg', rank: 5, amount: 34000, probability: 48, daysToClose: 30, urgency: 'low' as const, reason: 'Early stage — nurture needed' },
];

const urgencyColors = { critical: 'bg-red-500/10 text-red-500', high: 'bg-orange-500/10 text-orange-500', medium: 'bg-amber-500/10 text-amber-500', low: 'bg-blue-500/10 text-blue-500' };

export function DealPriorityModal({ open, onClose, onNavigateToDeal }: DealPriorityModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalValue = MOCK.reduce((s, d) => s + d.amount, 0);
  const criticalCount = MOCK.filter((d) => d.urgency === 'critical').length;

  return (
    <Modal open={open} onClose={onClose} title="AI Deal Priority" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Sparkles className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Ranked Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <Star className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{criticalCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Critical Priority</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalValue)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Value</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {MOCK.map((deal) => (
            <div key={deal.id} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-th-accent-500/10 flex items-center justify-center text-th-accent-500 font-black text-sm shrink-0">
                  #{deal.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-th-text-primary truncate">{deal.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize', urgencyColors[deal.urgency])}>{deal.urgency}</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary mt-0.5">{deal.reason}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(deal.amount)}</p><p className="text-[7px] text-th-text-tertiary">Value</p></div>
                  <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{deal.probability}%</p><p className="text-[7px] text-th-text-tertiary">Prob</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{deal.daysToClose}d</p><p className="text-[7px] text-th-text-tertiary">Close</p></div>
                </div>
                <button onClick={() => onNavigateToDeal?.(deal.id)} className="text-th-text-tertiary hover:text-th-accent-500 shrink-0">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Priority Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Focus today on <strong>Dental Plan Upgrade</strong> — highest probability (86%) closing in 5 days. Then attend to <strong>Enterprise Health Plan</strong> worth {fmt(85000)}.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
