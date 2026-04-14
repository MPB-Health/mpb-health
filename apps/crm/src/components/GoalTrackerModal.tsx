import { useState } from 'react';
import { Modal } from './Modal';
import {
  Target, TrendingUp, Trophy, Flame, Plus, Edit3, Save,
  Trash2, Calendar, BarChart3, Star, Check, Clock, Zap,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Goal {
  id: string;
  name: string;
  metric: string;
  target: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  milestones: { label: string; value: number; reached: boolean }[];
  streak: number;
}

interface GoalTrackerModalProps {
  open: boolean;
  onClose: () => void;
  goals?: Goal[];
  onSave?: (goals: Goal[]) => Promise<void>;
}

const MOCK_GOALS: Goal[] = [
  { id: '1', name: 'Monthly Enrollments', metric: 'enrollments', target: 20, current: 14, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30',
    milestones: [{ label: 'Bronze', value: 10, reached: true }, { label: 'Silver', value: 15, reached: false }, { label: 'Gold', value: 20, reached: false }], streak: 12 },
  { id: '2', name: 'Weekly Outbound Calls', metric: 'calls', target: 50, current: 38, period: 'weekly', startDate: '2026-04-14', endDate: '2026-04-18',
    milestones: [{ label: '25 calls', value: 25, reached: true }, { label: '40 calls', value: 40, reached: false }, { label: '50 calls', value: 50, reached: false }], streak: 5 },
  { id: '3', name: 'Quarterly Revenue', metric: 'revenue', target: 50000, current: 34500, period: 'quarterly', startDate: '2026-04-01', endDate: '2026-06-30',
    milestones: [{ label: '$25K', value: 25000, reached: true }, { label: '$40K', value: 40000, reached: false }, { label: '$50K', value: 50000, reached: false }], streak: 3 },
  { id: '4', name: 'Daily Lead Follow-Ups', metric: 'follow_ups', target: 10, current: 7, period: 'daily', startDate: '2026-04-14', endDate: '2026-04-14',
    milestones: [{ label: '5 done', value: 5, reached: true }, { label: '8 done', value: 8, reached: false }, { label: '10 done', value: 10, reached: false }], streak: 8 },
];

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function daysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

export function GoalTrackerModal({ open, onClose, goals: propGoals, onSave }: GoalTrackerModalProps) {
  const [goals, setGoals] = useState<Goal[]>(propGoals || MOCK_GOALS);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalStreak = Math.max(...goals.map((g) => g.streak), 0);
  const completedGoals = goals.filter((g) => g.current >= g.target).length;

  const addGoal = () => {
    const newGoal: Goal = {
      id: String(Date.now()), name: '', metric: 'enrollments', target: 10, current: 0, period: 'monthly',
      startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      milestones: [], streak: 0,
    };
    setGoals((prev) => [...prev, newGoal]);
    setEditing(newGoal.id);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave?.(goals); onClose(); }
    catch { /* parent */ }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Personal Goal Tracker" size="xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-th-border/30 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalStreak} days</p>
            <p className="text-[10px] text-th-text-tertiary">Best Streak</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Trophy className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{completedGoals}/{goals.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Goals Hit</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-th-border/30 text-center">
            <Star className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">
              {goals.reduce((s, g) => s + g.milestones.filter((m) => m.reached).length, 0)}
            </p>
            <p className="text-[10px] text-th-text-tertiary">Milestones Hit</p>
          </div>
        </div>

        {/* Goals list */}
        <div className="max-h-[360px] overflow-y-auto space-y-3">
          {goals.map((goal) => {
            const pct = goal.target ? Math.min(100, (goal.current / goal.target) * 100) : 0;
            const isComplete = pct >= 100;
            const isEditing = editing === goal.id;

            return (
              <div key={goal.id} className={cn('rounded-xl border transition-all', isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-th-border/50')}>
                <div className="px-4 py-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input type="text" value={goal.name} onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                        placeholder="Goal name..." className="w-full text-sm font-semibold rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                      <div className="grid grid-cols-3 gap-2">
                        <select value={goal.metric} onChange={(e) => updateGoal(goal.id, { metric: e.target.value })}
                          className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          {['enrollments', 'calls', 'emails', 'meetings', 'revenue', 'follow_ups', 'deals'].map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input type="number" value={goal.target} onChange={(e) => updateGoal(goal.id, { target: Number(e.target.value) })} placeholder="Target"
                          className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
                        <select value={goal.period} onChange={(e) => updateGoal(goal.id, { period: e.target.value as Goal['period'] })}
                          className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(null)} className="flex-1 py-1.5 rounded-lg bg-th-accent-500/10 text-xs font-medium text-th-accent-500">Done</button>
                        <button onClick={() => removeGoal(goal.id)} className="px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className={cn('w-4 h-4 shrink-0', isComplete ? 'text-green-500' : 'text-th-accent-500')} />
                        <span className="text-sm font-semibold text-th-text-primary flex-1">{goal.name || '(Unnamed)'}</span>
                        {goal.streak > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-medium"><Flame className="w-3 h-3" />{goal.streak}d</span>
                        )}
                        <span className="text-[10px] text-th-text-tertiary capitalize">{goal.period}</span>
                        <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5"><Clock className="w-3 h-3" />{daysLeft(goal.endDate)}d</span>
                        <button onClick={() => setEditing(goal.id)} className="p-1 text-th-text-tertiary hover:text-th-text-secondary"><Edit3 className="w-3 h-3" /></button>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-3 rounded-full bg-surface-tertiary overflow-hidden relative">
                          <div className={cn('h-full rounded-full transition-all', isComplete ? 'bg-green-500' : 'bg-th-accent-500')} style={{ width: `${pct}%` }} />
                          {goal.milestones.map((m) => {
                            const mPct = goal.target ? (m.value / goal.target) * 100 : 0;
                            return (
                              <div key={m.label} className="absolute top-0 h-full" style={{ left: `${mPct}%` }}>
                                <div className={cn('w-0.5 h-full', m.reached ? 'bg-green-500' : 'bg-th-text-tertiary/30')} />
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-sm font-bold text-th-text-primary tabular-nums shrink-0">
                          {formatNum(goal.current)}/{formatNum(goal.target)}
                        </span>
                        <span className={cn('text-xs font-bold tabular-nums', isComplete ? 'text-green-500' : 'text-th-accent-500')}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div className="flex gap-2">
                          {goal.milestones.map((m) => (
                            <span key={m.label} className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              m.reached ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-surface-tertiary text-th-text-tertiary'
                            )}>
                              {m.reached && <Check className="w-2.5 h-2.5 inline mr-0.5" />}{m.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={addGoal} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Plus className="w-4 h-4" /> Add Goal
          </button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
