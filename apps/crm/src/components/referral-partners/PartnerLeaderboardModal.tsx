import { useState } from 'react';
import { Modal } from '../Modal';
import { Trophy, Medal, Star, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const LEADERBOARD = [
  { rank: 1, name: 'Jane Roberts', type: 'CPA', referrals: 42, conversions: 18, revenue: 28800, streak: 6, trend: 'up' as const },
  { rank: 2, name: 'Tom Chen', type: 'Financial Advisor', referrals: 36, conversions: 14, revenue: 22400, streak: 4, trend: 'up' as const },
  { rank: 3, name: 'Sarah Kim', type: 'HR Consultant', referrals: 28, conversions: 12, revenue: 19200, streak: 3, trend: 'stable' as const },
  { rank: 4, name: 'ADP Payroll', type: 'Payroll', referrals: 18, conversions: 10, revenue: 16000, streak: 5, trend: 'up' as const },
  { rank: 5, name: 'Mike Johnson', type: 'Attorney', referrals: 22, conversions: 8, revenue: 12800, streak: 2, trend: 'down' as const },
  { rank: 6, name: 'Lisa Park', type: 'CPA', referrals: 15, conversions: 6, revenue: 9600, streak: 1, trend: 'up' as const },
  { rank: 7, name: 'David Lee', type: 'Financial Advisor', referrals: 12, conversions: 5, revenue: 8000, streak: 0, trend: 'down' as const },
];

const rankIcons = [Trophy, Medal, Star];
const rankColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];

export function PartnerLeaderboardModal({ open, onClose }: Props) {
  const [sort, setSort] = useState<'referrals' | 'conversions' | 'revenue'>('revenue');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const sorted = [...LEADERBOARD].sort((a, b) => (b as any)[sort] - (a as any)[sort]);

  return (
    <Modal open={open} onClose={onClose} title="Partner Leaderboard" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-th-text-tertiary">Rank by:</span>
          {(['revenue', 'referrals', 'conversions'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', sort === s ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{s}</button>
          ))}
        </div>
        <div className="space-y-1.5">
          {sorted.map((p, i) => {
            const RankIcon = i < 3 ? rankIcons[i] : null;
            return (
              <div key={p.name} className={cn('flex items-center gap-3 p-2.5 rounded-xl border', i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-th-border/50')}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {RankIcon ? <RankIcon className={cn('w-5 h-5', rankColors[i])} /> : <span className="text-sm font-bold text-th-text-tertiary">#{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary">{p.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">{p.type}{p.streak > 0 ? ` • ${p.streak}mo streak` : ''}</p>
                </div>
                {p.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : p.trend === 'down' ? <TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180 shrink-0" /> : null}
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{p.referrals}</p><p className="text-[7px] text-th-text-tertiary">Refs</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{p.conversions}</p><p className="text-[7px] text-th-text-tertiary">Conv</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(p.revenue)}</p><p className="text-[7px] text-th-text-tertiary">Rev</p></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Leaderboard Tip</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Jane Roberts</strong> leads with a 6-month streak. Consider a bonus incentive to keep top performers engaged.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
