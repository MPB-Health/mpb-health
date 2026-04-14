import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Mail, Phone, MessageSquare, Clock, ChevronDown, ChevronRight,
  Play, Pause, Edit3, Save, Check, ArrowDown, Sparkles,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface CadenceStepPreview {
  id: string;
  delayHours: number;
  actionType: 'email' | 'call' | 'sms';
  description: string;
  emailSubject?: string;
  emailPreview?: string;
  callScript?: string;
  smsBody?: string;
}

interface CadencePreviewModalProps {
  open: boolean;
  onClose: () => void;
  cadenceName: string;
  steps?: CadenceStepPreview[];
  isActive?: boolean;
  onToggleActive?: () => void;
  onSaveSteps?: (steps: CadenceStepPreview[]) => Promise<void>;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  email: { icon: Mail, color: 'text-cyan-500', label: 'Email' },
  call: { icon: Phone, color: 'text-green-500', label: 'Call' },
  sms: { icon: MessageSquare, color: 'text-violet-500', label: 'SMS' },
};

const DEFAULT_STEPS: CadenceStepPreview[] = [
  { id: '1', delayHours: 0, actionType: 'email', description: 'Re-engagement email — check in and offer help',
    emailSubject: 'Hi {{first_name}}, it\'s been a while!',
    emailPreview: 'Hi {{first_name}},\n\nI noticed we haven\'t connected in a while, and I wanted to check in. Things change quickly in the health insurance world, and I want to make sure you still have the coverage that works best for you.\n\nAre you available for a quick call this week?\n\nBest,\n{{agent_name}}' },
  { id: '2', delayHours: 48, actionType: 'call', description: 'Follow-up call — personal touch',
    callScript: '1. Reference the email sent 2 days ago\n2. Ask about any changes in health needs\n3. Mention upcoming enrollment periods\n4. Offer a free plan review\n5. Schedule follow-up if interested' },
  { id: '3', delayHours: 120, actionType: 'email', description: 'Value-add email — share a relevant resource',
    emailSubject: '{{first_name}}, here\'s something I thought you\'d find helpful',
    emailPreview: 'Hi {{first_name}},\n\nI came across this guide on [Medicare changes for 2027 / ACA subsidy updates] and immediately thought of you.\n\n[Link to resource]\n\nIf you have any questions about how these changes might affect your coverage, I\'m happy to walk you through it.\n\n{{agent_name}}' },
  { id: '4', delayHours: 240, actionType: 'call', description: 'Second call attempt',
    callScript: '1. "Just wanted to make sure you got my emails"\n2. Briefly recap the value proposition\n3. Create urgency with enrollment deadline\n4. Ask for 15 minutes to do a plan comparison\n5. If no answer, leave voicemail + follow with SMS' },
  { id: '5', delayHours: 336, actionType: 'email', description: 'Final reactivation email — last chance offer',
    emailSubject: '{{first_name}}, one last thought before enrollment closes',
    emailPreview: 'Hi {{first_name}},\n\nI know life gets busy, so I\'ll keep this brief. Enrollment for [specific period] is closing soon, and I don\'t want you to miss out on potentially saving money on your coverage.\n\nIf you\'d like a no-obligation plan review, just reply to this email or call me at {{agent_phone}}.\n\nEither way, I wish you the best.\n\n{{agent_name}}' },
];

function formatDelay(hours: number) {
  if (hours === 0) return 'Immediately';
  if (hours < 24) return `${hours}h after enrollment`;
  return `Day ${Math.round(hours / 24)}`;
}

function cumulativeDay(steps: CadenceStepPreview[], idx: number) {
  return Math.round(steps[idx].delayHours / 24);
}

export function CadencePreviewModal({
  open, onClose, cadenceName, steps: propSteps, isActive = true, onToggleActive, onSaveSteps,
}: CadencePreviewModalProps) {
  const [steps] = useState<CadenceStepPreview[]>(propSteps || DEFAULT_STEPS);
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null);

  const totalDays = steps.length ? Math.round(steps[steps.length - 1].delayHours / 24) : 0;
  const emailSteps = steps.filter((s) => s.actionType === 'email').length;
  const callSteps = steps.filter((s) => s.actionType === 'call').length;
  const smsSteps = steps.filter((s) => s.actionType === 'sms').length;

  return (
    <Modal open={open} onClose={onClose} title={`Cadence Preview: ${cadenceName}`} size="xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          <div className="flex-1">
            <p className="text-sm font-semibold text-th-text-primary">{cadenceName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-th-text-tertiary">
              <span>{steps.length} steps over {totalDays} days</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-cyan-500" />{emailSteps}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-green-500" />{callSteps}</span>
              {smsSteps > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-violet-500" />{smsSteps}</span>}
            </div>
          </div>
          <button onClick={onToggleActive} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border',
            isActive ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-th-border text-th-text-tertiary'
          )}>
            {isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isActive ? 'Active' : 'Paused'}
          </button>
        </div>

        {/* Visual timeline */}
        <div className="max-h-[400px] overflow-y-auto">
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-th-border/50" />

            {steps.map((step, idx) => {
              const cfg = ACTION_CONFIG[step.actionType] || ACTION_CONFIG.email;
              const StepIcon = cfg.icon;
              const expanded = expandedStep === step.id;

              return (
                <div key={step.id} className="relative mb-3">
                  {/* Timeline node */}
                  <div className={cn('absolute left-0 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center bg-surface-primary z-10',
                    expanded ? 'border-th-accent-500' : 'border-th-border'
                  )} style={{ top: 10 }}>
                    <StepIcon className={cn('w-3.5 h-3.5', cfg.color)} />
                  </div>

                  {/* Delay indicator */}
                  {idx > 0 && (
                    <div className="absolute left-[38px] -top-1 text-[10px] text-th-text-tertiary flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> +{step.delayHours - (steps[idx - 1]?.delayHours || 0)}h wait
                    </div>
                  )}

                  {/* Step card */}
                  <div className={cn('ml-10 rounded-xl border transition-all', expanded ? 'border-th-accent-500/30' : 'border-th-border/50')}>
                    <button onClick={() => setExpandedStep(expanded ? null : step.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-th-text-primary">Step {idx + 1}</span>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', cfg.color, `bg-current/10`)}>{cfg.label}</span>
                          <span className="text-[10px] text-th-text-tertiary">{formatDelay(step.delayHours)}</span>
                        </div>
                        <p className="text-xs text-th-text-secondary mt-0.5">{step.description}</p>
                      </div>
                      {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-th-border/30">
                        {step.actionType === 'email' && step.emailPreview && (
                          <div className="rounded-lg bg-white dark:bg-gray-900 border border-th-border/50 p-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-th-border/30 mb-2">
                              <Mail className="w-3 h-3 text-th-text-tertiary" />
                              <span className="text-xs font-medium text-th-text-primary">{step.emailSubject}</span>
                            </div>
                            <p className="text-xs text-th-text-secondary whitespace-pre-wrap leading-relaxed">{step.emailPreview}</p>
                          </div>
                        )}
                        {step.actionType === 'call' && step.callScript && (
                          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                            <p className="text-[10px] font-semibold text-green-700 dark:text-green-300 mb-1.5">Call Script</p>
                            <p className="text-xs text-th-text-secondary whitespace-pre-wrap leading-relaxed">{step.callScript}</p>
                          </div>
                        )}
                        {step.actionType === 'sms' && step.smsBody && (
                          <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                            <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 mb-1.5">SMS Message</p>
                            <p className="text-xs text-th-text-secondary">{step.smsBody}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
