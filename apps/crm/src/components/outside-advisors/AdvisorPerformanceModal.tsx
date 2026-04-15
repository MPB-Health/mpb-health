import { Modal } from '../Modal';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Mail, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const ADVISORS = [
  { name: 'Maria Santos', score: 95, lastActivity: '1d ago', casesThisMonth: 5, trend: 'up' as const, status: 'Top Performer', color: '#10b981' },
  { name: 'James Wilson', score: 88, lastActivity: '2d ago', casesThisMonth: 3, trend: 'up' as const, status: 'Strong', color: '#3b82f6' },
  { name: 'Linda Chen', score: 82, lastActivity: '3d ago', casesThisMonth: 3, trend: 'stable' as const, status: 'Strong', color: '#8b5cf6' },
  { name: 'David Park', score: 75, lastActivity: '5d ago', casesThisMonth: 2, trend: 'stable' as const, status: 'Active', color: '#f59e0b' },
  { name: 'Rachel Green', score: 58, lastActivity: '12d ago', casesThisMonth: 1, trend: 'down' as const, status: 'Slowing', color: '#f97316' },
  { name: 'Kevin Brown', score: 32, lastActivity: '28d ago', casesThisMonth: 0, trend: 'down' as const, status: 'At Risk', color: '#ef4444' },
  { name: 'Amy Foster', score: 15, lastActivity: '52d ago', casesThisMonth: 0, trend: 'down' as const, status: 'Inactive', color: '#94a3b8' },
];

export function AdvisorPerformanceModal({ open, onClose }: Props) {
  const strong = ADVISORS.filter((a) => a.score >= 70).length;
  const atRisk = ADVISORS.filter((a) => a.score < 40).length;

  return (
    <Modal open={open} onClose={onClose} title="Advisor Performance Scoring" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Activity className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{strong}</p>
            <p className="text-[10px] text-th-text-tertiary">Strong Performers</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{atRisk}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{Math.round(ADVISORS.reduce((s, a) => s + a.score, 0) / ADVISORS.length)}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {ADVISORS.map((a) => (
            <div key={a.name} className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: a.color }}>{a.score}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-th-text-primary">{a.name}</p>
                <div className="flex items-center gap-2 text-[9px] text-th-text-tertiary">
                  <span>{a.status}</span><span>•</span><span>Last: {a.lastActivity}</span><span>•</span><span>{a.casesThisMonth} cases/mo</span>
                </div>
              </div>
              {a.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : a.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" /> : null}
              {a.score < 40 && <button className="p-1 rounded text-amber-500 hover:bg-amber-500/10 shrink-0" title="Send re-engagement email"><Mail className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Performance Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Kevin Brown</strong> (score 32) hasn't submitted a case in 28 days. <strong>Amy Foster</strong> (score 15) is inactive at 52 days. Schedule performance review calls.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
