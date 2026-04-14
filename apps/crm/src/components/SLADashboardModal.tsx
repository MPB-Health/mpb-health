import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Clock, AlertTriangle, CheckCircle2, TrendingUp, Users, BarChart3,
  ArrowRight, Filter, ChevronDown, ChevronRight, Zap, Target,
  Phone, Mail, Calendar, XCircle,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface SLAMetric {
  id: string;
  name: string;
  target: string;
  targetMinutes: number;
  current: number;
  met: number;
  total: number;
  trend: 'up' | 'down' | 'flat';
}

interface SLABreach {
  id: string;
  leadName: string;
  assignedAgent: string;
  slaType: string;
  breachTime: string;
  elapsedMinutes: number;
  targetMinutes: number;
  status: 'breached' | 'at_risk' | 'resolved';
}

interface SLADashboardModalProps {
  open: boolean;
  onClose: () => void;
  metrics?: SLAMetric[];
  breaches?: SLABreach[];
}

const MOCK_METRICS: SLAMetric[] = [
  { id: '1', name: 'First Response Time', target: '< 1 hour', targetMinutes: 60, current: 42, met: 89, total: 100, trend: 'up' },
  { id: '2', name: 'Lead Follow-Up', target: '< 4 hours', targetMinutes: 240, current: 195, met: 78, total: 100, trend: 'down' },
  { id: '3', name: 'Quote Delivery', target: '< 24 hours', targetMinutes: 1440, current: 1080, met: 92, total: 100, trend: 'up' },
  { id: '4', name: 'Callback Promise', target: '< 2 hours', targetMinutes: 120, current: 95, met: 85, total: 100, trend: 'flat' },
  { id: '5', name: 'Document Processing', target: '< 48 hours', targetMinutes: 2880, current: 2160, met: 95, total: 100, trend: 'up' },
];

const MOCK_BREACHES: SLABreach[] = [
  { id: '1', leadName: 'Patricia Moore', assignedAgent: 'Mike R.', slaType: 'First Response', breachTime: '2026-04-14T10:30:00', elapsedMinutes: 95, targetMinutes: 60, status: 'breached' },
  { id: '2', leadName: 'David Brown', assignedAgent: 'Lisa P.', slaType: 'Lead Follow-Up', breachTime: '2026-04-14T09:00:00', elapsedMinutes: 320, targetMinutes: 240, status: 'breached' },
  { id: '3', leadName: 'Jennifer White', assignedAgent: 'John D.', slaType: 'Quote Delivery', breachTime: '2026-04-14T08:00:00', elapsedMinutes: 1200, targetMinutes: 1440, status: 'at_risk' },
  { id: '4', leadName: 'Robert Chen', assignedAgent: 'Sarah K.', slaType: 'Callback Promise', breachTime: '2026-04-13T16:00:00', elapsedMinutes: 150, targetMinutes: 120, status: 'resolved' },
];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

export function SLADashboardModal({ open, onClose, metrics: propMetrics, breaches: propBreaches }: SLADashboardModalProps) {
  const metrics = propMetrics || MOCK_METRICS;
  const breaches = propBreaches || MOCK_BREACHES;
  const [filterStatus, setFilterStatus] = useState<'all' | 'breached' | 'at_risk'>('all');

  const filteredBreaches = useMemo(() => {
    if (filterStatus === 'all') return breaches.filter((b) => b.status !== 'resolved');
    return breaches.filter((b) => b.status === filterStatus);
  }, [breaches, filterStatus]);

  const overallCompliance = useMemo(() => {
    const total = metrics.reduce((s, m) => s + m.total, 0);
    const met = metrics.reduce((s, m) => s + m.met, 0);
    return total ? Math.round((met / total) * 100) : 0;
  }, [metrics]);

  return (
    <Modal open={open} onClose={onClose} title="SLA Performance Dashboard" size="2xl">
      <div className="space-y-4">
        {/* Overall compliance */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          <div className="w-16 h-16 relative shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-tertiary" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${overallCompliance} ${100 - overallCompliance}`}
                className={overallCompliance >= 90 ? 'text-green-500' : overallCompliance >= 70 ? 'text-amber-500' : 'text-red-500'} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-sm font-bold tabular-nums', overallCompliance >= 90 ? 'text-green-500' : overallCompliance >= 70 ? 'text-amber-500' : 'text-red-500')}>
                {overallCompliance}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-th-text-primary">Overall SLA Compliance</p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              {breaches.filter((b) => b.status === 'breached').length} active breaches · {breaches.filter((b) => b.status === 'at_risk').length} at risk
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="space-y-2">
          {metrics.map((metric) => {
            const pct = metric.total ? (metric.met / metric.total) * 100 : 0;
            const isGood = pct >= 90;
            const isBad = pct < 70;
            return (
              <div key={metric.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-th-border/50">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isGood ? 'bg-green-500/10' : isBad ? 'bg-red-500/10' : 'bg-amber-500/10'
                )}>
                  {isGood ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                   isBad ? <XCircle className="w-4 h-4 text-red-500" /> :
                   <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-th-text-primary">{metric.name}</span>
                    <span className="text-[10px] text-th-text-tertiary">{metric.target}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className={cn('h-full rounded-full', isGood ? 'bg-green-500' : isBad ? 'bg-red-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={cn('text-[10px] font-bold tabular-nums', isGood ? 'text-green-500' : isBad ? 'text-red-500' : 'text-amber-500')}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-th-text-primary tabular-nums">{formatDuration(metric.current)} avg</p>
                  <p className="text-[10px] text-th-text-tertiary">{metric.met}/{metric.total} met</p>
                </div>
                <div className="shrink-0">
                  {metric.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> :
                   metric.trend === 'down' ? <TrendingUp className="w-3.5 h-3.5 text-red-500 rotate-180" /> :
                   <ArrowRight className="w-3.5 h-3.5 text-th-text-tertiary" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Breaches */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-th-text-secondary">Active Breaches & At-Risk</span>
            <div className="flex-1" />
            {(['all', 'breached', 'at_risk'] as const).map((f) => (
              <button key={f} onClick={() => setFilterStatus(f)} className={cn(
                'px-2 py-1 rounded-lg text-[10px] font-medium',
                filterStatus === f ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary'
              )}>{f === 'all' ? 'All' : f === 'breached' ? 'Breached' : 'At Risk'}</button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {filteredBreaches.map((breach) => (
              <div key={breach.id} className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg border',
                breach.status === 'breached' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'
              )}>
                <div className={cn('w-2 h-2 rounded-full shrink-0', breach.status === 'breached' ? 'bg-red-500 animate-pulse' : 'bg-amber-500')} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-th-text-primary">{breach.leadName}</span>
                  <span className="text-[10px] text-th-text-tertiary ml-1.5">{breach.slaType} · {breach.assignedAgent}</span>
                </div>
                <span className={cn('text-[10px] font-bold tabular-nums', breach.status === 'breached' ? 'text-red-500' : 'text-amber-500')}>
                  {formatDuration(breach.elapsedMinutes)} / {formatDuration(breach.targetMinutes)}
                </span>
              </div>
            ))}
            {filteredBreaches.length === 0 && (
              <p className="text-xs text-th-text-tertiary text-center py-4">No active breaches</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
