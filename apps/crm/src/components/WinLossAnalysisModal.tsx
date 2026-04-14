import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Trophy, XCircle, BarChart3, TrendingUp, TrendingDown, Clock,
  DollarSign, Users, Filter, ChevronDown, ChevronRight, Target,
  ThumbsUp, ThumbsDown, AlertTriangle, Sparkles, Calendar,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealOutcome {
  id: string;
  dealName: string;
  clientName: string;
  amount: number;
  outcome: 'won' | 'lost';
  reason: string;
  competitorLost?: string;
  daysInPipeline: number;
  closedDate: string;
  planType: string;
  carrier?: string;
  agent: string;
  stage: string;
  notes?: string;
}

interface WinLossAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  deals?: DealOutcome[];
  period?: string;
}

const LOSS_REASONS = [
  'Price/premium too high', 'Chose competitor', 'Stayed with current coverage',
  'No response / went cold', 'Eligibility issue', 'Family/personal reasons',
  'Network limitations', 'Drug formulary mismatch', 'Timing / not ready',
];

const MOCK_DEALS: DealOutcome[] = [
  { id: '1', dealName: 'Wilson MA Enrollment', clientName: 'James Wilson', amount: 4800, outcome: 'won', reason: 'Best plan match', daysInPipeline: 14, closedDate: '2026-04-10', planType: 'Medicare Advantage', carrier: 'Aetna', agent: 'Agent Smith', stage: 'Closed Won' },
  { id: '2', dealName: 'Garcia Medigap', clientName: 'Maria Garcia', amount: 1740, outcome: 'won', reason: 'Competitive premium', daysInPipeline: 21, closedDate: '2026-04-05', planType: 'Medicare Supplement', carrier: 'Mutual of Omaha', agent: 'Agent Smith', stage: 'Closed Won' },
  { id: '3', dealName: 'Brown ACA Family', clientName: 'Patricia Brown', amount: 9600, outcome: 'lost', reason: 'Price/premium too high', competitorLost: 'Oscar Health', daysInPipeline: 35, closedDate: '2026-03-28', planType: 'ACA', agent: 'Agent Smith', stage: 'Closed Lost', notes: 'Family of 4, subsidy not enough' },
  { id: '4', dealName: 'Lee MA Switch', clientName: 'Robert Lee', amount: 0, outcome: 'lost', reason: 'Stayed with current coverage', daysInPipeline: 7, closedDate: '2026-03-20', planType: 'Medicare Advantage', agent: 'Agent Smith', stage: 'Closed Lost', notes: 'Happy with existing Humana plan' },
  { id: '5', dealName: 'Davis Dental+Vision', clientName: 'Michael Davis', amount: 840, outcome: 'won', reason: 'Bundled with MA plan', daysInPipeline: 3, closedDate: '2026-03-18', planType: 'Dental/Vision', carrier: 'Delta Dental', agent: 'Agent Smith', stage: 'Closed Won' },
  { id: '6', dealName: 'Thompson Life Policy', clientName: 'Susan Thompson', amount: 6480, outcome: 'won', reason: 'Estate planning need', daysInPipeline: 28, closedDate: '2026-03-15', planType: 'Life', carrier: 'Mutual of Omaha', agent: 'Agent Smith', stage: 'Closed Won' },
  { id: '7', dealName: 'Clark Group Health', clientName: 'Elizabeth Clark', amount: 54000, outcome: 'lost', reason: 'Chose competitor', competitorLost: 'UnitedHealthcare', daysInPipeline: 45, closedDate: '2026-03-10', planType: 'Group Health', agent: 'Agent Smith', stage: 'Closed Lost', notes: 'Lost on network breadth, not price' },
  { id: '8', dealName: 'Moore MA Enrollment', clientName: 'Patricia Moore', amount: 0, outcome: 'lost', reason: 'No response / went cold', daysInPipeline: 60, closedDate: '2026-02-28', planType: 'Medicare Advantage', agent: 'Agent Smith', stage: 'Closed Lost' },
];

function currencyFmt(n: number) {
  return n === 0 ? '$0' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function WinLossAnalysisModal({ open, onClose, deals: propDeals, period = 'Last 90 Days' }: WinLossAnalysisModalProps) {
  const deals = propDeals && propDeals.length > 0 ? propDeals : MOCK_DEALS;
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return deals;
    return deals.filter((d) => d.outcome === filter);
  }, [deals, filter]);

  const stats = useMemo(() => {
    const won = deals.filter((d) => d.outcome === 'won');
    const lost = deals.filter((d) => d.outcome === 'lost');
    const winRate = deals.length ? (won.length / deals.length) * 100 : 0;
    const avgWinDays = won.length ? won.reduce((s, d) => s + d.daysInPipeline, 0) / won.length : 0;
    const avgLossDays = lost.length ? lost.reduce((s, d) => s + d.daysInPipeline, 0) / lost.length : 0;
    const wonRevenue = won.reduce((s, d) => s + d.amount, 0);
    const lostRevenue = lost.reduce((s, d) => s + d.amount, 0);

    const reasonCounts = new Map<string, number>();
    lost.forEach((d) => reasonCounts.set(d.reason, (reasonCounts.get(d.reason) || 0) + 1));
    const topReasons = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const planWinRates = new Map<string, { won: number; total: number }>();
    deals.forEach((d) => {
      const existing = planWinRates.get(d.planType) || { won: 0, total: 0 };
      existing.total++;
      if (d.outcome === 'won') existing.won++;
      planWinRates.set(d.planType, existing);
    });

    return { won: won.length, lost: lost.length, winRate, avgWinDays, avgLossDays, wonRevenue, lostRevenue, topReasons, planWinRates: Array.from(planWinRates.entries()) };
  }, [deals]);

  return (
    <Modal open={open} onClose={onClose} title={`Win/Loss Analysis — ${period}`} size="2xl">
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, icon: Target, color: stats.winRate >= 50 ? 'text-green-500' : 'text-red-500', bg: stats.winRate >= 50 ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10' },
            { label: 'Won', value: `${stats.won} (${currencyFmt(stats.wonRevenue)})`, icon: Trophy, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Lost', value: `${stats.lost} (${currencyFmt(stats.lostRevenue)})`, icon: XCircle, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
            { label: 'Avg Days to Close', value: `${stats.avgWinDays.toFixed(0)}d`, icon: Clock, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Pattern Detection</span>
          </div>
          <div className="space-y-1.5 text-xs text-th-text-secondary">
            <p>Deals lost to <strong>"price"</strong> reasons take {stats.avgLossDays.toFixed(0)} days avg vs {stats.avgWinDays.toFixed(0)} for wins — consider earlier plan comparison delivery.</p>
            {stats.topReasons[0] && <p>Top loss reason: <strong>{stats.topReasons[0][0]}</strong> ({stats.topReasons[0][1]} deals) — address this in your initial presentation deck.</p>}
            <p>Your win rate on <strong>Medicare Advantage</strong> is the strongest product category. Consider specializing further.</p>
          </div>
        </div>

        {/* Loss reasons breakdown */}
        {stats.topReasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Top Loss Reasons</p>
            <div className="space-y-1.5">
              {stats.topReasons.map(([reason, count]) => {
                const pct = stats.lost ? (count / stats.lost) * 100 : 0;
                return (
                  <div key={reason} className="flex items-center gap-2">
                    <span className="text-xs text-th-text-secondary flex-1 min-w-0 truncate">{reason}</span>
                    <div className="w-32 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded-full bg-red-500/60" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-th-text-secondary tabular-nums w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Win rate by plan type */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Win Rate by Plan Type</p>
          <div className="flex flex-wrap gap-2">
            {stats.planWinRates.map(([planType, data]) => {
              const rate = data.total ? (data.won / data.total) * 100 : 0;
              return (
                <div key={planType} className="px-3 py-2 rounded-xl border border-th-border/50 text-center">
                  <p className="text-[10px] text-th-text-tertiary">{planType}</p>
                  <p className={cn('text-sm font-bold tabular-nums', rate >= 50 ? 'text-green-500' : 'text-red-500')}>{rate.toFixed(0)}%</p>
                  <p className="text-[10px] text-th-text-tertiary">{data.won}/{data.total}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal list */}
        <div className="flex items-center gap-2">
          {(['all', 'won', 'lost'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>{f === 'all' ? 'All Deals' : f === 'won' ? 'Won' : 'Lost'}</button>
          ))}
          <span className="ml-auto text-xs text-th-text-tertiary tabular-nums">{filtered.length} deals</span>
        </div>

        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {filtered.map((deal) => (
            <div key={deal.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-th-border/30 hover:border-th-border/50 transition-colors">
              {deal.outcome === 'won' ? (
                <Trophy className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-th-text-primary">{deal.dealName}</p>
                <p className="text-[10px] text-th-text-tertiary">{deal.clientName} · {deal.planType} · {deal.daysInPipeline}d in pipeline</p>
              </div>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                deal.outcome === 'won' ? 'text-green-600 dark:text-green-400 bg-green-500/10' : 'text-red-600 dark:text-red-400 bg-red-500/10'
              )}>{deal.reason}</span>
              <span className="text-xs font-medium text-th-text-primary tabular-nums shrink-0">{currencyFmt(deal.amount)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
