import { useState } from 'react';
import { Modal } from '../Modal';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Save, Plus, Trash2, DollarSign, Users, Flame } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StageGoal { stage: string; color: string; targetLeads: number; currentLeads: number; targetConversion: number; currentConversion: number; }
interface PipelineGoalsModalProps { open: boolean; onClose: () => void; }

const MOCK_GOALS: StageGoal[] = [
  { stage: 'New', color: '#3b82f6', targetLeads: 120, currentLeads: 98, targetConversion: 75, currentConversion: 72 },
  { stage: 'Contacted', color: '#8b5cf6', targetLeads: 80, currentLeads: 64, targetConversion: 65, currentConversion: 58 },
  { stage: 'Qualified', color: '#f59e0b', targetLeads: 50, currentLeads: 42, targetConversion: 70, currentConversion: 65 },
  { stage: 'Proposal', color: '#ef4444', targetLeads: 35, currentLeads: 28, targetConversion: 75, currentConversion: 71 },
  { stage: 'Negotiation', color: '#10b981', targetLeads: 25, currentLeads: 18, targetConversion: 80, currentConversion: 78 },
  { stage: 'Won', color: '#22c55e', targetLeads: 20, currentLeads: 14, targetConversion: 100, currentConversion: 100 },
];

const MONTHLY_TARGETS = [
  { label: 'Revenue Target', target: '$450k', current: '$312k', pct: 69, icon: DollarSign, color: 'text-green-500 from-green-500/10 to-emerald-500/10' },
  { label: 'Lead Target', target: '150', current: '98', pct: 65, icon: Users, color: 'text-blue-500 from-blue-500/10 to-sky-500/10' },
  { label: 'Close Rate Target', target: '15%', current: '14.3%', pct: 95, icon: Target, color: 'text-violet-500 from-violet-500/10 to-purple-500/10' },
  { label: 'Monthly Streak', target: '3 months', current: '2 months', pct: 67, icon: Flame, color: 'text-orange-500 from-orange-500/10 to-amber-500/10' },
];

export function PipelineGoalsModal({ open, onClose }: PipelineGoalsModalProps) {
  const [goals, setGoals] = useState(MOCK_GOALS);
  const daysInMonth = 30;
  const daysPassed = 14;
  const pace = daysPassed / daysInMonth;

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Goals" size="xl">
      <div className="space-y-4">
        {/* Monthly progress bar */}
        <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-th-text-primary">April 2026 Progress</span>
            <span className="text-[10px] text-th-text-tertiary">Day {daysPassed} of {daysInMonth}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <div className="h-full rounded-full bg-th-accent-500" style={{ width: `${pace * 100}%` }} />
          </div>
        </div>

        {/* Top-level targets */}
        <div className="grid grid-cols-4 gap-2">
          {MONTHLY_TARGETS.map((t) => {
            const onTrack = t.pct >= (pace * 100);
            return (
              <div key={t.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', t.color.split(' ').slice(1).join(' '))}>
                <div className="flex items-center gap-1.5 mb-1">
                  <t.icon className={cn('w-3.5 h-3.5', t.color.split(' ')[0])} />
                  {onTrack ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                </div>
                <p className="text-lg font-bold text-th-text-primary tabular-nums">{t.current}</p>
                <p className="text-[10px] text-th-text-tertiary">of {t.target} — {t.pct}%</p>
                <div className="h-1 rounded-full bg-surface-tertiary/50 overflow-hidden mt-1">
                  <div className={cn('h-full rounded-full', onTrack ? 'bg-green-500' : 'bg-amber-500')} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-stage goals */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Stage</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Target</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Current</th>
                <th className="text-center px-3 py-2 font-medium text-th-text-tertiary">Progress</th>
                <th className="text-center px-3 py-2 font-medium text-th-text-tertiary">Conversion</th>
                <th className="text-center px-3 py-2 font-medium text-th-text-tertiary">Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const pct = (g.currentLeads / g.targetLeads) * 100;
                const onTrack = pct >= (pace * 100);
                return (
                  <tr key={g.stage} className="border-t border-th-border/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="font-medium text-th-text-primary">{g.stage}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 text-th-text-secondary tabular-nums">{g.targetLeads}</td>
                    <td className="text-right px-3 py-2.5 font-bold text-th-text-primary tabular-nums">{g.currentLeads}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-16 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className={cn('h-full rounded-full', onTrack ? 'bg-green-500' : 'bg-amber-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="tabular-nums text-th-text-secondary">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span className={cn('tabular-nums font-medium', g.currentConversion >= g.targetConversion ? 'text-green-500' : 'text-amber-500')}>
                        {g.currentConversion}%<span className="text-th-text-tertiary">/{g.targetConversion}%</span>
                      </span>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      {onTrack ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">On Track</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">Behind</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save Goals
          </button>
        </div>
      </div>
    </Modal>
  );
}
