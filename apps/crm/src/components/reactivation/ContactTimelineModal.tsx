import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Phone, Mail, MessageSquare, Calendar, FileText, StickyNote,
  Clock, User, ChevronDown, ChevronRight, ExternalLink,
  AlertTriangle, CheckCircle2, Star, Activity,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface TimelineEvent {
  id: string;
  type: 'email_sent' | 'email_opened' | 'call' | 'sms' | 'meeting' | 'note' | 'task' | 'stage_change' | 'form_submit';
  title: string;
  description: string;
  date: string;
  agent: string;
  outcome?: string;
  metadata?: Record<string, string>;
}

interface ContactTimelineModalProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId: string;
  events?: TimelineEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  email_sent: { icon: Mail, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  email_opened: { icon: Mail, color: 'text-green-500', bg: 'bg-green-500/10' },
  call: { icon: Phone, color: 'text-green-500', bg: 'bg-green-500/10' },
  sms: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  meeting: { icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  note: { icon: StickyNote, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  task: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  stage_change: { icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  form_submit: { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const MOCK_EVENTS: TimelineEvent[] = [
  { id: '1', type: 'form_submit', title: 'Lead Submitted Form', description: 'Quick Rate Estimate form — interested in Medicare Advantage', date: '2025-12-15T09:30:00', agent: 'System' },
  { id: '2', type: 'email_sent', title: 'Welcome Email Sent', description: 'Automated welcome email with plan overview PDF attached', date: '2025-12-15T09:31:00', agent: 'System' },
  { id: '3', type: 'email_opened', title: 'Email Opened', description: 'Welcome email opened (2x views)', date: '2025-12-15T14:22:00', agent: 'System' },
  { id: '4', type: 'call', title: 'Initial Call', description: 'Discussed Medicare options. Client interested but wants to talk with spouse first.', date: '2025-12-16T10:15:00', agent: 'Agent Smith', outcome: 'Connected - Follow up needed' },
  { id: '5', type: 'note', title: 'Agent Note', description: 'Client has diabetes and high BP. Currently on employer plan but retiring in June. Spouse is 62, not yet Medicare eligible.', date: '2025-12-16T10:45:00', agent: 'Agent Smith' },
  { id: '6', type: 'email_sent', title: 'Plan Comparison Sent', description: 'Sent personalized Aetna MA PPO vs Humana Gold comparison', date: '2025-12-18T11:00:00', agent: 'Agent Smith' },
  { id: '7', type: 'email_opened', title: 'Email Opened', description: 'Plan comparison email opened (3x views, 2:45 avg read time)', date: '2025-12-18T15:30:00', agent: 'System' },
  { id: '8', type: 'call', title: 'Follow-Up Call', description: 'No answer. Left voicemail about the plan comparison.', date: '2025-12-20T14:00:00', agent: 'Agent Smith', outcome: 'No answer - Voicemail' },
  { id: '9', type: 'stage_change', title: 'Stage Changed', description: 'Moved from "new" to "contacted"', date: '2025-12-20T14:05:00', agent: 'Agent Smith' },
  { id: '10', type: 'email_sent', title: 'Follow-Up Email', description: 'Gentle follow-up referencing voicemail and plan comparison', date: '2025-12-22T09:00:00', agent: 'Agent Smith' },
  { id: '11', type: 'sms', title: 'SMS Sent', description: 'Quick text: "Hi Patricia, just checking if you had a chance to review the plans. Happy to answer any questions!"', date: '2025-12-23T10:00:00', agent: 'Agent Smith' },
  { id: '12', type: 'note', title: 'Agent Note', description: 'No response to any outreach since Dec 16 call. Marking as stale for January follow-up.', date: '2026-01-08T09:00:00', agent: 'Agent Smith' },
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function daysBetween(d1: string, d2: string) {
  return Math.round(Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / 86400000);
}

export function ContactTimelineModal({ open, onClose, leadName, leadId, events: propEvents }: ContactTimelineModalProps) {
  const events = propEvents || MOCK_EVENTS;
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const totalInteractions = events.length;
  const firstDate = events[0]?.date;
  const lastDate = events[events.length - 1]?.date;
  const daysSinceFirst = firstDate ? daysBetween(firstDate, new Date().toISOString()) : 0;
  const daysSinceLast = lastDate ? daysBetween(lastDate, new Date().toISOString()) : 0;
  const emailOpens = events.filter((e) => e.type === 'email_opened').length;
  const calls = events.filter((e) => e.type === 'call').length;

  return (
    <Modal open={open} onClose={onClose} title={`Contact Timeline — ${leadName}`} size="xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
            <p className="text-sm font-bold text-th-text-primary tabular-nums">{totalInteractions}</p>
            <p className="text-[10px] text-th-text-tertiary">Interactions</p>
          </div>
          <div className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
            <p className="text-sm font-bold text-th-text-primary tabular-nums">{daysSinceLast}d</p>
            <p className="text-[10px] text-th-text-tertiary">Since Last</p>
          </div>
          <div className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
            <p className="text-sm font-bold text-th-text-primary tabular-nums">{emailOpens}</p>
            <p className="text-[10px] text-th-text-tertiary">Email Opens</p>
          </div>
          <div className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
            <p className="text-sm font-bold text-th-text-primary tabular-nums">{calls}</p>
            <p className="text-[10px] text-th-text-tertiary">Calls Made</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-h-[380px] overflow-y-auto">
          <div className="relative pl-8">
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-th-border/50" />

            {events.map((event, idx) => {
              const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.note;
              const EventIcon = cfg.icon;
              const expanded = expandedEvent === event.id;
              const showDateHeader = idx === 0 || formatDate(event.date) !== formatDate(events[idx - 1].date);

              return (
                <div key={event.id}>
                  {showDateHeader && (
                    <div className="relative mb-2 mt-3 first:mt-0">
                      <span className="text-[10px] font-semibold text-th-text-tertiary bg-surface-primary px-2 relative z-10 ml-6">
                        {formatDate(event.date)}
                      </span>
                    </div>
                  )}
                  <div className="relative mb-2">
                    <div className={cn('absolute left-0 w-[30px] h-[30px] rounded-full flex items-center justify-center z-10', cfg.bg)} style={{ top: 4 }}>
                      <EventIcon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <button onClick={() => setExpandedEvent(expanded ? null : event.id)}
                      className={cn('ml-10 w-[calc(100%-40px)] text-left px-3 py-2 rounded-lg border transition-all',
                        expanded ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/30 hover:border-th-border/50'
                      )}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-th-text-primary flex-1">{event.title}</span>
                        <span className="text-[10px] text-th-text-tertiary">{formatTime(event.date)}</span>
                      </div>
                      {expanded && (
                        <div className="mt-1.5 space-y-1">
                          <p className="text-xs text-th-text-secondary">{event.description}</p>
                          {event.outcome && (
                            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Outcome: {event.outcome}</p>
                          )}
                          <p className="text-[10px] text-th-text-tertiary">By: {event.agent}</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Stale indicator */}
            <div className="relative mt-4 mb-2">
              <div className="absolute left-0 w-[30px] h-[30px] rounded-full flex items-center justify-center bg-red-500/10 z-10" style={{ top: 4 }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="ml-10 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5">
                <p className="text-xs font-medium text-red-500">Lead went stale — {daysSinceLast} days with no contact</p>
                <p className="text-[10px] text-th-text-tertiary">Last interaction: {lastDate ? formatDate(lastDate) : 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
