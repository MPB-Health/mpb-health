import { useState } from 'react';
import { Modal } from '../Modal';
import { Clock, AlertTriangle, DollarSign, Sparkles, ExternalLink } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealAgingModalProps { open: boolean; onClose: () => void; onNavigateToDeal?: (id: string) => void; }

const MOCK_AGING = [
  { id: 'a1', name: 'Enterprise Health Plan', stage: 'Proposal', amount: 85000, daysOpen: 52, lastActivity: '14 days ago', risk: 'high' as const },
  { id: 'a2', name: 'Family Coverage Plus', stage: 'Negotiation', amount: 42000, daysOpen: 48, lastActivity: '22 days ago', risk: 'critical' as const },
  { id: 'a3', name: 'Corporate Wellness Pkg', stage: 'Needs Analysis', amount: 34000, daysOpen: 38, lastActivity: '8 days ago', risk: 'medium' as const },
  { id: 'a4', name: 'Senior Care Bundle', stage: 'Value Proposition', amount: 28000, daysOpen: 35, lastActivity: '12 days ago', risk: 'medium' as const },
  { id: 'a5', name: 'Dental Expansion', stage: 'Qualification', amount: 18000, daysOpen: 30, lastActivity: '5 days ago', risk: 'low' as const },
];

const MOCK_BUCKETS = [
  { range: '0-15 days', count: 22, value: 480000, color: '#22c55e' },
  { range: '16-30 days', count: 14, value: 320000, color: '#3b82f6' },
  { range: '31-45 days', count: 8, value: 186000, color: '#f59e0b' },
  { range: '46-60 days', count: 4, value: 127000, color: '#ef4444' },
  { range: '60+ days', count: 2, value: 62000, color: '#dc2626' },
];

const riskColors = { low: 'bg-green-500/10 text-green-500', medium: 'bg-amber-500/10 text-amber-500', high: 'bg-red-500/10 text-red-500', critical: 'bg-red-600/10 text-red-600' };

export function DealAgingModal({ open, onClose, onNavigateToDeal }: DealAgingModalProps) {
  const [tab, setTab] = useState<'deals' | 'buckets'>('deals');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalAtRisk = MOCK_AGING.filter((d) => d.risk === 'high' || d.risk === 'critical');
  const atRiskValue = totalAtRisk.reduce((s, d) => s + d.amount, 0);
  const maxBucket = Math.max(...MOCK_BUCKETS.map((b) => b.count), 1);

  return (
    <Modal open={open} onClose={onClose} title="Deal Aging Report" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_AGING.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Aging Deals</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalAtRisk.length}</p>
            <p className="text-[10px] text-th-text-tertiary">High/Critical Risk</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(atRiskValue)}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk Value</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'deals' as const, label: 'Aging Deals' }, { id: 'buckets' as const, label: 'Age Distribution' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'deals' && (
          <div className="max-h-[280px] overflow-y-auto space-y-1.5">
            {MOCK_AGING.map((deal) => (
              <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', riskColors[deal.risk].split(' ')[0])}>
                  <AlertTriangle className={cn('w-3.5 h-3.5', riskColors[deal.risk].split(' ')[1])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-th-text-primary truncate">{deal.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize', riskColors[deal.risk])}>{deal.risk}</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary">{deal.stage} • {deal.daysOpen}d open • Last activity: {deal.lastActivity}</p>
                </div>
                <span className="text-xs font-bold text-th-text-primary tabular-nums shrink-0">{fmt(deal.amount)}</span>
                <button onClick={() => onNavigateToDeal?.(deal.id)} className="text-th-text-tertiary hover:text-th-accent-500 shrink-0">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'buckets' && (
          <div className="space-y-2">
            {MOCK_BUCKETS.map((bucket) => (
              <div key={bucket.range} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                <span className="text-[11px] font-medium text-th-text-secondary w-20">{bucket.range}</span>
                <div className="flex-1 h-5 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded flex items-center px-2" style={{ width: `${(bucket.count / maxBucket) * 100}%`, backgroundColor: bucket.color + '40' }}>
                    <span className="text-[9px] font-bold text-th-text-primary">{bucket.count} deals</span>
                  </div>
                </div>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-16 text-right">{fmt(bucket.value)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Aging Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Family Coverage Plus</strong> has had no activity for 22 days in Negotiation. Immediate follow-up recommended to prevent deal loss.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
