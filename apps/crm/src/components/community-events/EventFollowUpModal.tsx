import { useState } from 'react';
import { Modal } from '../Modal';
import { Mail, Phone, CheckCircle2, Circle, Clock, AlertTriangle, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const EVENTS_WITH_FOLLOWUPS = [
  {
    event: 'Grace Community Fellowship',
    date: 'Apr 12',
    tasks: [
      { id: '1', task: 'Send thank-you email to pastor', type: 'email' as const, done: true },
      { id: '2', task: 'Call 12 hot leads within 48h', type: 'call' as const, done: false },
      { id: '3', task: 'Upload event photos to CRM', type: 'task' as const, done: true },
      { id: '4', task: 'Schedule next church visit', type: 'task' as const, done: false },
    ],
  },
  {
    event: 'Downtown Health Expo',
    date: 'Apr 8',
    tasks: [
      { id: '5', task: 'Send bulk follow-up to 92 contacts', type: 'email' as const, done: false },
      { id: '6', task: 'Prioritize 18 leads by interest level', type: 'task' as const, done: false },
      { id: '7', task: 'File event expense report', type: 'task' as const, done: true },
    ],
  },
];

export function EventFollowUpModal({ open, onClose }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(EVENTS_WITH_FOLLOWUPS.flatMap((e) => e.tasks.filter((t) => t.done).map((t) => t.id))));
  const toggle = (id: string) => setCompleted((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allTasks = EVENTS_WITH_FOLLOWUPS.flatMap((e) => e.tasks);
  const pendingCount = allTasks.length - completed.size;

  return (
    <Modal open={open} onClose={onClose} title="Post-Event Follow-Up" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{pendingCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Pending</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{completed.size}</p>
            <p className="text-[10px] text-th-text-tertiary">Completed</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{EVENTS_WITH_FOLLOWUPS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Events</p>
          </div>
        </div>

        {EVENTS_WITH_FOLLOWUPS.map((ev) => (
          <div key={ev.event} className="p-3 rounded-xl border border-th-border/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-th-text-primary">{ev.event}</span>
              <span className="text-[9px] text-th-text-tertiary">{ev.date}</span>
            </div>
            <div className="space-y-1">
              {ev.tasks.map((t) => {
                const done = completed.has(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-th-text-tertiary group-hover:text-th-accent-500 shrink-0" />}
                    <input type="checkbox" checked={done} onChange={() => toggle(t.id)} className="sr-only" />
                    {t.type === 'email' ? <Mail className="w-3 h-3 text-blue-400 shrink-0" /> : t.type === 'call' ? <Phone className="w-3 h-3 text-green-400 shrink-0" /> : null}
                    <span className={cn('text-[10px] flex-1', done ? 'text-green-700 dark:text-green-300 line-through' : 'text-th-text-primary')}>{t.task}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Follow-Up Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Downtown Health Expo</strong> has 92 contacts pending bulk follow-up — 6 days post-event. Contact within 48h converts 3x better. Prioritize this today.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
