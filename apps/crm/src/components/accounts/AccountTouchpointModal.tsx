import { useState } from 'react';
import { Modal } from '../Modal';
import { Phone, Mail, MessageSquare, Calendar, Video, Coffee, Plus, Clock, CheckCircle2, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Touchpoint { id: string; type: string; icon: typeof Phone; date: string; contact: string; note: string; status: 'completed' | 'scheduled' | 'overdue'; }
interface AccountTouchpointModalProps { open: boolean; onClose: () => void; accountName?: string; }

const CHANNEL_TYPES = [
  { type: 'call', label: 'Call', icon: Phone, color: 'text-green-500 bg-green-500/10' },
  { type: 'email', label: 'Email', icon: Mail, color: 'text-blue-500 bg-blue-500/10' },
  { type: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-violet-500 bg-violet-500/10' },
  { type: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-amber-500 bg-amber-500/10' },
  { type: 'video', label: 'Video Call', icon: Video, color: 'text-red-500 bg-red-500/10' },
  { type: 'in_person', label: 'In Person', icon: Coffee, color: 'text-orange-500 bg-orange-500/10' },
];

const MOCK_TOUCHPOINTS: Touchpoint[] = [
  { id: '1', type: 'call', icon: Phone, date: '2026-04-14', contact: 'John Smith', note: 'Quarterly review call', status: 'scheduled' },
  { id: '2', type: 'email', icon: Mail, date: '2026-04-12', contact: 'Sarah Jones', note: 'Sent renewal proposal', status: 'completed' },
  { id: '3', type: 'meeting', icon: Calendar, date: '2026-04-10', contact: 'John Smith', note: 'Plan comparison walkthrough', status: 'completed' },
  { id: '4', type: 'call', icon: Phone, date: '2026-04-08', contact: 'Mark Lee', note: 'Follow-up on coverage questions', status: 'overdue' },
  { id: '5', type: 'email', icon: Mail, date: '2026-04-05', contact: 'Sarah Jones', note: 'Initial outreach', status: 'completed' },
  { id: '6', type: 'sms', icon: MessageSquare, date: '2026-04-03', contact: 'John Smith', note: 'Appointment reminder', status: 'completed' },
];

const STATUS_CONFIG = {
  completed: { color: 'text-green-500 bg-green-500/10', label: 'Done' },
  scheduled: { color: 'text-blue-500 bg-blue-500/10', label: 'Upcoming' },
  overdue: { color: 'text-red-500 bg-red-500/10', label: 'Overdue' },
};

export function AccountTouchpointModal({ open, onClose, accountName }: AccountTouchpointModalProps) {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'overdue'>('all');
  const filtered = filter === 'all' ? MOCK_TOUCHPOINTS : MOCK_TOUCHPOINTS.filter((t) => t.status === filter);

  const completedCount = MOCK_TOUCHPOINTS.filter((t) => t.status === 'completed').length;
  const scheduledCount = MOCK_TOUCHPOINTS.filter((t) => t.status === 'scheduled').length;
  const overdueCount = MOCK_TOUCHPOINTS.filter((t) => t.status === 'overdue').length;

  return (
    <Modal open={open} onClose={onClose} title={`Touchpoints${accountName ? ` — ${accountName}` : ''}`} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{completedCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Completed</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{scheduledCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Scheduled</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{overdueCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Overdue</p>
          </div>
        </div>

        {/* Channel quick-add */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-th-text-tertiary font-medium mr-1">Log:</span>
          {CHANNEL_TYPES.map((ch) => (
            <button key={ch.type} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border border-transparent hover:border-th-border/50', ch.color)}>
              <ch.icon className="w-3 h-3" />{ch.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['all', 'scheduled', 'overdue'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{f === 'all' ? `All (${MOCK_TOUCHPOINTS.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${f === 'scheduled' ? scheduledCount : overdueCount})`}</button>
          ))}
        </div>

        <div className="max-h-[280px] overflow-y-auto space-y-1.5">
          {filtered.map((tp) => {
            const TpIcon = tp.icon;
            return (
              <div key={tp.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30 hover:bg-surface-secondary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                  <TpIcon className="w-4 h-4 text-th-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-th-text-primary">{tp.note}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', STATUS_CONFIG[tp.status].color)}>
                      {STATUS_CONFIG[tp.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-th-text-tertiary">
                    <span>{tp.contact}</span>
                    <span>•</span>
                    <span>{tp.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Engagement Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">This account has been touched <strong>6 times in 12 days</strong> — above average cadence. Consider spacing touchpoints to avoid fatigue.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
