import { Modal } from '../Modal';
import { Users, TrendingUp, TrendingDown, Sparkles, Trophy } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const REPS = [
  { name: 'Julia Adams', completed: 42, onTime: 38, overdue: 2, avgTime: 1.1, score: 95, trend: 'up' as const, color: '#10b981' },
  { name: 'Marcus Chen', completed: 36, onTime: 30, overdue: 4, avgTime: 1.6, score: 82, trend: 'up' as const, color: '#3b82f6' },
  { name: 'Sarah Kim', completed: 28, onTime: 22, overdue: 5, avgTime: 2.0, score: 72, trend: 'stable' as const, color: '#8b5cf6' },
  { name: 'David Park', completed: 18, onTime: 12, overdue: 8, avgTime: 2.8, score: 56, trend: 'down' as const, color: '#f59e0b' },
  { name: 'Amy Foster', completed: 10, onTime: 5, overdue: 6, avgTime: 3.5, score: 38, trend: 'down' as const, color: '#ef4444' },
];

export function TaskProductivityModal({ open, onClose }: Props) {
  const avgScore = Math.round(REPS.reduce((s, r) => s + r.score, 0) / REPS.length);
  const totalCompleted = REPS.reduce((s, r) => s + r.completed, 0);

  return (
    <Modal open={open} onClose={onClose} title="Team Productivity" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Trophy className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalCompleted}</p>
            <p className="text-[10px] text-th-text-tertiary">Team Total</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{REPS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Active Reps</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{avgScore}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {REPS.map((r, i) => (
            <div key={r.name} className={cn('flex items-center gap-3 p-2.5 rounded-xl border', i === 0 ? 'border-green-500/30 bg-green-500/5' : 'border-th-border/50')}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: r.color }}>{r.score}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-th-text-primary">{r.name}</p>
                <p className="text-[9px] text-th-text-tertiary">{r.completed} done • {r.overdue} overdue • {r.avgTime}d avg</p>
              </div>
              {r.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : r.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" /> : null}
              <div className="w-16 h-1.5 rounded bg-surface-tertiary overflow-hidden shrink-0"><div className="h-full rounded" style={{ width: `${r.score}%`, backgroundColor: r.color }} /></div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Productivity Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Amy Foster</strong> (score 38) has 6 overdue tasks and a 3.5-day average — schedule a coaching session. <strong>David Park</strong> is trending down with 8 overdue tasks.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
