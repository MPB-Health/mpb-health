import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Phone, Mail, MessageSquare, Sparkles, Copy, Check, Loader2,
  RefreshCw, User, Clock, AlertTriangle, ThumbsUp,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface LeadContext {
  name: string;
  stage: string;
  daysSinceContact: number;
  lastInteractionType?: string;
  lastNote?: string;
  planInterest?: string;
  age?: number;
}

interface ReengagementScriptModalProps {
  open: boolean;
  onClose: () => void;
  lead?: LeadContext;
}

type ScriptType = 'call' | 'email' | 'voicemail' | 'sms';

interface GeneratedScript {
  type: ScriptType;
  title: string;
  content: string;
}

const MOCK_SCRIPTS: Record<string, GeneratedScript[]> = {
  default: [
    { type: 'call', title: 'Re-engagement Call Script',
      content: `Opening:\n"Hi [Name], this is {{agent_name}} from MPB Health. I hope I'm not catching you at a bad time — I noticed it's been a while since we last connected and I wanted to check in."\n\nBridge:\n"A lot has changed in the health insurance landscape recently, and I wanted to make sure you're still getting the best coverage for your needs."\n\nValue Hook:\n"I actually came across some [new plans / rate changes / savings opportunities] that made me think of you specifically."\n\nSoft Ask:\n"Would you have 10-15 minutes this week for a quick, no-obligation review? I'd love to make sure you're not leaving money on the table."\n\nIf hesitant:\n"Totally understand. I can also send you a quick email summary so you can review at your own pace. Would that work better?"\n\nClose:\n"Great, I'll [schedule that call / send that email] right away. Thanks for your time, [Name]!"` },
    { type: 'email', title: 'Re-engagement Email',
      content: `Subject: [Name], quick check-in from {{agent_name}}\n\nHi [Name],\n\nI hope you're doing well! It's been a while since we last spoke, and I wanted to reach out because I've been thinking about your coverage situation.\n\nSince we last connected, there have been some significant changes in the health insurance market that could benefit you:\n\n• New plan options with lower premiums\n• Updated subsidy calculations that may save you money\n• Network expansions that could give you more provider choices\n\nI'd love to schedule a quick 15-minute call to review your current situation and see if there's an opportunity to improve your coverage or reduce your costs.\n\nWould [Tuesday or Wednesday] this week work for a brief chat?\n\nLooking forward to reconnecting,\n{{agent_name}}\nMPB Health\n{{agent_phone}}` },
    { type: 'voicemail', title: 'Voicemail Script (30 seconds)',
      content: `"Hi [Name], this is {{agent_name}} from MPB Health. I'm reaching out because it's been a while since we connected, and I came across some new coverage options that could save you money.\n\nI'd love just 10 minutes of your time to do a quick review — no pressure at all. You can reach me at {{agent_phone}} or just reply to the email I'll be sending shortly.\n\nHope to hear from you soon. Take care!"` },
    { type: 'sms', title: 'Re-engagement Text',
      content: `Hi [Name], it's {{agent_name}} from MPB Health! It's been a while — I wanted to check in and let you know about some new coverage options that could save you money. Got a few minutes for a quick chat? Call/text me anytime. 😊` },
  ],
};

const TYPE_CONFIG: Record<ScriptType, { icon: React.ElementType; color: string; label: string }> = {
  call: { icon: Phone, color: 'text-green-500', label: 'Call Script' },
  email: { icon: Mail, color: 'text-cyan-500', label: 'Email' },
  voicemail: { icon: Phone, color: 'text-amber-500', label: 'Voicemail' },
  sms: { icon: MessageSquare, color: 'text-violet-500', label: 'SMS' },
};

export function ReengagementScriptModal({ open, onClose, lead }: ReengagementScriptModalProps) {
  const [activeType, setActiveType] = useState<ScriptType>('call');
  const [generating, setGenerating] = useState(false);
  const [scripts, setScripts] = useState<GeneratedScript[]>(MOCK_SCRIPTS.default);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const activeScript = scripts.find((s) => s.type === activeType);

  const regenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    setScripts(MOCK_SCRIPTS.default);
    setGenerating(false);
  };

  const copyScript = (idx: number, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Re-engagement Scripts" size="xl">
      <div className="space-y-4">
        {/* Lead context */}
        {lead && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
            <User className="w-5 h-5 text-th-accent-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-th-text-primary">{lead.name}</p>
              <div className="flex items-center gap-3 text-[10px] text-th-text-tertiary">
                <span className="capitalize">{lead.stage}</span>
                <span>{lead.daysSinceContact}d stale</span>
                {lead.planInterest && <span>Interested in: {lead.planInterest}</span>}
              </div>
            </div>
            <button onClick={regenerate} disabled={generating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium disabled:opacity-50">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        )}

        {/* Script type tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          {scripts.map((s) => {
            const cfg = TYPE_CONFIG[s.type];
            return (
              <button key={s.type} onClick={() => setActiveType(s.type)} className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                activeType === s.type ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
              )}>
                <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Script content */}
        {activeScript && (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border-b border-th-border/50">
              <span className="text-xs font-semibold text-th-text-primary flex-1">{activeScript.title}</span>
              <button onClick={() => copyScript(scripts.indexOf(activeScript), activeScript.content)} className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                copiedIdx === scripts.indexOf(activeScript) ? 'text-green-500' : 'text-th-text-tertiary hover:text-th-text-secondary'
              )}>
                {copiedIdx === scripts.indexOf(activeScript) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedIdx === scripts.indexOf(activeScript) ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <p className="text-xs text-th-text-primary whitespace-pre-wrap leading-relaxed">{activeScript.content}</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <ThumbsUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">Re-engagement Tips</span>
          </div>
          <div className="space-y-1 text-[10px] text-th-text-secondary">
            <p>Lead with <strong>value</strong>, not a sales pitch. Share a helpful resource or market update.</p>
            <p>Reference something <strong>specific</strong> from your last conversation to show you remember them.</p>
            <p>Keep the first touchpoint <strong>low-pressure</strong> — your goal is a response, not a close.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
