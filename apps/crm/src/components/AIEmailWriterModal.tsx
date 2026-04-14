import { useState } from 'react';
import { Modal } from './Modal';
import {
  Sparkles, Send, Copy, RefreshCw, Check, Loader2,
  ThumbsUp, ThumbsDown, Sliders, Mail, User, FileText,
  ChevronDown, Eye, Edit3, Wand2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AIEmailWriterModalProps {
  open: boolean;
  onClose: () => void;
  recipientName?: string;
  recipientEmail?: string;
  context?: string;
  onSend?: (subject: string, body: string) => Promise<void>;
  onInsertDraft?: (subject: string, body: string) => void;
}

type Tone = 'professional' | 'friendly' | 'persuasive' | 'empathetic' | 'urgent';
type EmailType = 'follow_up' | 'introduction' | 'plan_recommendation' | 'renewal_reminder' | 'thank_you' | 'appointment_confirm' | 'custom';

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling call to action' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding and caring' },
  { value: 'urgent', label: 'Urgent', description: 'Time-sensitive, action needed' },
];

const EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'plan_recommendation', label: 'Plan Recommendation' },
  { value: 'renewal_reminder', label: 'Renewal Reminder' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'appointment_confirm', label: 'Appointment Confirmation' },
  { value: 'custom', label: 'Custom Prompt' },
];

const MOCK_GENERATIONS: Record<string, { subject: string; body: string }> = {
  follow_up_professional: {
    subject: 'Following Up on Our Coverage Discussion',
    body: `Dear {{first_name}},\n\nI hope this message finds you well. I wanted to follow up on our recent conversation about your health coverage options.\n\nAs we discussed, there are several plans that could be an excellent fit for your needs, particularly given your interest in comprehensive coverage with predictable costs.\n\nI've prepared a personalized comparison of the top three options for your review. Would you have time for a brief call this week to walk through them together?\n\nPlease don't hesitate to reach out if you have any questions in the meantime.\n\nBest regards,\n{{agent_name}}\nMPB Health\n{{agent_phone}}`,
  },
  follow_up_friendly: {
    subject: 'Hey {{first_name}} — Checking In!',
    body: `Hi {{first_name}}!\n\nJust wanted to touch base after our chat the other day. I had a great time learning about what you're looking for in your health coverage.\n\nI've been doing some research and found some really great options that I think you'll love — especially since you mentioned wanting low out-of-pocket costs.\n\nWant to hop on a quick call this week? I promise to make it painless! 😊\n\nTalk soon,\n{{agent_name}}`,
  },
  renewal_reminder_empathetic: {
    subject: 'Your Coverage Renewal — Let\'s Make Sure You\'re Protected',
    body: `Dear {{first_name}},\n\nI know that navigating insurance renewals can feel overwhelming, and I want you to know that I'm here to make this process as smooth as possible for you.\n\nYour current {{plan_type}} policy is coming up for renewal, and I want to ensure you continue to have the coverage that best serves your needs. A lot can change in a year — your health, your medications, your doctors — and it's important that your plan keeps up.\n\nI'd love to schedule a time to review your current coverage together and explore whether there are any better options available to you this year.\n\nYour health and peace of mind are my top priority.\n\nWarmly,\n{{agent_name}}`,
  },
};

export function AIEmailWriterModal({
  open, onClose, recipientName = 'Client', recipientEmail, context, onSend, onInsertDraft,
}: AIEmailWriterModalProps) {
  const [emailType, setEmailType] = useState<EmailType>('follow_up');
  const [tone, setTone] = useState<Tone>('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [additionalContext, setAdditionalContext] = useState(context || '');
  const [generating, setGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [variations, setVariations] = useState(0);

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));

    const key = `${emailType}_${tone}`;
    const mock = MOCK_GENERATIONS[key] || MOCK_GENERATIONS.follow_up_professional;
    setGeneratedSubject(mock.subject);
    setGeneratedBody(mock.body);
    setEditing(false);
    setVariations((v) => v + 1);
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedBody}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    setSending(true);
    try { await onSend?.(generatedSubject, generatedBody); onClose(); }
    catch { /* parent */ }
    finally { setSending(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Email Writer" size="2xl">
      <div className="space-y-4">
        {/* Email type */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Email Type</p>
          <div className="flex flex-wrap gap-1.5">
            {EMAIL_TYPES.map((t) => (
              <button key={t.value} onClick={() => setEmailType(t.value)} className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                emailType === t.value ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
              )}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Tone</p>
          <div className="flex gap-1.5">
            {TONES.map((t) => (
              <button key={t.value} onClick={() => setTone(t.value)} className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium border text-center transition-all',
                tone === t.value ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
              )}>
                {t.label}
                <p className="text-[9px] text-th-text-tertiary mt-0.5 font-normal">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional context */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-1">{emailType === 'custom' ? 'Custom Prompt' : 'Additional Context'} (optional)</p>
          <textarea value={emailType === 'custom' ? customPrompt : additionalContext}
            onChange={(e) => emailType === 'custom' ? setCustomPrompt(e.target.value) : setAdditionalContext(e.target.value)}
            rows={2} placeholder={emailType === 'custom' ? 'Describe the email you want to write...' : 'e.g., Client mentioned budget concerns, interested in Medicare Advantage...'}
            className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 resize-none focus:border-th-accent-500/50 focus:outline-none" />
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={generating}
          className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Writing...' : variations > 0 ? 'Regenerate' : 'Generate Email'}
        </button>

        {/* Generated email */}
        {generatedBody && (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border-b border-th-border/50">
              <Mail className="w-3.5 h-3.5 text-th-accent-500" />
              <span className="text-xs font-medium text-th-text-primary flex-1">Generated Email (v{variations})</span>
              <button onClick={() => setEditing(!editing)} className={cn('p-1 rounded text-xs', editing ? 'text-th-accent-500' : 'text-th-text-tertiary')}>
                {editing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-12">To:</span>
                <span className="text-xs text-th-text-primary">{recipientName} {recipientEmail ? `<${recipientEmail}>` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-12">Subject:</span>
                {editing ? (
                  <input type="text" value={generatedSubject} onChange={(e) => setGeneratedSubject(e.target.value)}
                    className="flex-1 text-xs font-medium rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1 focus:border-th-accent-500/50 focus:outline-none" />
                ) : (
                  <span className="text-xs font-medium text-th-text-primary">{generatedSubject}</span>
                )}
              </div>
              <div className="border-t border-th-border/30 pt-2">
                {editing ? (
                  <textarea value={generatedBody} onChange={(e) => setGeneratedBody(e.target.value)} rows={8}
                    className="w-full text-xs bg-transparent text-th-text-primary resize-none focus:outline-none leading-relaxed" />
                ) : (
                  <p className="text-xs text-th-text-primary whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">{generatedBody}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {generatedBody && (
          <div className="flex gap-2">
            <button onClick={handleCopy} className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              copied ? 'border-green-500/50 text-green-500' : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            )}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {onInsertDraft && (
              <button onClick={() => { onInsertDraft(generatedSubject, generatedBody); onClose(); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                <FileText className="w-4 h-4" /> Save as Draft
              </button>
            )}
            <div className="flex-1" />
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        )}

        {!generatedBody && (
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
