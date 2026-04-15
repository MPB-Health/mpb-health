import { Modal } from '../Modal';
import { Clock, AlertTriangle, DollarSign, Sparkles, ExternalLink } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StaleDealsModalProps { open: boolean; onClose: () => void; onNavigateToDeal?: (id: string) => void; }

const MOCK = [
  { id: 's1', name: 'Enterprise Health Plan', stage: 'Proposal', amount: 85000, daysStale: 22, lastTouch: 'Email sent 22d ago' },
  { id: 's2', name: 'Family Coverage Plus', stage: 'Negotiation', amount: 42000, daysStale: 18, lastTouch: 'Call 18d ago' },
  { id: 's3', name: 'Corporate Wellness', stage: 'Needs Analysis', amount: 34000, daysStale: 15, lastTouch: 'Meeting 15d ago' },
  { id: 's4', name: 'Senior Care Bundle', stage: 'Value Proposition', amount: 28000, daysStale: 12, lastTouch: 'Email 12d ago' },
  { id: 's5', name: 'Dental Expansion', stage: 'Qualification', amount: 18000, daysStale: 10, lastTouch: 'Call 10d ago' },
];

export function StaleDealsModal({ open, onClose, onNavigateToDeal }: StaleDealsModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalValue = MOCK.reduce((s, d) => s + d.amount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Stale Deals" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Stale Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalValue)}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk Value</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK[0]?.daysStale}d</p>
            <p className="text-[10px] text-th-text-tertiary">Most Stale</p>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
          {MOCK.map((deal) => (
            <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                deal.daysStale >= 20 ? 'bg-red-500/10' : deal.daysStale >= 14 ? 'bg-amber-500/10' : 'bg-orange-500/10')}>
                <Clock className={cn('w-3.5 h-3.5', deal.daysStale >= 20 ? 'text-red-500' : deal.daysStale >= 14 ? 'text-amber-500' : 'text-orange-500')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-th-text-primary truncate">{deal.name}</p>
                <p className="text-[10px] text-th-text-tertiary">{deal.stage} • {deal.lastTouch}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(deal.amount)}</p>
                <p className="text-[10px] text-red-500 font-medium">{deal.daysStale}d stale</p>
              </div>
              <button onClick={() => onNavigateToDeal?.(deal.id)} className="text-th-text-tertiary hover:text-th-accent-500 shrink-0">
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Stale Deal Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">{fmt(totalValue)} is at risk across {MOCK.length} stale deals. <strong>Enterprise Health Plan</strong> needs immediate attention — 22 days without activity.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
