import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, CheckCircle2, Clock, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; total: number; completed: number; overdue: number; dueToday: number; }

const BY_TYPE = [
  { type: 'Follow-up Call', total: 48, completed: 32, avgDays: 1.2, onTime: 88, color: '#3b82f6' },
  { type: 'Send Quote', total: 28, completed: 22, avgDays: 2.4, onTime: 78, color: '#10b981' },
  { type: 'Application Review', total: 22, completed: 18, avgDays: 1.8, onTime: 82, color: '#8b5cf6' },
  { type: 'Enrollment Follow-up', total: 18, completed: 10, avgDays: 3.1, onTime: 65, color: '#f59e0b' },
  { type: 'Document Request', total: 14, completed: 8, avgDays: 4.2, onTime: 55, color: '#ef4444' },
];

export function TaskAnalyticsModal({ open, onClose, total, completed, overdue, dueToday }: Props) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const compRate = total > 0 ? Math.round(completed / total * 100) : 0;
  const maxTotal = Math.max(...BY_TYPE.map((t) => t.total), 1);

  return (
    <Modal open={open} onClose={onClose} title="Task Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: total || BY_TYPE.reduce((s, t) => s + t.total, 0), icon: BarChart3, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Completed', value: completed || BY_TYPE.reduce((s, t) => s + t.completed, 0), icon: CheckCircle2, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Overdue', value: overdue || 12, icon: AlertCircle, color: 'text-red-500', bg: 'from-red-500/10 to-pink-500/10' },
            { label: 'Completion Rate', value: `${compRate || 69}%`, icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {BY_TYPE.map((t) => (
            <div key={t.type} className="p-2.5 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{t.type}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', t.onTime >= 80 ? 'bg-green-500/10 text-green-500' : t.onTime >= 65 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}>{t.onTime}% on-time</span>
              </div>
              <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${(t.total / maxTotal) * 100}%`, backgroundColor: t.color }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.total}</p><p className="text-[7px] text-th-text-tertiary">Total</p></div>
                <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{t.completed}</p><p className="text-[7px] text-th-text-tertiary">Done</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.avgDays}d</p><p className="text-[7px] text-th-text-tertiary">Avg Time</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.total - t.completed}</p><p className="text-[7px] text-th-text-tertiary">Open</p></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Task Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Document Requests</strong> have the worst on-time rate at 55% with 4.2-day average. Consider creating automated reminders. <strong>Follow-up Calls</strong> are your strongest category at 88% on-time.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
