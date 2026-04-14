import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Phone,
  Mail, Clock, ArrowRight, RefreshCw, CheckCircle2, XCircle,
  Calendar, Target, Sparkles,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ChannelMetric {
  channel: string;
  icon: React.ElementType;
  color: string;
  sent: number;
  responded: number;
  converted: number;
  avgResponseDays: number;
}

interface PeriodStats {
  totalStale: number;
  enrolled: number;
  reengaged: number;
  converted: number;
  revenueRecovered: number;
  avgDaysToReengage: number;
  winBackRate: number;
  bestDay: string;
  bestTime: string;
}

interface ReactivationAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  staleLeadCount?: number;
}

const MOCK_STATS: PeriodStats = {
  totalStale: 247, enrolled: 156, reengaged: 68, converted: 23,
  revenueRecovered: 41200, avgDaysToReengage: 8.4, winBackRate: 14.7,
  bestDay: 'Tuesday', bestTime: '10:00 AM',
};

const MOCK_CHANNELS: ChannelMetric[] = [
  { channel: 'Email', icon: Mail, color: 'text-cyan-500', sent: 312, responded: 89, converted: 15, avgResponseDays: 2.3 },
  { channel: 'Phone Call', icon: Phone, color: 'text-green-500', sent: 156, responded: 52, converted: 18, avgResponseDays: 0.5 },
  { channel: 'SMS', icon: ArrowRight, color: 'text-violet-500', sent: 98, responded: 34, converted: 6, avgResponseDays: 1.1 },
];

const MOCK_WEEKLY_TREND = [
  { week: 'W1', enrolled: 28, reengaged: 8 },
  { week: 'W2', enrolled: 35, reengaged: 12 },
  { week: 'W3', enrolled: 42, reengaged: 15 },
  { week: 'W4', enrolled: 31, reengaged: 18 },
  { week: 'W5', enrolled: 20, reengaged: 15 },
];

const STAGE_BREAKDOWN = [
  { stage: 'new', count: 89, pct: 36 },
  { stage: 'contacted', count: 64, pct: 26 },
  { stage: 'qualified', count: 42, pct: 17 },
  { stage: 'proposal', count: 31, pct: 13 },
  { stage: 'negotiation', count: 21, pct: 8 },
];

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function ReactivationAnalyticsModal({ open, onClose, staleLeadCount }: ReactivationAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const stats = MOCK_STATS;

  return (
    <Modal open={open} onClose={onClose} title="Reactivation Analytics" size="2xl">
      <div className="space-y-4">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>{p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Win-Back Rate', value: `${stats.winBackRate}%`, icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Revenue Recovered', value: currencyFmt(stats.revenueRecovered), icon: DollarSign, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Re-engaged', value: `${stats.reengaged}/${stats.enrolled}`, icon: RefreshCw, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Avg Days to Re-engage', value: `${stats.avgDaysToReengage}d`, icon: Clock, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Funnel */}
        <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Reactivation Funnel</p>
          <div className="flex items-center gap-2">
            {[
              { label: 'Stale Leads', value: stats.totalStale, color: 'bg-red-500' },
              { label: 'Enrolled', value: stats.enrolled, color: 'bg-amber-500' },
              { label: 'Re-engaged', value: stats.reengaged, color: 'bg-blue-500' },
              { label: 'Converted', value: stats.converted, color: 'bg-green-500' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className="flex-1 text-center">
                  <div className={cn('h-8 rounded-lg flex items-center justify-center', step.color + '/20')}>
                    <span className={cn('text-sm font-bold tabular-nums', step.color.replace('bg-', 'text-'))}>{step.value}</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary mt-1">{step.label}</p>
                </div>
                {i < 3 && <ArrowRight className="w-3 h-3 text-th-text-tertiary shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Channel performance */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Channel Performance</p>
            <div className="space-y-2">
              {MOCK_CHANNELS.map((ch) => {
                const responseRate = ch.sent ? ((ch.responded / ch.sent) * 100).toFixed(0) : '0';
                const convRate = ch.responded ? ((ch.converted / ch.responded) * 100).toFixed(0) : '0';
                return (
                  <div key={ch.channel} className="flex items-center gap-2 p-2 rounded-lg border border-th-border/30">
                    <ch.icon className={cn('w-4 h-4 shrink-0', ch.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-th-text-primary">{ch.channel}</p>
                      <div className="flex gap-3 text-[10px] text-th-text-tertiary">
                        <span>{ch.sent} sent</span>
                        <span className="text-blue-500">{responseRate}% response</span>
                        <span className="text-green-500">{convRate}% conversion</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-th-text-tertiary">{ch.avgResponseDays}d avg</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage breakdown */}
          <div>
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Stale Leads by Stage</p>
            <div className="space-y-1.5">
              {STAGE_BREAKDOWN.map((s) => (
                <div key={s.stage} className="flex items-center gap-2">
                  <span className="text-xs text-th-text-secondary w-20 capitalize">{s.stage}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full bg-th-accent-500/60" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="text-[10px] text-th-text-secondary tabular-nums w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly trend */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Weekly Trend</p>
          <div className="flex items-end gap-1 h-20">
            {MOCK_WEEKLY_TREND.map((w) => {
              const maxVal = Math.max(...MOCK_WEEKLY_TREND.map((x) => x.enrolled));
              const enrollH = maxVal ? (w.enrolled / maxVal) * 100 : 0;
              const reengH = maxVal ? (w.reengaged / maxVal) * 100 : 0;
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-px">
                  <div className="w-full flex gap-px justify-center" style={{ height: `${enrollH}%` }}>
                    <div className="w-3 bg-th-accent-500/30 rounded-t" style={{ height: '100%' }} />
                    <div className="w-3 bg-green-500/50 rounded-t" style={{ height: `${reengH > 0 ? (reengH / enrollH) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[9px] text-th-text-tertiary">{w.week}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-th-accent-500/30" /> Enrolled</span>
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-green-500/50" /> Re-engaged</span>
          </div>
        </div>

        {/* AI insights */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Insights</span>
          </div>
          <div className="space-y-1 text-xs text-th-text-secondary">
            <p><strong>Best re-engagement window:</strong> {stats.bestDay}s at {stats.bestTime} show 2.3x higher response rates.</p>
            <p><strong>Phone calls</strong> have 3.6x higher conversion than email for leads 90+ days stale.</p>
            <p>Leads in the <strong>"contacted"</strong> stage re-engage 42% more often than "new" leads.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
