import { useState } from 'react';
import { Modal } from '../Modal';
import { Star, TrendingUp, TrendingDown, Sparkles, DollarSign } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ScoredDeal { id: string; name: string; amount: number; score: number; trend: 'up' | 'down' | 'stable'; factors: { name: string; impact: number; }[]; }
interface DealScoringModalProps { open: boolean; onClose: () => void; onNavigateToDeal?: (id: string) => void; }

const MOCK: ScoredDeal[] = [
  { id: '1', name: 'Enterprise Health Plan', amount: 85000, score: 92, trend: 'up', factors: [
    { name: 'Decision maker engaged', impact: 25 }, { name: 'Proposal sent', impact: 22 },
    { name: 'Budget confirmed', impact: 20 }, { name: 'Timeline fit', impact: 15 }, { name: 'Champion identified', impact: 10 },
  ]},
  { id: '2', name: 'Group Medicare Package', amount: 62000, score: 78, trend: 'stable', factors: [
    { name: 'Decision maker engaged', impact: 22 }, { name: 'Needs analysis done', impact: 18 },
    { name: 'Budget TBD', impact: -8 }, { name: 'Strong competition', impact: -6 }, { name: 'Timeline fit', impact: 12 },
  ]},
  { id: '3', name: 'Family Coverage Plus', amount: 42000, score: 54, trend: 'down', factors: [
    { name: 'Contact responsive', impact: 15 }, { name: 'No budget', impact: -15 },
    { name: 'Decision delayed', impact: -12 }, { name: 'Competitor in play', impact: -8 }, { name: 'Referral source', impact: 10 },
  ]},
  { id: '4', name: 'Dental Plan Upgrade', amount: 28000, score: 86, trend: 'up', factors: [
    { name: 'Existing customer', impact: 25 }, { name: 'Budget approved', impact: 20 },
    { name: 'Renewal timing', impact: 18 }, { name: 'Simple scope', impact: 12 }, { name: 'Champion active', impact: 11 },
  ]},
];

function scoreColor(s: number) { return s >= 80 ? 'text-green-500 bg-green-500' : s >= 60 ? 'text-blue-500 bg-blue-500' : s >= 40 ? 'text-amber-500 bg-amber-500' : 'text-red-500 bg-red-500'; }

export function DealScoringModal({ open, onClose, onNavigateToDeal }: DealScoringModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const sorted = [...MOCK].sort((a, b) => b.score - a.score);
  const avg = Math.round(MOCK.reduce((s, d) => s + d.score, 0) / MOCK.length);

  return (
    <Modal open={open} onClose={onClose} title="Deal Win Probability" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Star className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{avg}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK.filter((d) => d.score >= 70).length}</p>
            <p className="text-[10px] text-th-text-tertiary">Likely to Win</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK.filter((d) => d.trend === 'down').length}</p>
            <p className="text-[10px] text-th-text-tertiary">Declining</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-1.5">
          {sorted.map((deal) => {
            const colors = scoreColor(deal.score);
            const isExpanded = expandedId === deal.id;
            return (
              <div key={deal.id} className="rounded-xl border border-th-border/50 overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : deal.id)}
                  className="w-full text-left p-3 flex items-center gap-3 hover:bg-surface-secondary/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm', colors.split(' ')[1])}>
                    {deal.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary truncate">{deal.name}</span>
                      {deal.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {deal.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    </div>
                    <span className="text-[10px] text-th-text-tertiary tabular-nums">{fmt(deal.amount)}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onNavigateToDeal?.(deal.id); }}
                    className="text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium shrink-0">View</button>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-th-border/30 bg-surface-secondary/20">
                    <div className="space-y-1 mt-2">
                      {deal.factors.map((f) => (
                        <div key={f.name} className="flex items-center gap-2">
                          <span className="text-[10px] text-th-text-secondary flex-1">{f.name}</span>
                          <span className={cn('text-[10px] font-bold tabular-nums', f.impact >= 0 ? 'text-green-500' : 'text-red-500')}>
                            {f.impact >= 0 ? '+' : ''}{f.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
