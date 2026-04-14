import { useState } from 'react';
import { Modal } from '../Modal';
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Users, Zap } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface VelocityStage { stage: string; color: string; avgDays: number; medianDays: number; p90Days: number; trend: 'improving' | 'worsening' | 'stable'; benchmark: number; }
interface StuckLead { id: string; name: string; stage: string; daysInStage: number; lastActivity: string; }
interface PipelineVelocityModalProps { open: boolean; onClose: () => void; onNavigateToLead?: (id: string) => void; }

const MOCK_VELOCITY: VelocityStage[] = [
  { stage: 'New', color: '#3b82f6', avgDays: 2.1, medianDays: 1.5, p90Days: 5, trend: 'improving', benchmark: 1 },
  { stage: 'Contacted', color: '#8b5cf6', avgDays: 4.5, medianDays: 3.2, p90Days: 12, trend: 'stable', benchmark: 3 },
  { stage: 'Qualified', color: '#f59e0b', avgDays: 6.8, medianDays: 5.1, p90Days: 18, trend: 'worsening', benchmark: 5 },
  { stage: 'Proposal', color: '#ef4444', avgDays: 3.2, medianDays: 2.8, p90Days: 8, trend: 'improving', benchmark: 3 },
  { stage: 'Negotiation', color: '#10b981', avgDays: 5.1, medianDays: 4.0, p90Days: 14, trend: 'stable', benchmark: 5 },
];

const MOCK_STUCK: StuckLead[] = [
  { id: '1', name: 'Patricia Moore', stage: 'Qualified', daysInStage: 22, lastActivity: '2026-03-25' },
  { id: '2', name: 'David Brown', stage: 'Qualified', daysInStage: 18, lastActivity: '2026-03-29' },
  { id: '3', name: 'Robert Chen', stage: 'Contacted', daysInStage: 15, lastActivity: '2026-04-01' },
  { id: '4', name: 'Jennifer White', stage: 'Negotiation', daysInStage: 16, lastActivity: '2026-03-30' },
  { id: '5', name: 'Susan Thompson', stage: 'Proposal', daysInStage: 12, lastActivity: '2026-04-03' },
];

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: 'text-green-500', label: 'Improving' },
  stable: { icon: ArrowRight, color: 'text-amber-500', label: 'Stable' },
  worsening: { icon: TrendingDown, color: 'text-red-500', label: 'Slowing' },
};

export function PipelineVelocityModal({ open, onClose, onNavigateToLead }: PipelineVelocityModalProps) {
  const [tab, setTab] = useState<'velocity' | 'stuck'>('velocity');
  const totalAvgDays = MOCK_VELOCITY.reduce((s, v) => s + v.avgDays, 0);

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Velocity" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalAvgDays.toFixed(0)}d</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Full Cycle</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STUCK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Stuck Leads</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Zap className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">Proposal</p>
            <p className="text-[10px] text-th-text-tertiary">Fastest Stage</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'velocity' as const, label: 'Stage Velocity' }, { id: 'stuck' as const, label: `Stuck Leads (${MOCK_STUCK.length})` }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {tab === 'velocity' && (
            <div className="space-y-3">
              {MOCK_VELOCITY.map((v) => {
                const TrendIcon = TREND_CONFIG[v.trend].icon;
                const overBenchmark = v.avgDays > v.benchmark;
                return (
                  <div key={v.stage} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-th-text-primary">{v.stage}</span>
                        <TrendIcon className={cn('w-3 h-3', TREND_CONFIG[v.trend].color)} />
                        <span className={cn('text-[10px] font-medium', TREND_CONFIG[v.trend].color)}>{TREND_CONFIG[v.trend].label}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className={cn('h-full rounded-full', overBenchmark ? 'bg-red-500/60' : 'bg-green-500/60')}
                            style={{ width: `${Math.min(100, (v.avgDays / (v.benchmark * 3)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{v.avgDays}d</p><p className="text-[9px] text-th-text-tertiary">Avg</p></div>
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{v.medianDays}d</p><p className="text-[9px] text-th-text-tertiary">Median</p></div>
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{v.p90Days}d</p><p className="text-[9px] text-th-text-tertiary">P90</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stuck' && (
            <div className="space-y-1.5">
              {MOCK_STUCK.map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-th-text-primary">{lead.name}</span>
                    <span className="text-[10px] text-th-text-tertiary ml-1.5">{lead.stage}</span>
                  </div>
                  <span className="text-xs font-bold text-red-500 tabular-nums">{lead.daysInStage}d stuck</span>
                  <button onClick={() => onNavigateToLead?.(lead.id)}
                    className="text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium">View</button>
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
