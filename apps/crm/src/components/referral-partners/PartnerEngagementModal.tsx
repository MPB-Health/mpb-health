import { Modal } from '../Modal';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Mail, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const PARTNERS = [
  { name: 'Jane Roberts', score: 92, lastActivity: '1d ago', referralsThisMonth: 6, trend: 'up' as const, status: 'Highly Engaged', color: '#10b981' },
  { name: 'Tom Chen', score: 78, lastActivity: '3d ago', referralsThisMonth: 4, trend: 'stable' as const, status: 'Active', color: '#3b82f6' },
  { name: 'ADP Payroll', score: 85, lastActivity: '2d ago', referralsThisMonth: 3, trend: 'up' as const, status: 'Active', color: '#8b5cf6' },
  { name: 'Sarah Kim', score: 62, lastActivity: '8d ago', referralsThisMonth: 1, trend: 'down' as const, status: 'Cooling Off', color: '#f59e0b' },
  { name: 'Mike Johnson', score: 35, lastActivity: '22d ago', referralsThisMonth: 0, trend: 'down' as const, status: 'At Risk', color: '#ef4444' },
  { name: 'David Lee', score: 18, lastActivity: '45d ago', referralsThisMonth: 0, trend: 'down' as const, status: 'Disengaged', color: '#94a3b8' },
];

export function PartnerEngagementModal({ open, onClose }: Props) {
  const engaged = PARTNERS.filter((p) => p.score >= 60).length;
  const atRisk = PARTNERS.filter((p) => p.score < 40).length;

  return (
    <Modal open={open} onClose={onClose} title="Partner Engagement" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Activity className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{engaged}</p>
            <p className="text-[10px] text-th-text-tertiary">Engaged</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{atRisk}</p>
            <p className="text-[10px] text-th-text-tertiary">At Risk</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{Math.round(PARTNERS.reduce((s, p) => s + p.score, 0) / PARTNERS.length)}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {PARTNERS.map((p) => (
            <div key={p.name} className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>{p.score}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-th-text-primary">{p.name}</p>
                <div className="flex items-center gap-2 text-[9px] text-th-text-tertiary">
                  <span>{p.status}</span>
                  <span>•</span>
                  <span>Last: {p.lastActivity}</span>
                  <span>•</span>
                  <span>{p.referralsThisMonth} refs/mo</span>
                </div>
              </div>
              {p.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" /> : p.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" /> : null}
              {p.score < 40 && <button className="p-1 rounded text-amber-500 hover:bg-amber-500/10 shrink-0" title="Send re-engagement email"><Mail className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Engagement Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Mike Johnson</strong> (score 35) hasn't referred in 22 days. <strong>David Lee</strong> (score 18) is disengaged at 45 days. Schedule re-engagement calls this week.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
