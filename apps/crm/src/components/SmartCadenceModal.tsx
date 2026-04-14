import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Sparkles, Mail, Phone, MessageSquare, Clock, ArrowRight, Plus,
  Trash2, GripVertical, Play, Pause, BarChart3, Users, Target,
  Zap, TrendingUp, Send, Calendar, Edit3, Check,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type ChannelType = 'email' | 'sms' | 'call' | 'linkedin' | 'wait';

interface CadenceStep {
  id: string;
  channel: ChannelType;
  delay: number;
  delayUnit: 'hours' | 'days';
  subject?: string;
  content?: string;
  aiOptimized: boolean;
  bestTimeEnabled: boolean;
}

interface CadencePerformance {
  enrolled: number;
  completed: number;
  replied: number;
  meetings: number;
  optedOut: number;
}

interface SmartCadenceModalProps {
  open: boolean;
  onClose: () => void;
  cadenceName?: string;
  steps?: CadenceStep[];
  performance?: CadencePerformance;
  targetLeadCount?: number;
  onSave?: (steps: CadenceStep[]) => Promise<void>;
  onActivate?: () => Promise<void>;
}

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  email: { icon: Mail, color: 'text-cyan-500', label: 'Email', bg: 'bg-cyan-500/10' },
  sms: { icon: MessageSquare, color: 'text-green-500', label: 'SMS', bg: 'bg-green-500/10' },
  call: { icon: Phone, color: 'text-amber-500', label: 'Call', bg: 'bg-amber-500/10' },
  linkedin: { icon: Users, color: 'text-blue-500', label: 'LinkedIn', bg: 'bg-blue-500/10' },
  wait: { icon: Clock, color: 'text-th-text-tertiary', label: 'Wait', bg: 'bg-surface-tertiary' },
};

const DEFAULT_STEPS: CadenceStep[] = [
  { id: '1', channel: 'email', delay: 0, delayUnit: 'days', subject: 'Welcome & Introduction', aiOptimized: true, bestTimeEnabled: true },
  { id: '2', channel: 'wait', delay: 2, delayUnit: 'days', aiOptimized: false, bestTimeEnabled: false },
  { id: '3', channel: 'call', delay: 0, delayUnit: 'hours', subject: 'Follow-up call', aiOptimized: false, bestTimeEnabled: true },
  { id: '4', channel: 'wait', delay: 3, delayUnit: 'days', aiOptimized: false, bestTimeEnabled: false },
  { id: '5', channel: 'email', delay: 0, delayUnit: 'days', subject: 'Value proposition & plan options', aiOptimized: true, bestTimeEnabled: true },
  { id: '6', channel: 'wait', delay: 2, delayUnit: 'days', aiOptimized: false, bestTimeEnabled: false },
  { id: '7', channel: 'sms', delay: 0, delayUnit: 'hours', subject: 'Quick check-in', aiOptimized: true, bestTimeEnabled: true },
  { id: '8', channel: 'wait', delay: 5, delayUnit: 'days', aiOptimized: false, bestTimeEnabled: false },
  { id: '9', channel: 'email', delay: 0, delayUnit: 'days', subject: 'Final follow-up & booking link', aiOptimized: true, bestTimeEnabled: true },
];

const MOCK_PERF: CadencePerformance = { enrolled: 142, completed: 89, replied: 34, meetings: 12, optedOut: 5 };

export function SmartCadenceModal({
  open, onClose, cadenceName = 'New Smart Cadence', steps: initialSteps, performance = MOCK_PERF, targetLeadCount = 0, onSave, onActivate,
}: SmartCadenceModalProps) {
  const [steps, setSteps] = useState<CadenceStep[]>(initialSteps || DEFAULT_STEPS);
  const [name, setName] = useState(cadenceName);
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'builder' | 'performance' | 'ai'>('builder');

  const addStep = (channel: ChannelType) => {
    setSteps((prev) => [...prev, {
      id: String(Date.now()),
      channel,
      delay: channel === 'wait' ? 2 : 0,
      delayUnit: 'days',
      subject: channel === 'wait' ? undefined : '',
      aiOptimized: channel !== 'wait',
      bestTimeEnabled: channel !== 'wait',
    }]);
  };

  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

  const updateStep = (id: string, updates: Partial<CadenceStep>) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const totalDays = useMemo(() => {
    return steps.reduce((sum, s) => {
      if (s.channel === 'wait') return sum + (s.delayUnit === 'hours' ? s.delay / 24 : s.delay);
      return sum;
    }, 0);
  }, [steps]);

  const touchpoints = steps.filter((s) => s.channel !== 'wait').length;
  const aiSteps = steps.filter((s) => s.aiOptimized).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(steps);
      onClose();
    } catch { /* parent handles */ }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Smart Outreach Orchestrator" size="2xl">
      <div className="space-y-4">
        {/* Cadence name */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              autoFocus className="text-lg font-bold text-th-text-primary bg-transparent border-b-2 border-th-accent-500 focus:outline-none" />
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-2 text-lg font-bold text-th-text-primary hover:text-th-accent-500 transition-colors">
              {name} <Edit3 className="w-4 h-4 text-th-text-tertiary" />
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500" />{aiSteps} AI-optimized</span>
            <span>{touchpoints} touchpoints</span>
            <span>{Math.ceil(totalDays)} days</span>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Enrolled', value: performance.enrolled, icon: Users, color: 'text-blue-500' },
            { label: 'Completed', value: performance.completed, icon: Check, color: 'text-green-500' },
            { label: 'Replied', value: performance.replied, icon: MessageSquare, color: 'text-violet-500' },
            { label: 'Meetings', value: performance.meetings, icon: Calendar, color: 'text-amber-500' },
            { label: 'Opted Out', value: performance.optedOut, icon: Pause, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
              <s.icon className={cn('w-3.5 h-3.5 mx-auto mb-0.5', s.color)} />
              <p className="text-sm font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          {[
            { id: 'builder' as const, label: 'Sequence Builder', icon: Edit3 },
            { id: 'performance' as const, label: 'Performance', icon: BarChart3 },
            { id: 'ai' as const, label: 'AI Optimization', icon: Sparkles },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {tab === 'builder' && (
            <div className="space-y-1">
              {steps.map((step, idx) => {
                const cfg = CHANNEL_CONFIG[step.channel];
                const Icon = cfg.icon;
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center w-6 shrink-0">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', cfg.bg)}>
                        <Icon className={cn('w-3 h-3', cfg.color)} />
                      </div>
                      {idx < steps.length - 1 && <div className="w-px h-4 bg-th-border/50" />}
                    </div>

                    <div className={cn(
                      'flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                      step.channel === 'wait' ? 'border-dashed border-th-border/50 bg-surface-secondary/30' : 'border-th-border/50 hover:border-th-accent-500/30'
                    )}>
                      <GripVertical className="w-3.5 h-3.5 text-th-text-tertiary cursor-grab shrink-0" />
                      <span className={cn('text-xs font-medium shrink-0', cfg.color)}>{cfg.label}</span>

                      {step.channel === 'wait' ? (
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={1} value={step.delay} onChange={(e) => updateStep(step.id, { delay: Number(e.target.value) || 1 })}
                            className="w-12 text-xs text-center rounded-lg border border-th-border/50 bg-surface-primary px-1 py-1 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
                          <select value={step.delayUnit} onChange={(e) => updateStep(step.id, { delayUnit: e.target.value as 'hours' | 'days' })}
                            className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-1.5 py-1 focus:border-th-accent-500/50 focus:outline-none">
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                        </div>
                      ) : (
                        <input type="text" value={step.subject || ''} onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                          placeholder={`${cfg.label} subject...`}
                          className="flex-1 text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1 focus:border-th-accent-500/50 focus:outline-none" />
                      )}

                      {step.channel !== 'wait' && (
                        <button onClick={() => updateStep(step.id, { aiOptimized: !step.aiOptimized })}
                          title="AI Optimize" className={cn('p-1 rounded', step.aiOptimized ? 'text-violet-500 bg-violet-500/10' : 'text-th-text-tertiary')}>
                          <Sparkles className="w-3 h-3" />
                        </button>
                      )}
                      {step.channel !== 'wait' && (
                        <button onClick={() => updateStep(step.id, { bestTimeEnabled: !step.bestTimeEnabled })}
                          title="Best Send Time" className={cn('p-1 rounded', step.bestTimeEnabled ? 'text-amber-500 bg-amber-500/10' : 'text-th-text-tertiary')}>
                          <Clock className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => removeStep(step.id)} className="p-1 text-th-text-tertiary hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add step buttons */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-th-text-tertiary">Add:</span>
                {(Object.keys(CHANNEL_CONFIG) as ChannelType[]).map((ch) => {
                  const cfg = CHANNEL_CONFIG[ch];
                  const Icon = cfg.icon;
                  return (
                    <button key={ch} onClick={() => addStep(ch)} className={cn(
                      'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-th-border/50 hover:border-th-accent-500/30 transition-colors',
                      'text-th-text-secondary hover:text-th-text-primary'
                    )}>
                      <Icon className={cn('w-3 h-3', cfg.color)} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-surface-secondary/50 border border-th-border/30">
                <p className="text-xs font-semibold text-th-text-secondary mb-3">Step-by-Step Funnel</p>
                <div className="space-y-2">
                  {steps.filter((s) => s.channel !== 'wait').map((step, idx) => {
                    const cfg = CHANNEL_CONFIG[step.channel];
                    const Icon = cfg.icon;
                    const pct = Math.max(10, 100 - idx * 18);
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 w-24 shrink-0">
                          <Icon className={cn('w-3 h-3', cfg.color)} />
                          <span className="text-xs text-th-text-secondary truncate">{step.subject || cfg.label}</span>
                        </div>
                        <div className="flex-1 h-5 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', cfg.bg.replace('/10', '/40'))} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-th-text-secondary tabular-nums w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-th-border/30">
                  <p className="text-[10px] text-th-text-tertiary uppercase tracking-wider mb-1">Avg Reply Time</p>
                  <p className="text-lg font-bold text-th-text-primary">2.4 days</p>
                </div>
                <div className="p-3 rounded-xl border border-th-border/30">
                  <p className="text-[10px] text-th-text-tertiary uppercase tracking-wider mb-1">Meeting Conversion</p>
                  <p className="text-lg font-bold text-green-500 tabular-nums">8.5%</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <p className="text-sm font-semibold text-th-text-primary">AI Recommendations</p>
                </div>
                <div className="space-y-2">
                  {[
                    { text: 'Best send time for your audience: Tuesdays and Thursdays, 9-11am local time', icon: Clock, color: 'text-amber-500' },
                    { text: 'Subject lines with questions get 23% higher open rates for your segment', icon: Mail, color: 'text-cyan-500' },
                    { text: 'Adding a call step after 2nd email increases reply rate by 40%', icon: Phone, color: 'text-green-500' },
                    { text: 'Leads responding to SMS convert 2.1x faster than email-only cadences', icon: MessageSquare, color: 'text-blue-500' },
                    { text: 'Shorten wait between steps 3-4 from 3 days to 2 days based on engagement data', icon: TrendingUp, color: 'text-violet-500' },
                  ].map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/50 dark:bg-white/5">
                      <rec.icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', rec.color)} />
                      <p className="text-xs text-th-text-secondary">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl border border-violet-500/30 text-sm font-medium text-violet-500 hover:bg-violet-500/5 flex items-center justify-center gap-2 transition-colors">
                <Sparkles className="w-4 h-4" /> Auto-Optimize All Steps
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Play className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Activate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
