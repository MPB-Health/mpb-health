import { useState } from 'react';
import { Modal } from '../Modal';
import { Mail, Send, Users, CheckCircle2, Loader2, Sparkles, Eye } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface BulkEmailModalProps { open: boolean; onClose: () => void; selectedCount: number; }

const TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to {{company}}', preview: 'Hi {{first_name}}, welcome aboard!' },
  { id: 'followup', name: 'Follow-Up', subject: 'Following up on our conversation', preview: 'Hi {{first_name}}, just checking in...' },
  { id: 'renewal', name: 'Renewal Reminder', subject: 'Your plan renewal is coming up', preview: 'Dear {{first_name}}, your coverage...' },
  { id: 'newsletter', name: 'Monthly Newsletter', subject: 'Your April Health Update', preview: 'This month\'s highlights...' },
  { id: 'custom', name: 'Custom Email', subject: '', preview: '' },
];

export function BulkEmailModal({ open, onClose, selectedCount }: BulkEmailModalProps) {
  const [step, setStep] = useState<'compose' | 'preview' | 'sending' | 'done'>('compose');
  const [template, setTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentCount, setSentCount] = useState(0);

  const activeTemplate = TEMPLATES.find((t) => t.id === template);

  const selectTemplate = (id: string) => {
    setTemplate(id);
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl && id !== 'custom') {
      setSubject(tpl.subject);
      setBody(tpl.preview);
    }
  };

  const handleSend = async () => {
    setStep('sending');
    await new Promise((r) => setTimeout(r, 1500));
    setSentCount(selectedCount);
    setStep('done');
  };

  const handleClose = () => { setStep('compose'); setTemplate(''); setSubject(''); setBody(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Email" size="xl">
      <div className="space-y-4">
        {step === 'compose' && (
          <>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Sending to {selectedCount} contact{selectedCount !== 1 ? 's' : ''}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Template</label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => selectTemplate(t.id)} className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    template === t.id ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                  )}>{t.name}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line..."
                className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Email body... Use {{first_name}}, {{last_name}}, {{company}} for personalization"
                className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none resize-none" />
            </div>

            <div className="p-2 rounded-lg bg-surface-secondary/50 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-[10px] text-th-text-tertiary">Contacts with <strong>Do Not Email</strong> will be automatically excluded</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={() => setStep('preview')} disabled={!subject.trim() || !body.trim()}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="rounded-xl border border-th-border/50 overflow-hidden">
              <div className="px-4 py-3 bg-surface-secondary/50 border-b border-th-border/30">
                <p className="text-xs text-th-text-tertiary">Subject</p>
                <p className="text-sm font-medium text-th-text-primary">{subject.replace('{{company}}', 'MPB Health')}</p>
              </div>
              <div className="px-4 py-4 text-sm text-th-text-secondary whitespace-pre-wrap">
                {body.replace(/\{\{first_name\}\}/g, 'Brett').replace(/\{\{last_name\}\}/g, 'Baker').replace(/\{\{company\}\}/g, 'MPB Health')}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('compose')} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary">Edit</button>
              <button onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send to {selectedCount} Contacts
              </button>
            </div>
          </>
        )}

        {step === 'sending' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-th-accent-500 mx-auto animate-spin" />
            <p className="text-sm font-medium text-th-text-primary">Sending emails...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Emails Sent!</p>
            <p className="text-sm text-th-text-secondary">Successfully sent to {sentCount} contacts</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
