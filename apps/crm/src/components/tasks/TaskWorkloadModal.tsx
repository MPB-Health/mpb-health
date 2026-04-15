import { Modal } from '../Modal';
import { Users, AlertTriangle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TEAM = [
  { name: 'Julia Adams', open: 8, overdue: 0, capacity: 15, load: 53, status: 'balanced' as const, color: '#10b981' },
  { name: 'Marcus Chen', open: 12, overdue: 2, capacity: 15, load: 80, status: 'busy' as const, color: '#f59e0b' },
  { name: 'Sarah Kim', open: 14, overdue: 5, capacity: 15, load: 93, status: 'overloaded' as const, color: '#ef4444' },
  { name: 'David Park', open: 6, overdue: 3, capacity: 15, load: 40, status: 'light' as const, color: '#3b82f6' },
  { name: 'Amy Foster', open: 4, overdue: 6, capacity: 15, load: 27, status: 'light' as const, color: '#8b5cf6' },
];

const REBALANCE = [
  { from: 'Sarah Kim', to: 'David Park', tasks: 4, reason: 'Sarah is at 93% capacity with 5 overdue; David has bandwidth at 40%' },
  { from: 'Marcus Chen', to: 'Amy Foster', tasks: 2, reason: 'Marcus trending overdue; Amy has light load but needs coaching' },
];

const statusColors = { balanced: 'text-green-500', busy: 'text-amber-500', overloaded: 'text-red-500', light: 'text-blue-500' };

export function TaskWorkloadModal({ open, onClose }: Props) {
  const totalOpen = TEAM.reduce((s, t) => s + t.open, 0);
  const totalOverdue = TEAM.reduce((s, t) => s + t.overdue, 0);
  const avgLoad = Math.round(TEAM.reduce((s, t) => s + t.load, 0) / TEAM.length);

  return (
    <Modal open={open} onClose={onClose} title="Team Workload Balancing" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalOpen}</p>
            <p className="text-[10px] text-th-text-tertiary">Open Tasks</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalOverdue}</p>
            <p className="text-[10px] text-th-text-tertiary">Overdue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{avgLoad}%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Load</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {TEAM.map((t) => (
            <div key={t.name} className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: t.color }}>{t.load}%</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-th-text-primary">{t.name}</p>
                  <span className={cn('text-[8px] font-bold capitalize', statusColors[t.status])}>{t.status}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden mt-1">
                  <div className={cn('h-full rounded-full', t.load >= 90 ? 'bg-red-500' : t.load >= 70 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${t.load}%` }} />
                </div>
              </div>
              <div className="text-center shrink-0 w-12"><p className="text-[10px] font-bold text-th-text-primary">{t.open}</p><p className="text-[7px] text-th-text-tertiary">open</p></div>
              <div className="text-center shrink-0 w-12"><p className={cn('text-[10px] font-bold', t.overdue > 0 ? 'text-red-500' : 'text-th-text-tertiary')}>{t.overdue}</p><p className="text-[7px] text-th-text-tertiary">overdue</p></div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-accent-500/30 bg-th-accent-500/5">
          <p className="text-xs font-semibold text-th-accent-500 mb-2">Suggested Rebalancing</p>
          {REBALANCE.map((r) => (
            <div key={r.from + r.to} className="flex items-center gap-2 py-1.5">
              <span className="text-[10px] font-medium text-th-text-primary">{r.from}</span>
              <ArrowRight className="w-3 h-3 text-th-accent-500" />
              <span className="text-[10px] font-medium text-th-text-primary">{r.to}</span>
              <span className="text-[9px] text-th-accent-500 font-bold">{r.tasks} tasks</span>
              <button className="ml-auto text-[9px] font-medium text-th-accent-500 hover:text-th-accent-600 px-2 py-0.5 rounded bg-th-accent-500/10">Apply</button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Workload Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Sarah Kim</strong> is at 93% capacity with 5 overdue tasks. Redistribute 4 tasks to David Park (40% load) immediately. <strong>Amy Foster</strong> has low load but high overdue — needs a coaching check-in.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
