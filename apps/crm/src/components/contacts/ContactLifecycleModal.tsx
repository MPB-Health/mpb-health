import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowRight, Users, CheckCircle2, Clock, TrendingUp, Sparkles, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface LifecycleStage { name: string; count: number; avgDays: number; color: string; }
interface ContactLifecycleModalProps { open: boolean; onClose: () => void; }

const MOCK_STAGES: LifecycleStage[] = [
  { name: 'Lead', count: 342, avgDays: 0, color: '#3b82f6' },
  { name: 'Contacted', count: 246, avgDays: 3.2, color: '#8b5cf6' },
  { name: 'Qualified', count: 158, avgDays: 7.5, color: '#f59e0b' },
  { name: 'Converted', count: 98, avgDays: 12.8, color: '#10b981' },
  { name: 'Customer', count: 72, avgDays: 18.4, color: '#22c55e' },
  { name: 'Advocate', count: 24, avgDays: 45.2, color: '#06b6d4' },
];

const MOCK_COHORTS = [
  { month: 'Jan', started: 56, converted: 18, rate: 32.1, avgDays: 22 },
  { month: 'Feb', started: 48, converted: 16, rate: 33.3, avgDays: 19 },
  { month: 'Mar', started: 62, converted: 24, rate: 38.7, avgDays: 16 },
  { month: 'Apr', started: 34, converted: 12, rate: 35.3, avgDays: 14 },
];

export function ContactLifecycleModal({ open, onClose }: ContactLifecycleModalProps) {
  const [tab, setTab] = useState<'funnel' | 'cohorts'>('funnel');
  const maxCount = MOCK_STAGES[0]?.count || 1;
  const overallConversion = ((MOCK_STAGES[MOCK_STAGES.length - 1].count / maxCount) * 100).toFixed(1);

  return (
    <Modal open={open} onClose={onClose} title="Contact Lifecycle" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{maxCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Leads</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{overallConversion}%</p>
            <p className="text-[10px] text-th-text-tertiary">Overall Conversion</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STAGES.reduce((s, st) => s + st.avgDays, 0).toFixed(0)}d</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Full Cycle</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'funnel' as const, label: 'Lifecycle Funnel' }, { id: 'cohorts' as const, label: 'Monthly Cohorts' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'funnel' && (
          <div className="space-y-0">
            {MOCK_STAGES.map((stage, idx) => {
              const widthPct = (stage.count / maxCount) * 100;
              const prevCount = idx > 0 ? MOCK_STAGES[idx - 1].count : stage.count;
              const convRate = prevCount ? ((stage.count / prevCount) * 100).toFixed(0) : '100';
              const dropOff = prevCount - stage.count;
              return (
                <div key={stage.name}>
                  {idx > 0 && (
                    <div className="flex items-center gap-2 py-1 px-4">
                      <ArrowRight className="w-3 h-3 text-th-text-tertiary rotate-90" />
                      <span className="text-[10px] text-green-500 font-medium">{convRate}%</span>
                      {dropOff > 0 && <span className="text-[10px] text-red-500">({dropOff} lost)</span>}
                      {stage.avgDays > 0 && <span className="text-[10px] text-th-text-tertiary ml-auto">{stage.avgDays}d avg</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-th-text-secondary w-20 text-right">{stage.name}</span>
                    <div className="flex-1 relative">
                      <div className="h-8 rounded-lg overflow-hidden flex items-center" style={{ width: `${Math.max(widthPct, 8)}%`, backgroundColor: stage.color + '20' }}>
                        <div className="h-full rounded-lg flex items-center px-3" style={{ width: '100%', backgroundColor: stage.color + '40' }}>
                          <span className="text-xs font-bold text-th-text-primary tabular-nums">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'cohorts' && (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Month</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Started</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Converted</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Avg Days</th>
              </tr></thead>
              <tbody>
                {MOCK_COHORTS.map((c) => (
                  <tr key={c.month} className="border-t border-th-border/30">
                    <td className="px-3 py-2.5 font-medium text-th-text-primary">{c.month} 2026</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{c.started}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums font-bold text-green-500">{c.converted}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{c.rate}%</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-th-text-secondary">{c.avgDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Lifecycle Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">March cohort has the highest conversion at <strong>38.7%</strong> with fastest cycle time (16 days). Analyze what worked that month to replicate.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
