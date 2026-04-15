import { useState } from 'react';
import { Modal } from '../Modal';
import { Zap, Plus, Play, Pause, Sparkles, Target, Calendar, Users, Mail } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const RULES = [
  { id: '1', name: 'New Lead → Follow-up Call', trigger: 'Lead created', action: 'Create "Follow-up call" task due in 1h', active: true, triggered: 128, icon: Target, color: '#3b82f6' },
  { id: '2', name: 'Quote Sent → Check-in', trigger: 'Quote status → Sent', action: 'Create "Quote follow-up" task due in 2 days', active: true, triggered: 42, icon: Mail, color: '#10b981' },
  { id: '3', name: 'Event Ended → Follow-up', trigger: 'Community event date passed', action: 'Create "Event follow-up" tasks for all contacts', active: true, triggered: 18, icon: Calendar, color: '#8b5cf6' },
  { id: '4', name: 'Overdue → Escalate', trigger: 'Task overdue by 3+ days', action: 'Notify manager and reassign to senior rep', active: false, triggered: 8, icon: Users, color: '#f59e0b' },
  { id: '5', name: 'Partner Referral → Fast Track', trigger: 'Lead source = Referral Partner', action: 'Create priority task due in 30min', active: true, triggered: 34, icon: Zap, color: '#ef4444' },
];

export function TaskAutomationModal({ open, onClose }: Props) {
  const [rules, setRules] = useState(RULES);
  const toggleRule = (id: string) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));

  return (
    <Modal open={open} onClose={onClose} title="Task Automation Rules" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Zap className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{rules.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Rules</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Play className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{rules.filter((r) => r.active).length}</p>
            <p className="text-[10px] text-th-text-tertiary">Active</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{rules.reduce((s, r) => s + r.triggered, 0)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Triggered</p>
          </div>
        </div>

        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className={cn('p-3 rounded-xl border', r.active ? 'border-th-border/50' : 'border-th-border/20 opacity-50')}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: r.color + '15' }}>
                  <r.icon className="w-4 h-4" style={{ color: r.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-th-text-primary">{r.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">Triggered {r.triggered} times</p>
                </div>
                <button onClick={() => toggleRule(r.id)} className={cn('w-8 h-4 rounded-full transition-colors relative', r.active ? 'bg-green-500' : 'bg-gray-300')}>
                  <div className={cn('w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all', r.active ? 'right-0.5' : 'left-0.5')} />
                </button>
              </div>
              <div className="pl-9 space-y-0.5">
                <p className="text-[9px] text-th-text-tertiary"><strong className="text-th-text-secondary">When:</strong> {r.trigger}</p>
                <p className="text-[9px] text-th-text-tertiary"><strong className="text-th-text-secondary">Then:</strong> {r.action}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-th-border text-sm font-medium text-th-text-tertiary hover:border-th-accent-500/50 hover:text-th-accent-500">
          <Plus className="w-4 h-4" /> Create Automation Rule
        </button>

        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Automation Tip</span></div>
          <p className="text-xs text-th-text-secondary">Your automations have created <strong>230 tasks automatically</strong> this month. The <strong>New Lead → Follow-up</strong> rule alone saved ~21 hours of manual work. Enable the "Overdue → Escalate" rule to prevent lead decay.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
