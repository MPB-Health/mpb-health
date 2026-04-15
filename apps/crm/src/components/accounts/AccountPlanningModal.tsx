import { useState } from 'react';
import { Modal } from '../Modal';
import { Target, Users, Shield, DollarSign, CheckCircle2, Plus, Sparkles, Calendar, TrendingUp, Building2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AccountPlanningModalProps { open: boolean; onClose: () => void; accountName?: string; }

interface Objective { id: string; text: string; status: 'completed' | 'in_progress' | 'planned'; dueDate: string; }
interface Stakeholder { name: string; role: string; influence: 'high' | 'medium' | 'low'; sentiment: 'positive' | 'neutral' | 'negative'; }

const MOCK_OBJECTIVES: Objective[] = [
  { id: '1', text: 'Renew annual contract at 10% increase', status: 'in_progress', dueDate: '2026-06-30' },
  { id: '2', text: 'Cross-sell dental & vision coverage', status: 'planned', dueDate: '2026-08-15' },
  { id: '3', text: 'Onboard new division (Wellness Labs)', status: 'planned', dueDate: '2026-09-01' },
  { id: '4', text: 'Executive quarterly business review', status: 'completed', dueDate: '2026-03-31' },
  { id: '5', text: 'Migrate to new plan year rates', status: 'in_progress', dueDate: '2026-05-01' },
];

const MOCK_STAKEHOLDERS: Stakeholder[] = [
  { name: 'John Smith', role: 'VP of Benefits', influence: 'high', sentiment: 'positive' },
  { name: 'Sarah Jones', role: 'HR Director', influence: 'high', sentiment: 'positive' },
  { name: 'Mark Lee', role: 'CFO', influence: 'high', sentiment: 'neutral' },
  { name: 'Lisa Chen', role: 'Benefits Coordinator', influence: 'medium', sentiment: 'positive' },
  { name: 'Tom Brown', role: 'IT Director', influence: 'low', sentiment: 'neutral' },
];

const MOCK_COMPETITORS = [
  { name: 'United Health', threat: 'high', notes: 'Aggressive pricing on Medicare Advantage' },
  { name: 'Aetna', threat: 'medium', notes: 'Strong dental offering, weaker in supplemental' },
  { name: 'Cigna', threat: 'low', notes: 'Not active in this territory' },
];

const STATUS_CONFIG = {
  completed: { color: 'text-green-500 bg-green-500/10', label: 'Done' },
  in_progress: { color: 'text-blue-500 bg-blue-500/10', label: 'Active' },
  planned: { color: 'text-amber-500 bg-amber-500/10', label: 'Planned' },
};

const INFLUENCE_COLOR = { high: 'text-red-500 bg-red-500/10', medium: 'text-amber-500 bg-amber-500/10', low: 'text-green-500 bg-green-500/10' };
const SENTIMENT_COLOR = { positive: 'text-green-500', neutral: 'text-amber-500', negative: 'text-red-500' };

export function AccountPlanningModal({ open, onClose, accountName }: AccountPlanningModalProps) {
  const [tab, setTab] = useState<'objectives' | 'stakeholders' | 'competition'>('objectives');

  return (
    <Modal open={open} onClose={onClose} title={`Account Plan${accountName ? ` — ${accountName}` : ''}`} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_OBJECTIVES.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Objectives</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STAKEHOLDERS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Stakeholders</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <Shield className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_COMPETITORS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Competitors</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'objectives' as const, label: 'Objectives' }, { id: 'stakeholders' as const, label: 'Stakeholders' }, { id: 'competition' as const, label: 'Competition' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {tab === 'objectives' && (
            <div className="space-y-1.5">
              {MOCK_OBJECTIVES.map((obj) => (
                <div key={obj.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', STATUS_CONFIG[obj.status].color)}>
                    {obj.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Target className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-medium', obj.status === 'completed' ? 'text-th-text-tertiary line-through' : 'text-th-text-primary')}>{obj.text}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3 h-3 text-th-text-tertiary" />
                    <span className="text-[10px] text-th-text-tertiary">{obj.dueDate}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', STATUS_CONFIG[obj.status].color)}>{STATUS_CONFIG[obj.status].label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'stakeholders' && (
            <div className="space-y-1.5">
              {MOCK_STAKEHOLDERS.map((sh) => (
                <div key={sh.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-th-accent-500 to-th-accent-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {sh.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-th-text-primary">{sh.name}</p>
                    <p className="text-[10px] text-th-text-tertiary">{sh.role}</p>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', INFLUENCE_COLOR[sh.influence])}>
                    {sh.influence} influence
                  </span>
                  <span className={cn('text-[10px] font-medium', SENTIMENT_COLOR[sh.sentiment])}>
                    {sh.sentiment === 'positive' ? '👍' : sh.sentiment === 'neutral' ? '😐' : '👎'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'competition' && (
            <div className="space-y-2">
              {MOCK_COMPETITORS.map((comp) => (
                <div key={comp.name} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span className="text-sm font-medium text-th-text-primary">{comp.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                      comp.threat === 'high' ? 'bg-red-500/10 text-red-500' : comp.threat === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                    )}>{comp.threat} threat</span>
                  </div>
                  <p className="text-xs text-th-text-secondary ml-6">{comp.notes}</p>
                </div>
              ))}
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
