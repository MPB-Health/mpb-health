import { useState } from 'react';
import { Modal } from '../Modal';
import { Users, Trophy, DollarSign, TrendingUp, Sparkles, Star } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealTeamModalProps { open: boolean; onClose: () => void; }

const MOCK_REPS = [
  { name: 'Julia Smith', avatar: 'JS', deals: 14, won: 8, value: 285000, winRate: 57, pipeline: 186000, color: '#3b82f6' },
  { name: 'Mark Davis', avatar: 'MD', deals: 12, won: 7, value: 242000, winRate: 58, pipeline: 148000, color: '#10b981' },
  { name: 'Sarah Johnson', avatar: 'SJ', deals: 10, won: 5, value: 195000, winRate: 50, pipeline: 124000, color: '#8b5cf6' },
  { name: 'Tom Wilson', avatar: 'TW', deals: 8, won: 6, value: 178000, winRate: 75, pipeline: 92000, color: '#f59e0b' },
];

export function DealTeamModal({ open, onClose }: DealTeamModalProps) {
  const [sort, setSort] = useState<'value' | 'winRate' | 'pipeline'>('value');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const sorted = [...MOCK_REPS].sort((a, b) => sort === 'value' ? b.value - a.value : sort === 'winRate' ? b.winRate - a.winRate : b.pipeline - a.pipeline);
  const totalWon = MOCK_REPS.reduce((s, r) => s + r.value, 0);
  const avgWinRate = Math.round(MOCK_REPS.reduce((s, r) => s + r.winRate, 0) / MOCK_REPS.length);
  const topPerformer = MOCK_REPS.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <Modal open={open} onClose={onClose} title="Team Performance" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalWon)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Won</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{avgWinRate}%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Win Rate</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{topPerformer.name}</p>
            <p className="text-[10px] text-th-text-tertiary">Top Performer</p>
          </div>
        </div>

        <div className="flex gap-1">
          {[{ id: 'value' as const, label: 'By Revenue' }, { id: 'winRate' as const, label: 'By Win Rate' }, { id: 'pipeline' as const, label: 'By Pipeline' }].map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              sort === s.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{s.label}</button>
          ))}
        </div>

        <div className="space-y-2">
          {sorted.map((rep, idx) => (
            <div key={rep.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: rep.color }}>
                    {rep.avatar}
                  </div>
                  {idx === 0 && <Star className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-th-text-primary">{rep.name}</span>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-th-text-tertiary">{rep.deals} deals</span>
                    <span className="text-[10px] text-green-500 font-medium">{rep.won} won</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(rep.value)}</p><p className="text-[8px] text-th-text-tertiary">Won</p></div>
                  <div><p className={cn('text-xs font-bold tabular-nums', rep.winRate >= 60 ? 'text-green-500' : 'text-amber-500')}>{rep.winRate}%</p><p className="text-[8px] text-th-text-tertiary">Win Rate</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(rep.pipeline)}</p><p className="text-[8px] text-th-text-tertiary">Pipeline</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Team Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Tom Wilson</strong> has the highest win rate (75%) despite fewer deals. Consider pairing with other reps for mentorship on closing technique.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
