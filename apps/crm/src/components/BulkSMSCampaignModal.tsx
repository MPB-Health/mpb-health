import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  MessageSquare, Users, Clock, Send, AlertTriangle, Check,
  Loader2, Filter, Calendar, BarChart3, Sparkles, Eye,
  ChevronDown, Shield, Phone, X,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
}

interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  optedIn: boolean;
  lastSMS?: string;
}

interface BulkSMSCampaignModalProps {
  open: boolean;
  onClose: () => void;
  recipients?: SMSRecipient[];
  templates?: SMSTemplate[];
  onSend?: (recipientIds: string[], message: string, scheduledAt?: string) => Promise<void>;
}

const DEFAULT_TEMPLATES: SMSTemplate[] = [
  { id: '1', name: 'Appointment Reminder', category: 'Reminders', body: 'Hi {{first_name}}, this is {{agent_name}} from MPB Health. Just a reminder about your appointment on {{appointment_date}}. Reply YES to confirm or call us to reschedule.' },
  { id: '2', name: 'Enrollment Follow-Up', category: 'Follow-up', body: 'Hi {{first_name}}, I wanted to check in on your enrollment. Do you have any questions about the plans we discussed? I\'m here to help! — {{agent_name}}' },
  { id: '3', name: 'Open Enrollment Alert', category: 'Marketing', body: '{{first_name}}, Open Enrollment starts Oct 15! Now is the time to review your Medicare coverage for 2027. Let\'s schedule a free review. Reply REVIEW or call {{agent_phone}}.' },
  { id: '4', name: 'Birthday Greeting', category: 'Engagement', body: 'Happy Birthday, {{first_name}}! 🎂 Wishing you a wonderful day. If you have any insurance questions this year, I\'m always here. — {{agent_name}} at MPB Health' },
  { id: '5', name: 'Policy Renewal', category: 'Renewals', body: 'Hi {{first_name}}, your {{plan_type}} policy is coming up for renewal. Let\'s make sure you still have the best coverage for your needs. Can we schedule a quick call? — {{agent_name}}' },
];

const MOCK_RECIPIENTS: SMSRecipient[] = [
  { id: '1', name: 'James Wilson', phone: '(407) 555-1234', optedIn: true, lastSMS: '2026-03-15' },
  { id: '2', name: 'Mary Johnson', phone: '(407) 555-2345', optedIn: true, lastSMS: '2026-04-01' },
  { id: '3', name: 'Robert Chen', phone: '(407) 555-3456', optedIn: true },
  { id: '4', name: 'Dorothy Harris', phone: '(407) 555-4567', optedIn: false },
  { id: '5', name: 'Susan Thompson', phone: '(321) 555-5678', optedIn: true, lastSMS: '2026-04-10' },
  { id: '6', name: 'Michael Davis', phone: '(321) 555-6789', optedIn: true },
  { id: '7', name: 'Jennifer White', phone: '(407) 555-7890', optedIn: true, lastSMS: '2026-03-20' },
  { id: '8', name: 'David Brown', phone: '(407) 555-8901', optedIn: false },
];

export function BulkSMSCampaignModal({
  open, onClose, recipients: propRecipients, templates: propTemplates, onSend,
}: BulkSMSCampaignModalProps) {
  const recipients = propRecipients || MOCK_RECIPIENTS;
  const templates = propTemplates || DEFAULT_TEMPLATES;
  const [step, setStep] = useState<'compose' | 'recipients' | 'review'>('compose');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set(recipients.filter((r) => r.optedIn).map((r) => r.id)));
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const eligibleRecipients = recipients.filter((r) => r.optedIn);
  const selectedEligible = Array.from(selectedRecipients).filter((id) => recipients.find((r) => r.id === id)?.optedIn);
  const charCount = message.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const applyTemplate = (tId: string) => {
    const t = templates.find((tt) => tt.id === tId);
    if (t) { setMessage(t.body); setSelectedTemplate(tId); }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const scheduledAt = scheduleMode && scheduledDate ? `${scheduledDate}T${scheduledTime}:00` : undefined;
      await onSend?.(selectedEligible, message, scheduledAt);
      setSent(true);
    } catch { /* parent */ }
    finally { setSending(false); }
  };

  if (sent) {
    return (
      <Modal open={open} onClose={onClose} title="Bulk SMS Campaign" size="xl">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-th-text-primary">Campaign {scheduleMode ? 'Scheduled' : 'Sent'}!</h3>
          <p className="text-sm text-th-text-secondary mt-2">{selectedEligible.length} messages {scheduleMode ? `scheduled for ${scheduledDate} at ${scheduledTime}` : 'sent successfully'}</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk SMS Campaign" size="xl">
      <div className="space-y-4">
        {/* Steps */}
        <div className="flex gap-1">
          {[
            { id: 'compose' as const, label: 'Compose', num: 1 },
            { id: 'recipients' as const, label: 'Recipients', num: 2 },
            { id: 'review' as const, label: 'Review & Send', num: 3 },
          ].map((s) => (
            <button key={s.id} onClick={() => setStep(s.id)} className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
              step === s.id ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                step === s.id ? 'bg-th-accent-500 text-white' : 'bg-surface-tertiary text-th-text-tertiary'
              )}>{s.num}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="min-h-[320px]">
          {step === 'compose' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-th-text-secondary mb-2">Templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => applyTemplate(t.id)} className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      selectedTemplate === t.id ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
                    )}>{t.name}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-th-text-secondary">Message</label>
                  <span className={cn('text-[10px] tabular-nums', charCount > 160 ? 'text-amber-500' : 'text-th-text-tertiary')}>
                    {charCount}/160 · {segments} segment{segments > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
                  placeholder="Type your SMS message..."
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 resize-none focus:border-th-accent-500/50 focus:outline-none" />
              </div>

              {/* Phone preview */}
              <div className="flex justify-center">
                <div className="w-56 rounded-2xl border-2 border-th-border bg-surface-secondary p-3">
                  <div className="rounded-xl bg-green-500/10 px-3 py-2">
                    <p className="text-xs text-th-text-primary whitespace-pre-wrap">{message || 'Your message preview...'}</p>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary text-right mt-1">SMS Preview</p>
                </div>
              </div>
            </div>
          )}

          {step === 'recipients' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-th-text-tertiary">{selectedEligible.length} of {eligibleRecipients.length} opted-in selected</span>
                <div className="flex-1" />
                <button onClick={() => setSelectedRecipients(new Set(eligibleRecipients.map((r) => r.id)))}
                  className="text-xs text-th-accent-500 hover:text-th-accent-600">Select All</button>
                <button onClick={() => setSelectedRecipients(new Set())}
                  className="text-xs text-th-text-tertiary hover:text-th-text-secondary">Clear</button>
              </div>
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {recipients.map((r) => (
                  <label key={r.id} className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                    !r.optedIn ? 'opacity-50 cursor-not-allowed border-th-border/30' :
                    selectedRecipients.has(r.id) ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                  )}>
                    <input type="checkbox" checked={selectedRecipients.has(r.id)} disabled={!r.optedIn}
                      onChange={() => {
                        if (!r.optedIn) return;
                        setSelectedRecipients((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; });
                      }}
                      className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-th-text-primary">{r.name}</p>
                      <p className="text-xs text-th-text-tertiary">{r.phone}</p>
                    </div>
                    {r.optedIn ? (
                      <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Check className="w-2.5 h-2.5" />Opted In</span>
                    ) : (
                      <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><X className="w-2.5 h-2.5" />Opted Out</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                  <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-th-text-primary tabular-nums">{selectedEligible.length}</p>
                  <p className="text-[10px] text-th-text-tertiary">Recipients</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                  <MessageSquare className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-th-text-primary tabular-nums">{segments}</p>
                  <p className="text-[10px] text-th-text-tertiary">Segment{segments > 1 ? 's' : ''}/msg</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                  <BarChart3 className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-th-text-primary tabular-nums">{selectedEligible.length * segments}</p>
                  <p className="text-[10px] text-th-text-tertiary">Total Segments</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary border border-th-border/50">
                <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1">Message Preview</p>
                <p className="text-xs text-th-text-primary whitespace-pre-wrap">{message}</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scheduleMode} onChange={(e) => setScheduleMode(e.target.checked)}
                    className="w-4 h-4 rounded border-th-border text-th-accent-500" />
                  <span className="text-xs font-medium text-th-text-secondary">Schedule for later</span>
                </label>
                {scheduleMode && (
                  <div className="flex items-center gap-2">
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                      className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                      className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                  </div>
                )}
              </div>

              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">Only opted-in contacts will receive this message. TCPA compliance enforced.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {step !== 'compose' && (
            <button onClick={() => setStep(step === 'review' ? 'recipients' : 'compose')}
              className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Back</button>
          )}
          <div className="flex-1" />
          {step !== 'review' ? (
            <button onClick={() => setStep(step === 'compose' ? 'recipients' : 'review')}
              disabled={step === 'compose' && !message.trim()}
              className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50">Next</button>
          ) : (
            <button onClick={handleSend} disabled={sending || selectedEligible.length === 0}
              className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : scheduleMode ? 'Schedule Campaign' : `Send to ${selectedEligible.length} Recipients`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
