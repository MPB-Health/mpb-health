import { useState } from 'react';
import { Modal } from '../Modal';
import { Heart, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, Sparkles, ArrowRight, Clock, Users, Target, DollarSign, Zap, Shield } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface HealthFactor { id: string; name: string; score: number; maxScore: number; status: 'good' | 'warning' | 'critical'; insight: string; icon: typeof Heart; }
interface PipelineHealthScoreModalProps { open: boolean; onClose: () => void; }

const MOCK_FACTORS: HealthFactor[] = [
  { id: 'velocity', name: 'Pipeline Velocity', score: 7, maxScore: 10, status: 'good', insight: 'Leads are moving through stages at a healthy pace', icon: Zap },
  { id: 'coverage', name: 'Pipeline Coverage', score: 6, maxScore: 10, status: 'warning', insight: 'Coverage ratio is 2.1x — aim for 3x+ your quota', icon: Shield },
  { id: 'balance', name: 'Stage Balance', score: 8, maxScore: 10, status: 'good', insight: 'Good distribution across stages with no major gaps', icon: Users },
  { id: 'conversion', name: 'Conversion Rates', score: 5, maxScore: 10, status: 'warning', insight: 'New → Contacted drop-off is 28% — above the 20% benchmark', icon: Target },
  { id: 'freshness', name: 'Lead Freshness', score: 4, maxScore: 10, status: 'critical', insight: '6 leads stuck >14 days — action needed', icon: Clock },
  { id: 'value', name: 'Deal Value Health', score: 7, maxScore: 10, status: 'good', insight: 'Average deal value trending up 8% month-over-month', icon: DollarSign },
  { id: 'engagement', name: 'Lead Engagement', score: 6, maxScore: 10, status: 'warning', insight: '15% of leads have had no activity in the last 7 days', icon: Heart },
  { id: 'forecast', name: 'Forecast Accuracy', score: 8, maxScore: 10, status: 'good', insight: 'Last month forecast was within 5% of actual close rate', icon: TrendingUp },
];

const STATUS_CONFIG = {
  good: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Good' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Needs Attention' },
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical' },
};

function getOverallGrade(score: number): { letter: string; color: string; label: string } {
  if (score >= 85) return { letter: 'A', color: 'text-green-500', label: 'Excellent' };
  if (score >= 70) return { letter: 'B', color: 'text-blue-500', label: 'Good' };
  if (score >= 55) return { letter: 'C', color: 'text-amber-500', label: 'Fair' };
  if (score >= 40) return { letter: 'D', color: 'text-orange-500', label: 'Poor' };
  return { letter: 'F', color: 'text-red-500', label: 'Critical' };
}

export function PipelineHealthScoreModal({ open, onClose }: PipelineHealthScoreModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalScore = MOCK_FACTORS.reduce((s, f) => s + f.score, 0);
  const maxScore = MOCK_FACTORS.reduce((s, f) => s + f.maxScore, 0);
  const pctScore = (totalScore / maxScore) * 100;
  const grade = getOverallGrade(pctScore);

  const goodCount = MOCK_FACTORS.filter((f) => f.status === 'good').length;
  const warningCount = MOCK_FACTORS.filter((f) => f.status === 'warning').length;
  const criticalCount = MOCK_FACTORS.filter((f) => f.status === 'critical').length;

  return (
    <Modal open={open} onClose={onClose} title="Pipeline Health Score" size="xl">
      <div className="space-y-4">
        {/* Overall score */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-surface-secondary/80 to-surface-primary border border-th-border/30">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-tertiary" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                className={grade.color} strokeDasharray={`${pctScore * 2.64} ${264 - pctScore * 2.64}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-black', grade.color)}>{grade.letter}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-th-text-primary">{grade.label} Pipeline Health</p>
            <p className="text-sm text-th-text-secondary">{totalScore}/{maxScore} points ({pctScore.toFixed(0)}%)</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px]"><CheckCircle2 className="w-3 h-3 text-green-500" /> {goodCount} good</span>
              <span className="flex items-center gap-1 text-[10px]"><AlertTriangle className="w-3 h-3 text-amber-500" /> {warningCount} attention</span>
              <span className="flex items-center gap-1 text-[10px]"><XCircle className="w-3 h-3 text-red-500" /> {criticalCount} critical</span>
            </div>
          </div>
        </div>

        {/* Factor cards */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {MOCK_FACTORS.map((factor) => {
            const StatusIcon = STATUS_CONFIG[factor.status].icon;
            const pct = (factor.score / factor.maxScore) * 100;
            return (
              <button key={factor.id} onClick={() => setExpandedId(expandedId === factor.id ? null : factor.id)}
                className="w-full text-left p-3 rounded-xl border border-th-border/50 hover:bg-surface-secondary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STATUS_CONFIG[factor.status].bg)}>
                    <factor.icon className={cn('w-4 h-4', STATUS_CONFIG[factor.status].color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{factor.name}</span>
                      <StatusIcon className={cn('w-3 h-3', STATUS_CONFIG[factor.status].color)} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                        <div className={cn('h-full rounded-full', factor.status === 'good' ? 'bg-green-500' : factor.status === 'warning' ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-th-text-tertiary tabular-nums">{factor.score}/{factor.maxScore}</span>
                    </div>
                  </div>
                </div>
                {expandedId === factor.id && (
                  <div className="mt-2 pl-11">
                    <p className="text-xs text-th-text-secondary">{factor.insight}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Top 3 Actions to Improve</span>
          </div>
          <div className="space-y-1.5 text-xs text-th-text-secondary">
            <p><strong>1.</strong> Address 6 stuck leads immediately — they're dragging down your freshness score</p>
            <p><strong>2.</strong> Improve New → Contacted conversion by reducing first-contact time to under 1 hour</p>
            <p><strong>3.</strong> Add 12 more qualified leads to reach 3x pipeline coverage</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
