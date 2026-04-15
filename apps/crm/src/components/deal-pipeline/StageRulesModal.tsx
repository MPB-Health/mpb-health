import { useState } from 'react';
import { Modal } from '../Modal';
import { Zap, Plus, Bell, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageRulesModalProps { open: boolean; onClose: () => void; stageNames: string[]; }

interface Rule { id: string; name: string; stage: string; trigger: string; action: string; enabled: boolean; }

const MOCK_RULES: Rule[] = [
  { id: '1', name: 'Auto-alert on stale', stage: 'Proposal', trigger: 'No activity for 7 days', action: 'Notify deal owner', enabled: true },
  { id: '2', name: 'Require contact before proposal', stage: 'Proposal', trigger: 'Deal enters stage', action: 'Require primary contact', enabled: true },
  { id: '3', name: 'Auto-task for new qualifications', stage: 'Qualification', trigger: 'Deal enters stage', action: 'Create follow-up task (2 days)', enabled: true },
  { id: '4', name: 'Escalate high-value negotiations', stage: 'Negotiation', trigger: 'Amount > $50,000', action: 'Notify sales manager', enabled: false },
  { id: '5', name: 'Close date warning', stage: 'All Stages', trigger: 'Close date within 7 days', action: 'Send reminder to owner', enabled: true },
];

export function StageRulesModal({ open, onClose, stageNames }: StageRulesModalProps) {
  const [rules, setRules] = useState(MOCK_RULES);
  const activeCount = rules.filter((r) => r.enabled).length;

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Automation Rules" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Zap className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{rules.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Rules</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{activeCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Active</p>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className={cn('p-3 rounded-xl border transition-all', rule.enabled ? 'border-th-border/50' : 'border-th-border/20 opacity-60')}>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} className="sr-only peer" />
                  <div className="w-8 h-4.5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:bg-th-accent-500 transition-colors">
                    <div className={cn('absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform', rule.enabled && 'translate-x-3.5')} />
                  </div>
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-th-text-primary">{rule.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{rule.stage}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-th-text-tertiary">{rule.trigger}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-th-text-tertiary" />
                    <span className="text-[10px] text-th-accent-500 font-medium">{rule.action}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Automation Tip</span>
          </div>
          <p className="text-xs text-th-text-secondary">Enable the "Escalate high-value negotiations" rule to ensure deals over $50K get management attention at the right time.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
