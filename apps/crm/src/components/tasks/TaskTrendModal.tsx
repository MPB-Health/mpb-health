import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const WEEKLY = [
  { week: 'W1', created: 32, completed: 28, backlog: 4 },
  { week: 'W2', created: 38, completed: 34, backlog: 8 },
  { week: 'W3', created: 42, completed: 36, backlog: 14 },
  { week: 'W4', created: 35, completed: 40, backlog: 9 },
  { week: 'W5', created: 28, completed: 30, backlog: 7 },
  { week: 'W6', created: 44, completed: 38, backlog: 13 },
];

const BY_SOURCE = [
  { source: 'Lead Follow-up', count: 68, pct: 35, color: '#3b82f6' },
  { source: 'Quote / Proposal', count: 42, pct: 22, color: '#10b981' },
  { source: 'Event Follow-up', count: 28, pct: 14, color: '#8b5cf6' },
  { source: 'Partner Activity', count: 22, pct: 11, color: '#f59e0b' },
  { source: 'Manual / Ad-hoc', count: 20, pct: 10, color: '#ef4444' },
  { source: 'Automation', count: 16, pct: 8, color: '#06b6d4' },
];

export function TaskTrendModal({ open, onClose }: Props) {
  const [period, setPeriod] = useState<'6w' | '12w' | 'ytd'>('6w');
  const maxCreated = Math.max(...WEEKLY.map((w) => Math.max(w.created, w.completed)), 1);

  return (
    <Modal open={open} onClose={onClose} title="Task Trends" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['6w', '12w', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '6w' ? '6 Weeks' : p === '12w' ? '12 Weeks' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center gap-4 mb-2">
            <p className="text-xs font-semibold text-th-text-secondary">Created vs Completed</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /><span className="text-[8px] text-th-text-tertiary">Created</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /><span className="text-[8px] text-th-text-tertiary">Completed</span></div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-24">
            {WEEKLY.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '80px' }}>
                  <div className="flex-1 bg-blue-500/30 rounded-t" style={{ height: `${(w.created / maxCreated) * 100}%` }} />
                  <div className="flex-1 bg-green-500/30 rounded-t" style={{ height: `${(w.completed / maxCreated) * 100}%` }} />
                </div>
                <span className="text-[8px] text-th-text-tertiary">{w.week}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Tasks by Source</p>
          <div className="space-y-1.5">
            {BY_SOURCE.map((s) => (
              <div key={s.source} className="flex items-center gap-2">
                <div className="w-2.5 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-medium text-th-text-primary w-28">{s.source}</span>
                <div className="flex-1 h-3 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${s.pct}%`, backgroundColor: s.color + '40' }} />
                </div>
                <span className="text-[10px] tabular-nums text-th-text-secondary w-8">{s.count}</span>
                <span className="text-[9px] tabular-nums text-th-text-tertiary w-8">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Trend Insight</span></div>
          <p className="text-xs text-th-text-secondary">Task backlog grew to 13 in W6 — creation outpacing completion. <strong>Lead follow-ups</strong> (35%) are the biggest source. Consider automating initial outreach to reduce manual task volume.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
