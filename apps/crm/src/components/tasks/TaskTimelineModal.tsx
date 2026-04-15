import { Modal } from '../Modal';
import { Calendar, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TIMELINE = [
  { date: 'Today — Apr 14', tasks: [
    { title: 'Call Brett Baker — Quick Rate follow-up', lead: 'Brett Baker', status: 'pending' as const, priority: 'high' as const },
    { title: 'Send quote to Acme Corp', lead: 'Acme Corp', status: 'pending' as const, priority: 'high' as const },
    { title: 'Review application — Mitchell Family', lead: 'Sarah Mitchell', status: 'completed' as const, priority: 'medium' as const },
  ]},
  { date: 'Tomorrow — Apr 15', tasks: [
    { title: 'Follow-up enrollment — TechStart LLC', lead: 'TechStart LLC', status: 'pending' as const, priority: 'medium' as const },
    { title: 'Document request — Baker Family HSA', lead: 'Brett Baker', status: 'pending' as const, priority: 'low' as const },
  ]},
  { date: 'Apr 16', tasks: [
    { title: 'Quarterly review prep — Top 10 accounts', lead: 'Multiple', status: 'pending' as const, priority: 'medium' as const },
  ]},
  { date: 'Apr 17–18', tasks: [
    { title: 'Church Partnership event follow-up calls', lead: 'Event Leads', status: 'pending' as const, priority: 'high' as const },
    { title: 'Referral partner commission review', lead: 'Partners', status: 'pending' as const, priority: 'medium' as const },
    { title: 'Campaign performance report', lead: 'Internal', status: 'pending' as const, priority: 'low' as const },
  ]},
];

const OVERDUE = [
  { title: 'Follow-up call — Midwest Mfg', lead: 'Midwest Mfg', daysOverdue: 3, priority: 'high' as const },
  { title: 'Send revised quote — West Coast Fitness', lead: 'West Coast Fitness', daysOverdue: 2, priority: 'medium' as const },
];

const priorityColors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-400' };
const statusIcons = { pending: Clock, completed: CheckCircle2 };

export function TaskTimelineModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Task Timeline" size="xl">
      <div className="space-y-4">
        {OVERDUE.length > 0 && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs font-bold text-red-600 dark:text-red-400">Overdue ({OVERDUE.length})</span></div>
            {OVERDUE.map((t) => (
              <div key={t.title} className="flex items-center gap-2 py-1">
                <div className={cn('w-1.5 h-1.5 rounded-full', priorityColors[t.priority])} />
                <span className="text-[10px] font-medium text-th-text-primary flex-1">{t.title}</span>
                <span className="text-[9px] text-red-500 font-bold">{t.daysOverdue}d overdue</span>
              </div>
            ))}
          </div>
        )}

        {TIMELINE.map((day) => (
          <div key={day.date}>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-th-accent-500" />
              <span className="text-xs font-bold text-th-text-primary">{day.date}</span>
              <span className="text-[9px] text-th-text-tertiary">{day.tasks.length} tasks</span>
            </div>
            <div className="space-y-1 pl-5 border-l-2 border-th-border/30 ml-1.5">
              {day.tasks.map((t) => {
                const Icon = statusIcons[t.status];
                return (
                  <div key={t.title} className={cn('flex items-center gap-2 py-1.5 px-2 rounded-lg', t.status === 'completed' ? 'opacity-50' : '')}>
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityColors[t.priority])} />
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', t.status === 'completed' ? 'text-green-500' : 'text-th-text-tertiary')} />
                    <span className={cn('text-[10px] font-medium flex-1', t.status === 'completed' ? 'line-through text-th-text-tertiary' : 'text-th-text-primary')}>{t.title}</span>
                    <span className="text-[8px] text-th-text-tertiary">{t.lead}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Timeline Tip</span></div>
          <p className="text-xs text-th-text-secondary">You have <strong>2 overdue</strong> and <strong>3 high-priority tasks today</strong>. Clear overdue tasks first — they impact lead response times and conversion rates.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
