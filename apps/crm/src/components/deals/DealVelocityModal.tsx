import { useState } from 'react';
import { Modal } from '../Modal';
import { Clock, AlertTriangle, TrendingUp, Target, Sparkles, ArrowRight } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealVelocityModalProps { open: boolean; onClose: () => void; onNavigateToDeal?: (id: string) => void; }

const MOCK_STAGES = [
  { name: 'Qualification', avgDays: 3.2, deals: 18, converted: 14, convRate: 78, color: '#3b82f6' },
  { name: 'Needs Analysis', avgDays: 5.8, deals: 14, converted: 11, convRate: 79, color: '#8b5cf6' },
  { name: 'Value Proposition', avgDays: 7.4, deals: 11, converted: 8, convRate: 73, color: '#f59e0b' },
  { name: 'Decision Makers', avgDays: 4.1, deals: 8, converted: 6, convRate: 75, color: '#10b981' },
  { name: 'Proposal', avgDays: 9.6, deals: 6, converted: 4, convRate: 67, color: '#ef4444' },
  { name: 'Negotiation', avgDays: 6.2, deals: 4, converted: 3, convRate: 75, color: '#06b6d4' },
];

const MOCK_STUCK = [
  { id: 's1', name: 'Enterprise Health Plan', stage: 'Proposal', daysInStage: 22, amount: 85000 },
  { id: 's2', name: 'Family Coverage Plus', stage: 'Negotiation', daysInStage: 18, amount: 42000 },
  { id: 's3', name: 'Group Medicare Pkg', stage: 'Value Proposition', daysInStage: 15, amount: 62000 },
];

export function DealVelocityModal({ open, onClose, onNavigateToDeal }: DealVelocityModalProps) {
  const [tab, setTab] = useState<'velocity' | 'stuck'>('velocity');
  const totalAvgDays = MOCK_STAGES.reduce((s, st) => s + st.avgDays, 0);
  const maxDays = Math.max(...MOCK_STAGES.map((s) => s.avgDays), 1);
  const bottleneck = MOCK_STAGES.reduce((a, b) => a.avgDays > b.avgDays ? a : b);

  return (
    <Modal open={open} onClose={onClose} title="Deal Velocity" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalAvgDays.toFixed(0)}d</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Full Cycle</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{bottleneck.name}</p>
            <p className="text-[10px] text-th-text-tertiary">Bottleneck ({bottleneck.avgDays}d)</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STUCK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Stuck Deals</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'velocity' as const, label: 'Stage Velocity' }, { id: 'stuck' as const, label: `Stuck Deals (${MOCK_STUCK.length})` }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'velocity' && (
          <div className="space-y-0">
            {MOCK_STAGES.map((stage, idx) => (
              <div key={stage.name}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 py-1 px-4">
                    <ArrowRight className="w-3 h-3 text-th-text-tertiary rotate-90" />
                    <span className="text-[10px] text-green-500 font-medium">{stage.convRate}% pass</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-2">
                  <span className="text-xs font-medium text-th-text-secondary w-28 text-right truncate">{stage.name}</span>
                  <div className="flex-1 relative">
                    <div className="h-7 rounded-lg overflow-hidden flex items-center" style={{ width: `${Math.max((stage.avgDays / maxDays) * 100, 12)}%`, backgroundColor: stage.color + '25' }}>
                      <div className="h-full rounded-lg flex items-center px-2.5" style={{ width: '100%', backgroundColor: stage.color + '40' }}>
                        <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{stage.avgDays}d</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary tabular-nums w-12">{stage.deals} deals</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'stuck' && (
          <div className="space-y-1.5">
            {MOCK_STUCK.map((deal) => {
              const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
              return (
                <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-th-text-primary">{deal.name}</p>
                    <p className="text-[10px] text-th-text-tertiary">{deal.stage} • <span className="text-red-500 font-medium">{deal.daysInStage} days</span></p>
                  </div>
                  <span className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(deal.amount)}</span>
                  <button onClick={() => onNavigateToDeal?.(deal.id)} className="text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium">View</button>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Velocity Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Proposal</strong> stage is the biggest bottleneck at {bottleneck.avgDays} days. Focus on streamlining proposal creation to reduce overall cycle time.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
