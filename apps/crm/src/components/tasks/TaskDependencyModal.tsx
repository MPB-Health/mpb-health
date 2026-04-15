import { Modal } from '../Modal';
import { GitBranch, CheckCircle2, Circle, Clock, AlertCircle, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const CHAINS = [
  {
    name: 'Brett Baker — Full Enrollment',
    lead: 'Brett Baker',
    steps: [
      { task: 'Initial follow-up call', status: 'done' as const },
      { task: 'Needs assessment meeting', status: 'done' as const },
      { task: 'Send personalized quote', status: 'current' as const },
      { task: 'Application review', status: 'blocked' as const, blocker: 'Waiting on quote acceptance' },
      { task: 'Document collection', status: 'pending' as const },
      { task: 'Submit to carrier', status: 'pending' as const },
    ],
    color: '#3b82f6',
  },
  {
    name: 'Acme Corp — Group Enrollment',
    lead: 'Acme Corp',
    steps: [
      { task: 'Initial contact', status: 'done' as const },
      { task: 'Group census request', status: 'done' as const },
      { task: 'Generate group quote', status: 'current' as const },
      { task: 'Present options to HR', status: 'pending' as const },
      { task: 'Collect employee enrollments', status: 'pending' as const },
      { task: 'Submit group application', status: 'pending' as const },
    ],
    color: '#10b981',
  },
  {
    name: 'TechStart LLC — Startup Bundle',
    lead: 'TechStart LLC',
    steps: [
      { task: 'Discovery call', status: 'done' as const },
      { task: 'Recommend plan mix', status: 'done' as const },
      { task: 'Application submitted', status: 'done' as const },
      { task: 'Collect missing docs', status: 'current' as const },
      { task: 'Final review & submit', status: 'blocked' as const, blocker: 'Missing 2 employee forms' },
    ],
    color: '#8b5cf6',
  },
];

const statusIcons = { done: CheckCircle2, current: Clock, blocked: AlertCircle, pending: Circle };
const statusColors = { done: 'text-green-500', current: 'text-blue-500', blocked: 'text-red-500', pending: 'text-th-text-tertiary' };

export function TaskDependencyModal({ open, onClose }: Props) {
  const totalBlocked = CHAINS.reduce((s, c) => s + c.steps.filter((st) => st.status === 'blocked').length, 0);

  return (
    <Modal open={open} onClose={onClose} title="Task Dependencies" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <GitBranch className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{CHAINS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Active Chains</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-th-border/30 text-center">
            <AlertCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalBlocked}</p>
            <p className="text-[10px] text-th-text-tertiary">Blocked</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{CHAINS.reduce((s, c) => s + c.steps.filter((st) => st.status === 'done').length, 0)}</p>
            <p className="text-[10px] text-th-text-tertiary">Completed Steps</p>
          </div>
        </div>

        {CHAINS.map((chain) => (
          <div key={chain.name} className="p-3 rounded-xl border border-th-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: chain.color }} />
              <span className="text-xs font-semibold text-th-text-primary">{chain.name}</span>
            </div>
            <div className="space-y-0.5 pl-3 border-l-2 border-th-border/30">
              {chain.steps.map((step, i) => {
                const Icon = statusIcons[step.status];
                return (
                  <div key={step.task} className="flex items-start gap-2 py-1">
                    <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', statusColors[step.status])} />
                    <div>
                      <p className={cn('text-[10px] font-medium', step.status === 'done' ? 'line-through text-th-text-tertiary' : step.status === 'blocked' ? 'text-red-500' : 'text-th-text-primary')}>{step.task}</p>
                      {'blocker' in step && step.blocker && <p className="text-[8px] text-red-400">Blocked: {step.blocker}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-700 dark:text-red-300">Dependency Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>2 task chains are blocked</strong>: Brett Baker is waiting on quote acceptance, TechStart is missing employee forms. Unblock these to move $55K+ in potential production forward.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
