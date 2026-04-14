import { useState } from 'react';
import { Modal } from '../Modal';
import { Users, Plus, Trash2, ArrowRight, MapPin, Globe, Star, Shuffle, UserPlus, BarChart3 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface RoutingRule {
  id: string; name: string; strategy: 'round_robin' | 'weighted' | 'territory' | 'skill_based';
  stage: string; criteria: string; assignees: { name: string; weight?: number }[];
  enabled: boolean;
}

interface LeadRoutingModalProps { open: boolean; onClose: () => void; }

const MOCK_AGENTS = [
  { name: 'Julia Smith', role: 'Senior Agent', activeLeads: 42, capacity: 60, avatar: 'JS' },
  { name: 'Mark Davis', role: 'Agent', activeLeads: 38, capacity: 50, avatar: 'MD' },
  { name: 'Sarah Johnson', role: 'Agent', activeLeads: 28, capacity: 50, avatar: 'SJ' },
  { name: 'Tom Wilson', role: 'Junior Agent', activeLeads: 15, capacity: 40, avatar: 'TW' },
];

const MOCK_RULES: RoutingRule[] = [
  { id: '1', name: 'New leads — Round Robin', strategy: 'round_robin', stage: 'New', criteria: 'All new leads', assignees: [{ name: 'Julia Smith' }, { name: 'Mark Davis' }, { name: 'Sarah Johnson' }], enabled: true },
  { id: '2', name: 'High-value — Weighted', strategy: 'weighted', stage: 'Qualified', criteria: 'Score > 70', assignees: [{ name: 'Julia Smith', weight: 50 }, { name: 'Mark Davis', weight: 30 }, { name: 'Sarah Johnson', weight: 20 }], enabled: true },
  { id: '3', name: 'Florida territory', strategy: 'territory', stage: 'New', criteria: 'State = FL', assignees: [{ name: 'Sarah Johnson' }], enabled: true },
  { id: '4', name: 'Medicare specialty', strategy: 'skill_based', stage: 'New', criteria: 'Coverage = Medicare', assignees: [{ name: 'Julia Smith' }, { name: 'Tom Wilson' }], enabled: false },
];

const STRATEGY_CONFIG = {
  round_robin: { icon: Shuffle, label: 'Round Robin', color: 'text-blue-500 bg-blue-500/10' },
  weighted: { icon: BarChart3, label: 'Weighted', color: 'text-violet-500 bg-violet-500/10' },
  territory: { icon: MapPin, label: 'Territory', color: 'text-green-500 bg-green-500/10' },
  skill_based: { icon: Star, label: 'Skill-Based', color: 'text-amber-500 bg-amber-500/10' },
};

export function LeadRoutingModal({ open, onClose }: LeadRoutingModalProps) {
  const [rules, setRules] = useState(MOCK_RULES);
  const [tab, setTab] = useState<'rules' | 'agents'>('rules');

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Modal open={open} onClose={onClose} title="Lead Routing Rules" size="xl">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'rules' as const, label: 'Routing Rules' }, { id: 'agents' as const, label: 'Agent Capacity' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {tab === 'rules' && (
            <div className="space-y-2">
              {rules.map((rule) => {
                const strat = STRATEGY_CONFIG[rule.strategy];
                const StratIcon = strat.icon;
                return (
                  <div key={rule.id} className={cn(
                    'p-3 rounded-xl border transition-all',
                    rule.enabled ? 'border-th-border/50 bg-surface-primary' : 'border-th-border/30 bg-surface-secondary/30 opacity-60'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', strat.color)}>
                        <StratIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-th-text-primary">{rule.name}</p>
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', strat.color)}>{strat.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-th-text-tertiary">{rule.criteria}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-th-text-tertiary" />
                          <div className="flex items-center gap-1">
                            {rule.assignees.map((a) => (
                              <span key={a.name} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">
                                {a.name.split(' ').map((n) => n[0]).join('')}
                                {a.weight ? ` ${a.weight}%` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => toggleRule(rule.id)}
                        className={cn('w-9 h-5 rounded-full transition-colors relative shrink-0', rule.enabled ? 'bg-green-500' : 'bg-surface-tertiary')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow', rule.enabled ? 'left-4' : 'left-0.5')} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-500 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'agents' && (
            <div className="space-y-2">
              {MOCK_AGENTS.map((agent) => {
                const utilization = (agent.activeLeads / agent.capacity) * 100;
                return (
                  <div key={agent.name} className="p-3 rounded-xl border border-th-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-th-accent-500 to-th-accent-600 flex items-center justify-center text-white text-xs font-bold">
                        {agent.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-th-text-primary">{agent.name}</p>
                          <span className="text-[10px] text-th-text-tertiary">{agent.role}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                            <div className={cn('h-full rounded-full', utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-amber-500' : 'bg-green-500')}
                              style={{ width: `${utilization}%` }} />
                          </div>
                          <span className="text-[10px] text-th-text-tertiary tabular-nums">{agent.activeLeads}/{agent.capacity}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-sm font-bold tabular-nums', utilization > 80 ? 'text-red-500' : utilization > 60 ? 'text-amber-500' : 'text-green-500')}>{utilization.toFixed(0)}%</p>
                        <p className="text-[10px] text-th-text-tertiary">Utilization</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
