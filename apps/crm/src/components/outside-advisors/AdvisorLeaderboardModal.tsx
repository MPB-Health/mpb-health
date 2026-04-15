import { useState } from 'react';
import { Modal } from '../Modal';
import { Trophy, Medal, Star, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const LEADERBOARD = [
  { rank: 1, name: 'Maria Santos', type: 'Benefits Broker', sourced: 38, closed: 16, production: 42000, streak: 5, trend: 'up' as const },
  { rank: 2, name: 'David Park', type: 'Independent Agent', sourced: 32, closed: 13, production: 34000, streak: 3, trend: 'up' as const },
  { rank: 3, name: 'Rachel Green', type: 'General Agent', sourced: 26, closed: 10, production: 26000, streak: 2, trend: 'stable' as const },
  { rank: 4, name: 'James Wilson', type: 'FMO', sourced: 20, closed: 9, production: 23500, streak: 4, trend: 'up' as const },
  { rank: 5, name: 'Linda Chen', type: 'Wholesale', sourced: 14, closed: 8, production: 21000, streak: 1, trend: 'up' as const },
  { rank: 6, name: 'Kevin Brown', type: 'Benefits Broker', sourced: 10, closed: 4, production: 10400, streak: 0, trend: 'down' as const },
  { rank: 7, name: 'Amy Foster', type: 'Independent Agent', sourced: 8, closed: 2, production: 5200, streak: 0, trend: 'down' as const },
];

const rankIcons = [Trophy, Medal, Star];
const rankColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];

export function AdvisorLeaderboardModal({ open, onClose }: Props) {
  const [sort, setSort] = useState<'sourced' | 'closed' | 'production'>('production');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const sorted = [...LEADERBOARD].sort((a, b) => (b as any)[sort] - (a as any)[sort]);

  return (
    <Modal open={open} onClose={onClose} title="Advisor Leaderboard" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-th-text-tertiary">Rank by:</span>
          {(['production', 'sourced', 'closed'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', sort === s ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{s}</button>
          ))}
        </div>
        <div className="space-y-1.5">
          {sorted.map((a, i) => {
            const RankIcon = i < 3 ? rankIcons[i] : null;
            return (
              <div key={a.name} className={cn('flex items-center gap-3 p-2.5 rounded-xl border', i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-th-border/50')}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {RankIcon ? <RankIcon className={cn('w-5 h-5', rankColors[i])} /> : <span className="text-sm font-bold text-th-text-tertiary">#{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary">{a.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">{a.type}{a.streak > 0 ? ` • ${a.streak}mo streak` : ''}</p>
                </div>
                {a.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : a.trend === 'down' ? <TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180 shrink-0" /> : null}
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{a.sourced}</p><p className="text-[7px] text-th-text-tertiary">Sourced</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{a.closed}</p><p className="text-[7px] text-th-text-tertiary">Closed</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(a.production)}</p><p className="text-[7px] text-th-text-tertiary">Prod</p></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Leaderboard Tip</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Maria Santos</strong> leads production with a 5-month streak. <strong>James Wilson (FMO)</strong> has the best close-rate-to-volume ratio — consider expanding FMO relationships.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
