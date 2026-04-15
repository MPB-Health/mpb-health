import { useState } from 'react';
import { Modal } from '../Modal';
import { Heart, CheckCircle2, AlertTriangle, XCircle, Building2, TrendingUp, Sparkles, DollarSign, Users, Clock, Mail, Phone } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AccountHealth {
  id: string; name: string; score: number;
  factors: { name: string; score: number; max: number; status: 'good' | 'warning' | 'critical' }[];
  trend: 'up' | 'down' | 'stable';
}

interface AccountHealthScoreModalProps { open: boolean; onClose: () => void; onNavigateToAccount?: (id: string) => void; }

const MOCK_ACCOUNTS: AccountHealth[] = [
  { id: '1', name: 'Acme Health Group', score: 92, trend: 'up', factors: [
    { name: 'Engagement', score: 9, max: 10, status: 'good' }, { name: 'Revenue', score: 10, max: 10, status: 'good' },
    { name: 'Satisfaction', score: 8, max: 10, status: 'good' }, { name: 'Growth', score: 9, max: 10, status: 'good' },
  ]},
  { id: '2', name: 'BlueCross Partners', score: 78, trend: 'stable', factors: [
    { name: 'Engagement', score: 7, max: 10, status: 'good' }, { name: 'Revenue', score: 8, max: 10, status: 'good' },
    { name: 'Satisfaction', score: 7, max: 10, status: 'good' }, { name: 'Growth', score: 6, max: 10, status: 'warning' },
  ]},
  { id: '3', name: 'Medicare Solutions Inc', score: 64, trend: 'down', factors: [
    { name: 'Engagement', score: 5, max: 10, status: 'warning' }, { name: 'Revenue', score: 7, max: 10, status: 'good' },
    { name: 'Satisfaction', score: 6, max: 10, status: 'warning' }, { name: 'Growth', score: 4, max: 10, status: 'critical' },
  ]},
  { id: '4', name: 'Senior Care Alliance', score: 45, trend: 'down', factors: [
    { name: 'Engagement', score: 3, max: 10, status: 'critical' }, { name: 'Revenue', score: 5, max: 10, status: 'warning' },
    { name: 'Satisfaction', score: 4, max: 10, status: 'critical' }, { name: 'Growth', score: 3, max: 10, status: 'critical' },
  ]},
  { id: '5', name: 'Wellness First Corp', score: 85, trend: 'up', factors: [
    { name: 'Engagement', score: 9, max: 10, status: 'good' }, { name: 'Revenue', score: 8, max: 10, status: 'good' },
    { name: 'Satisfaction', score: 8, max: 10, status: 'good' }, { name: 'Growth', score: 8, max: 10, status: 'good' },
  ]},
];

function getGrade(score: number) {
  if (score >= 85) return { letter: 'A', color: 'text-green-500', bg: 'bg-green-500' };
  if (score >= 70) return { letter: 'B', color: 'text-blue-500', bg: 'bg-blue-500' };
  if (score >= 55) return { letter: 'C', color: 'text-amber-500', bg: 'bg-amber-500' };
  if (score >= 40) return { letter: 'D', color: 'text-orange-500', bg: 'bg-orange-500' };
  return { letter: 'F', color: 'text-red-500', bg: 'bg-red-500' };
}

const STATUS_ICON = { good: CheckCircle2, warning: AlertTriangle, critical: XCircle };
const STATUS_COLOR = { good: 'text-green-500', warning: 'text-amber-500', critical: 'text-red-500' };

export function AccountHealthScoreModal({ open, onClose, onNavigateToAccount }: AccountHealthScoreModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const avgScore = Math.round(MOCK_ACCOUNTS.reduce((s, a) => s + a.score, 0) / MOCK_ACCOUNTS.length);
  const atRisk = MOCK_ACCOUNTS.filter((a) => a.score < 60).length;
  const healthy = MOCK_ACCOUNTS.filter((a) => a.score >= 70).length;

  return (
    <Modal open={open} onClose={onClose} title="Account Health Scores" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Heart className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{avgScore}/100</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Health Score</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{healthy}</p>
            <p className="text-[10px] text-th-text-tertiary">Healthy (70+)</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{atRisk}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk (&lt;60)</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {MOCK_ACCOUNTS.map((acct) => {
            const grade = getGrade(acct.score);
            const isExpanded = expandedId === acct.id;
            return (
              <div key={acct.id} className="rounded-xl border border-th-border/50 overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : acct.id)}
                  className="w-full text-left p-3 flex items-center gap-3 hover:bg-surface-secondary/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm', grade.bg)}>
                    {grade.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary truncate">{acct.name}</span>
                      {acct.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {acct.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden max-w-[120px]">
                        <div className={cn('h-full rounded-full', grade.bg)} style={{ width: `${acct.score}%` }} />
                      </div>
                      <span className={cn('text-xs font-bold tabular-nums', grade.color)}>{acct.score}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onNavigateToAccount?.(acct.id); }}
                    className="text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium shrink-0">View</button>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-th-border/30 bg-surface-secondary/20">
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {acct.factors.map((f) => {
                        const FIcon = STATUS_ICON[f.status];
                        return (
                          <div key={f.name} className="text-center">
                            <FIcon className={cn('w-3 h-3 mx-auto mb-0.5', STATUS_COLOR[f.status])} />
                            <p className="text-xs font-bold text-th-text-primary tabular-nums">{f.score}/{f.max}</p>
                            <p className="text-[9px] text-th-text-tertiary">{f.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Health Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Senior Care Alliance</strong> health dropped 15 points this month. Engagement is critically low — schedule a check-in call this week.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
