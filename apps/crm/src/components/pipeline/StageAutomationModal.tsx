import { useState } from 'react';
import { Modal } from '../Modal';
import { Zap, Plus, Trash2, ArrowRight, Mail, Phone, MessageSquare, Bell, Tag, Users, CheckCircle2, Clock } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AutoRule {
  id: string; name: string;
  trigger: { type: 'enters' | 'exits' | 'stays'; stage: string; days?: number };
  actions: { type: string; label: string; icon: string }[];
  enabled: boolean;
}

interface StageAutomationModalProps { open: boolean; onClose: () => void; }

const ACTION_OPTIONS = [
  { type: 'send_email', label: 'Send Email', icon: Mail },
  { type: 'create_task', label: 'Create Task', icon: CheckCircle2 },
  { type: 'send_sms', label: 'Send SMS', icon: MessageSquare },
  { type: 'notify_owner', label: 'Notify Owner', icon: Bell },
  { type: 'add_tag', label: 'Add Tag', icon: Tag },
  { type: 'assign_to', label: 'Reassign', icon: Users },
  { type: 'schedule_call', label: 'Schedule Call', icon: Phone },
  { type: 'wait', label: 'Wait', icon: Clock },
];

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const MOCK_RULES: AutoRule[] = [
  { id: '1', name: 'Welcome sequence on new leads', trigger: { type: 'enters', stage: 'New' }, actions: [{ type: 'send_email', label: 'Welcome Email', icon: 'mail' }, { type: 'create_task', label: 'Initial Outreach', icon: 'task' }], enabled: true },
  { id: '2', name: 'Stuck in Qualified alert', trigger: { type: 'stays', stage: 'Qualified', days: 7 }, actions: [{ type: 'notify_owner', label: 'Slack Alert', icon: 'bell' }], enabled: true },
  { id: '3', name: 'Won celebration + onboarding', trigger: { type: 'enters', stage: 'Won' }, actions: [{ type: 'send_email', label: 'Congrats Email', icon: 'mail' }, { type: 'create_task', label: 'Onboarding Steps', icon: 'task' }, { type: 'notify_owner', label: 'Team Notification', icon: 'bell' }], enabled: false },
  { id: '4', name: 'Lost follow-up nurture', trigger: { type: 'enters', stage: 'Lost' }, actions: [{ type: 'add_tag', label: 'lost-lead', icon: 'tag' }, { type: 'send_email', label: 'Stay in Touch', icon: 'mail' }], enabled: true },
];

export function StageAutomationModal({ open, onClose }: StageAutomationModalProps) {
  const [rules, setRules] = useState(MOCK_RULES);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState<'enters' | 'exits' | 'stays'>('enters');
  const [newStage, setNewStage] = useState('New');
  const [newDays, setNewDays] = useState(7);
  const [newActions, setNewActions] = useState<string[]>([]);

  const toggleAction = (type: string) => {
    setNewActions((prev) => prev.includes(type) ? prev.filter((a) => a !== type) : [...prev, type]);
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const saveNew = () => {
    if (!newName.trim() || newActions.length === 0) return;
    const rule: AutoRule = {
      id: String(Date.now()),
      name: newName,
      trigger: { type: newTrigger, stage: newStage, ...(newTrigger === 'stays' ? { days: newDays } : {}) },
      actions: newActions.map((a) => {
        const opt = ACTION_OPTIONS.find((o) => o.type === a);
        return { type: a, label: opt?.label || a, icon: a };
      }),
      enabled: true,
    };
    setRules((prev) => [rule, ...prev]);
    setCreating(false);
    setNewName('');
    setNewActions([]);
  };

  return (
    <Modal open={open} onClose={onClose} title="Stage Automation Rules" size="xl">
      <div className="space-y-4">
        {!creating ? (
          <button onClick={() => setCreating(true)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-th-border/50 text-sm font-medium text-th-text-tertiary hover:border-th-accent-500/50 hover:text-th-accent-500 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Automation Rule
          </button>
        ) : (
          <div className="p-3 rounded-xl border border-th-accent-500/30 bg-th-accent-500/5 space-y-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rule name..."
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-th-text-tertiary">When lead</span>
              <select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value as 'enters' | 'exits' | 'stays')}
                className="text-xs rounded-xl border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:outline-none">
                <option value="enters">enters</option>
                <option value="exits">exits</option>
                <option value="stays">stays in</option>
              </select>
              <select value={newStage} onChange={(e) => setNewStage(e.target.value)}
                className="text-xs rounded-xl border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:outline-none">
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {newTrigger === 'stays' && (
                <>
                  <span className="text-xs text-th-text-tertiary">for</span>
                  <input type="number" value={newDays} onChange={(e) => setNewDays(Number(e.target.value))} min={1}
                    className="w-14 text-xs rounded-xl border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:outline-none" />
                  <span className="text-xs text-th-text-tertiary">days</span>
                </>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-th-text-secondary mb-1.5">Then:</p>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_OPTIONS.map((opt) => (
                  <button key={opt.type} onClick={() => toggleAction(opt.type)} className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    newActions.includes(opt.type) ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                  )}>
                    <opt.icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCreating(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-th-text-tertiary">Cancel</button>
              <button onClick={saveNew} disabled={!newName.trim() || newActions.length === 0}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-th-accent-500 text-white hover:bg-th-accent-600 disabled:opacity-50">
                Save Rule
              </button>
            </div>
          </div>
        )}

        {/* Existing rules */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className={cn(
              'p-3 rounded-xl border transition-all',
              rule.enabled ? 'border-th-border/50 bg-surface-primary' : 'border-th-border/30 bg-surface-secondary/30 opacity-60'
            )}>
              <div className="flex items-center gap-3">
                <Zap className={cn('w-4 h-4 shrink-0', rule.enabled ? 'text-amber-500' : 'text-th-text-tertiary')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-th-text-primary">{rule.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">
                      {rule.trigger.type === 'stays' ? `Stays in ${rule.trigger.stage} for ${rule.trigger.days}d` : `${rule.trigger.type === 'enters' ? 'Enters' : 'Exits'} ${rule.trigger.stage}`}
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-th-text-tertiary" />
                    {rule.actions.map((a, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-th-accent-500/10 text-th-accent-500">{a.label}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => toggleRule(rule.id)}
                  className={cn('w-9 h-5 rounded-full transition-colors relative', rule.enabled ? 'bg-green-500' : 'bg-surface-tertiary')}>
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow', rule.enabled ? 'left-4' : 'left-0.5')} />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
