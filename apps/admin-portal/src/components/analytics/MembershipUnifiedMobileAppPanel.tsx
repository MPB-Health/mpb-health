import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ShieldCheck,
  ShieldOff,
  Target,
  Brain,
  Info,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { InfoTip, useChartTheme } from '@mpbhealth/ui';
import {
  isMembershipAnalyticsConfigured,
  membershipAnalyticsSupabase,
} from '@/lib/membershipAnalyticsClient';
import {
  loadMembershipAppDashboardData,
  type MembershipAppDashboardStats,
} from '@/utils/membershipAnalytics/membershipAppDashboardLoad';
import { buildMonthlyTrendsLast6, type NextMonthPredictionV23 } from '@/utils/membershipAnalytics/nextMonthPredictionV23';

const C = {
  navy: '#0A4E8E',
  navyDark: '#083d6f',
  green: '#A4CC43',
  greenDark: '#8ab839',
  cyan: '#0CC0DF',
  cyanDark: '#0aabc9',
};

type Props = {
  onStatsLoaded?: (stats: MembershipAppDashboardStats) => void;
};

function StatCard({
  icon: Icon,
  iconGradient,
  accent,
  label,
  value,
  subtitle,
  trend,
  children,
}: {
  icon: React.ElementType;
  iconGradient: string;
  accent: string;
  label: string;
  value: number;
  subtitle?: string;
  trend?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="group bg-white dark:bg-surface-primary rounded-2xl shadow-sm border border-th-border hover:shadow-md transition-all duration-300 overflow-hidden"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200"
            style={{ background: iconGradient }}
          >
            <Icon className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums" style={{ color: accent }}>
              {value.toLocaleString()}
            </p>
            {trend !== undefined && trend !== 0 && (
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(trend)}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-bold text-th-text-primary mb-1">{label}</p>
        {subtitle && <p className="text-xs text-th-text-tertiary mb-2">{subtitle}</p>}
        {children && <div className="border-t border-th-border/60 pt-2 space-y-1">{children}</div>}
      </div>
    </div>
  );
}

function Sub({
  label,
  value,
  color,
  title,
  meta,
}: {
  label: string;
  value: number;
  color: string;
  title?: string;
  meta?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2" title={title}>
      <span className="text-xs text-th-text-tertiary font-medium shrink-0">{label}</span>
      <div className="text-right min-w-0">
        <span className="text-xs font-bold tabular-nums block" style={{ color }}>
          {value.toLocaleString()}
        </span>
        {meta ? (
          <span className="text-[10px] font-semibold text-th-text-secondary leading-snug block mt-0.5 max-w-[15rem] ml-auto">
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SectionLabel({ title, color = C.navy }: { title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="h-4 w-1 rounded-full" style={{ background: color }} />
      <h2 className="text-xs font-bold uppercase tracking-widest text-th-text-tertiary">{title}</h2>
    </div>
  );
}

export default function MembershipUnifiedMobileAppPanel({ onStatsLoaded }: Props) {
  const onStatsLoadedRef = useRef(onStatsLoaded);
  onStatsLoadedRef.current = onStatsLoaded;

  const chartTheme = useChartTheme();
  const [stats, setStats] = useState<MembershipAppDashboardStats | null>(null);
  const [allMembersData, setAllMembersData] = useState<any[]>([]);
  const [nextMonthPrediction, setNextMonthPrediction] = useState<NextMonthPredictionV23 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showLastMonthPopup, setShowLastMonthPopup] = useState(false);
  const [showActivePrimaryPopup, setShowActivePrimaryPopup] = useState(false);

  const fetchData = useCallback(async () => {
    if (!membershipAnalyticsSupabase) {
      setError('Membership analytics is not configured');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { stats: s, allMembersData: rows, nextMonthPrediction: pred } =
        await loadMembershipAppDashboardData(membershipAnalyticsSupabase);
      setStats(s);
      setAllMembersData(rows);
      setNextMonthPrediction(pred);
      onStatsLoadedRef.current?.(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load app dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const monthlyTrends = useMemo(() => buildMonthlyTrendsLast6(allMembersData), [allMembersData]);

  const primaryAppShareOfActivePct = useMemo(() => {
    if (!stats || stats.primaryMembers <= 0) return null;
    return Math.round((stats.primaryUsers / stats.primaryMembers) * 100);
  }, [stats]);

  const conversionRate =
    stats && stats.totalMembers > 0
      ? Math.round((stats.registeredUsers / stats.totalMembers) * 100)
      : 0;

  const notRegisteredTotal = stats
    ? stats.notRegisteredPrimary + stats.notRegisteredDependents
    : 0;

  if (!isMembershipAnalyticsConfigured) {
    return (
      <div className="card-premium p-6 text-center">
        <p className="text-th-text-primary font-medium">Membership analytics not configured</p>
        <p className="text-sm text-th-text-tertiary mt-1">
          Set <code className="text-xs font-mono">VITE_MEMBERSHIP_ANALYTICS_SUPABASE_URL</code> and{' '}
          <code className="text-xs font-mono">VITE_MEMBERSHIP_ANALYTICS_SUPABASE_ANON_KEY</code> in{' '}
          <code className="text-xs font-mono">.env.local</code>.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card-premium p-8 text-center">
        <Activity className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-th-text-primary font-medium">Failed to load app membership data</p>
        <p className="text-sm text-th-text-tertiary mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void fetchData();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-th-accent-600 text-white text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const pred = nextMonthPrediction;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-th-text-secondary flex items-center gap-2">
          <InfoTip
            size="sm"
            content="Same Supabase project as Membership & Sales (VITE_MEMBERSHIP_ANALYTICS_*). Counts use sales_analytics_view, users, members, and past_inactives — not the legacy analytics-hub mobile proxy."
          />
          Data from membership / app database (anon key + RLS).
        </p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void fetchData();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-th-border text-sm text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section>
        <SectionLabel title="Member overview" color={C.navy} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            iconGradient={`linear-gradient(135deg, ${C.navy}, ${C.navyDark})`}
            accent={C.navy}
            label="Active primary"
            value={stats.primaryMembers}
            trend={stats.primaryMembersVsLastMonth}
            subtitle={stats.primaryMembersVsLastMonth !== 0 ? 'vs last month' : undefined}
          >
            <Sub label="Active dependents" value={stats.dependentMembers} color={C.cyan} />
            <Sub
              label="Total active"
              value={stats.primaryMembers + stats.dependentMembers}
              color={C.navyDark}
            />
            <div className="pt-2 mt-2 border-t border-th-border/60">
              <button
                type="button"
                onClick={() => setShowActivePrimaryPopup(true)}
                className="inline-flex items-center gap-1.5 text-xs text-th-text-tertiary hover:text-th-accent-600"
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
                How is this calculated?
              </button>
            </div>
          </StatCard>

          <StatCard
            icon={UserCheck}
            iconGradient={`linear-gradient(135deg, ${C.green}, ${C.greenDark})`}
            accent={C.green}
            label="Registered on app"
            value={stats.registeredUsers}
            subtitle={(() => {
              const ended = stats.registeredUsersCancelledEffective;
              const scheduled = Math.max(0, stats.registeredUsersCancelled - ended);
              if (stats.registeredUsers > 0 && ended > 0 && scheduled > 0) {
                return `${ended.toLocaleString()} ended (today ≥ inactive date); ${scheduled.toLocaleString()} inactive, cancel date in future`;
              }
              if (stats.registeredUsers > 0 && ended > 0) {
                return `${ended.toLocaleString()} ended (today ≥ inactive date or no inactive date)`;
              }
              if (stats.registeredUsers > 0 && scheduled > 0) {
                return `${scheduled.toLocaleString()} inactive with future inactive date`;
              }
              if (stats.registeredUsers > 0 && stats.registeredUsersCancelled === 0) {
                return 'None cancelled (all active plans)';
              }
              return undefined;
            })()}
          >
            <Sub
              label="Primary"
              value={stats.primaryUsers}
              color={C.green}
              title="Primary rows in users (app), net of effective cancellations."
              meta={
                primaryAppShareOfActivePct !== null
                  ? `${primaryAppShareOfActivePct}% of ${stats.primaryMembers.toLocaleString()} active primary`
                  : undefined
              }
            />
            <Sub label="Dependents" value={stats.dependentUsers} color={C.greenDark} />
            <Sub
              label="Cancelled (all app users)"
              value={stats.registeredUsersCancelled}
              color="#ea580c"
            />
          </StatCard>

          <StatCard
            icon={ShieldCheck}
            iconGradient="linear-gradient(135deg, #16a34a, #15803d)"
            accent="#16a34a"
            label="Currently active"
            value={stats.currentlyActive}
            trend={stats.currentlyActiveVsLastMonth}
            subtitle={stats.currentlyActiveVsLastMonth !== 0 ? 'vs last month' : undefined}
          >
            <Sub label="Cancelling this month (in active count)" value={stats.expiringThisMonth} color="#f97316" />
            <Sub label="Starting next month (included)" value={stats.activatingNextMonth} color={C.cyan} />
            <Sub label="Scheduled future (not added)" value={stats.futureActive} color="#6b7280" />
            <div className="pt-2 mt-2 border-t border-th-border/60 flex items-center justify-between">
              <span className="text-xs text-th-text-tertiary">Last month</span>
              <button
                type="button"
                onClick={() => setShowLastMonthPopup(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-th-text-secondary hover:text-th-text-primary"
              >
                <span>{stats.lastMonthActive.toLocaleString()}</span>
                <Info className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </StatCard>

          <StatCard
            icon={ShieldOff}
            iconGradient="linear-gradient(135deg, #6b7280, #4b5563)"
            accent="#6b7280"
            label="Cancelled plans"
            value={stats.inactivePlans}
          >
            <Sub label="Currently cancelled" value={stats.currentlyInactive} color="#6b7280" />
            <Sub
              label="Scheduled to expire (future months)"
              value={stats.scheduledToExpireFutureMonths}
              color="#f97316"
            />
          </StatCard>
        </div>
      </section>

      <section>
        <SectionLabel title="This month's activity" color={C.green} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={TrendingUp}
            iconGradient={`linear-gradient(135deg, ${C.green}, ${C.greenDark})`}
            accent={C.green}
            label="Activated this month"
            value={stats.activatedThisMonth}
          />
          <StatCard
            icon={TrendingDown}
            iconGradient="linear-gradient(135deg, #ef4444, #dc2626)"
            accent="#ef4444"
            label="Cancelled this month"
            value={stats.inactivatedThisMonth}
          />
          <div
            className="relative rounded-2xl shadow-sm overflow-hidden text-white p-5"
            style={{
              background: `linear-gradient(135deg, ${
                stats.activatedThisMonth >= stats.inactivatedThisMonth ? C.green : '#ef4444'
              }, ${C.navy})`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/20">
                <Activity className="h-5 w-5 text-white" aria-hidden />
              </div>
              <p className="text-3xl font-bold tabular-nums">
                {stats.activatedThisMonth - stats.inactivatedThisMonth >= 0 ? '+' : ''}
                {stats.activatedThisMonth - stats.inactivatedThisMonth}
              </p>
            </div>
            <p className="text-sm font-bold mb-2">Net change</p>
            <p className="text-xs text-white/80">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel title={`Next month prediction — ${pred?.nextMonthLabel ?? '…'}`} color={C.cyan} />
        <div
          className={`card-premium p-5 sm:p-6 border-2 ${
            pred?.isWinning
              ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20'
              : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20'
          }`}
        >
          {pred ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-surface-primary shadow-sm">
                    <Brain className="h-6 w-6" style={{ color: C.navy }} aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-th-text-primary">{pred.nextMonthLabel}</h3>
                    <p className="text-xs text-th-text-tertiary">Median of 3 (V2.3)</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{pred.scheduledActivationsNextMonth}</div>
                    <div className="text-[10px] text-th-text-tertiary uppercase">Scheduled</div>
                  </div>
                  <div className="text-th-text-tertiary">−</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{pred.predictedCancellations}</div>
                    <div className="text-[10px] text-th-text-tertiary uppercase">Cancellations</div>
                  </div>
                  <div className="text-th-text-tertiary">=</div>
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${
                        pred.predictedNetNextMonth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {pred.predictedNetNextMonth >= 0 ? '+' : ''}
                      {pred.predictedNetNextMonth}
                    </div>
                    <div className="text-xs font-semibold text-th-text-secondary">
                      {pred.isWinning ? 'Winning' : 'Losing'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl p-3 border border-th-border bg-surface-primary">
                  <div className="text-[10px] font-bold text-th-text-tertiary uppercase mb-1">Break-even</div>
                  <div className="text-lg font-bold" style={{ color: C.navy }}>
                    Need {pred.predictedCancellations} activations
                  </div>
                </div>
                <div className="rounded-xl p-3 border border-amber-200 bg-surface-primary">
                  <div className="text-[10px] font-bold text-th-text-tertiary uppercase mb-1">Age out (65)</div>
                  <div className="text-lg font-bold text-amber-700">{pred.predictedBreakdown.ageOut}</div>
                </div>
                <div className="rounded-xl p-3 border border-orange-200 bg-surface-primary">
                  <div className="text-[10px] font-bold text-th-text-tertiary uppercase mb-1">Transaction declined</div>
                  <div className="text-lg font-bold text-orange-600">
                    {pred.predictedBreakdown.transactionDeclined}
                  </div>
                </div>
                <div className="rounded-xl p-3 border border-th-border bg-surface-primary">
                  <div className="text-[10px] font-bold text-th-text-tertiary uppercase mb-1">Voluntary</div>
                  <div className="text-lg font-bold text-th-text-secondary">{pred.predictedBreakdown.other}</div>
                </div>
              </div>
              <p className="text-xs text-th-text-tertiary mt-3">{pred.sourceLabel}</p>
            </>
          ) : (
            <p className="text-sm text-th-text-tertiary py-4 text-center">
              Not enough history for V2.3 prediction (need at least 3 months of churn data).
            </p>
          )}
          <Link
            to="/analytics/membership-sales?tab=predictive"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-th-accent-600 hover:underline"
          >
            <Target className="h-4 w-4" />
            Full predictive analytics
          </Link>
        </div>
      </section>

      <section>
        <SectionLabel title="Monthly trends" color={C.cyan} />
        <div className="card-premium p-5 sm:p-6">
          <h3 className="text-base font-bold text-th-text-primary mb-4">
            Activations vs cancellations — last 6 months
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                  axisLine={{ stroke: chartTheme.gridColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: '12px',
                    color: chartTheme.tooltipText,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke={C.green}
                  strokeWidth={2.5}
                  name="Activated"
                  dot={{ fill: C.green, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="inactive"
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  name="Cancelled"
                  dot={{ fill: '#94a3b8', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="card-premium p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-[18px] w-[18px]" style={{ color: C.navy }} aria-hidden />
            <h2 className="text-base font-bold text-th-text-primary">Platform insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: TrendingUp,
                value: `${conversionRate}%`,
                label: 'Registration rate',
                sub: 'Registered app users / total members',
                color: C.navy,
                bgHex: `${C.navy}10`,
                border: `${C.navy}22`,
              },
              {
                icon: Activity,
                value: stats.plansSold.toLocaleString(),
                label: 'Plans in view',
                sub: 'Primary rows in sales_analytics_view',
                color: C.cyan,
                bgHex: `${C.cyan}18`,
                border: `${C.cyan}33`,
              },
              {
                icon: Users,
                value: notRegisteredTotal.toLocaleString(),
                label: 'Not registered',
                sub: 'Active 18+ pending app sign-ups',
                color: '#6b7280',
                bgHex: 'var(--surface-secondary, #f3f4f6)',
                border: 'var(--border-default, #e5e7eb)',
                children: (
                  <>
                    <Sub label="Primary" value={stats.notRegisteredPrimary} color="#6b7280" />
                    <Sub label="Dependents" value={stats.notRegisteredDependents} color="#9ca3af" />
                  </>
                ),
              },
            ].map(({ icon: Icon, value, label, sub, color, bgHex, border, children: cardChildren }) => (
              <div
                key={label}
                className="rounded-xl p-5 text-center hover:shadow-sm transition-shadow"
                style={{ background: bgHex, border: `1px solid ${border}` }}
              >
                <div className="inline-flex p-2.5 rounded-xl bg-surface-primary shadow-sm mb-3">
                  <Icon className="h-8 w-8" style={{ color }} aria-hidden />
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs font-bold text-th-text-primary uppercase tracking-wide">{label}</p>
                <p className="text-xs text-th-text-tertiary mt-0.5">{sub}</p>
                {cardChildren && (
                  <div className="border-t border-th-border mt-3 pt-3 text-left space-y-1">{cardChildren}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/members"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-th-border text-sm font-medium text-th-text-primary hover:bg-surface-secondary"
        >
          <Users className="h-4 w-4" />
          Manage members
        </Link>
        <Link
          to="/analytics/membership-sales"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:opacity-90"
        >
          <Calendar className="h-4 w-4" />
          Membership &amp; sales analytics
        </Link>
      </div>

      {showActivePrimaryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setShowActivePrimaryPopup(false)}
          />
          <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full p-6 border border-th-border text-left">
            <h3 className="text-base font-bold text-th-text-primary mb-4">Active primary — calculation</h3>
            <div className="space-y-3 text-sm text-th-text-secondary">
              <p>
                Counts primary members who have <em>started</em> by today:{' '}
                <code className="text-xs bg-surface-secondary px-1 rounded">is_active = true</code>,{' '}
                <code className="text-xs bg-surface-secondary px-1 rounded">is_primary = true</code>, and{' '}
                <code className="text-xs bg-surface-secondary px-1 rounded">active_date ≤ today</code> (or no
                active_date).
              </p>
              <p>Source: <code className="text-xs">sales_analytics_view</code> for primaries; dependents from users + members.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowActivePrimaryPopup(false)}
              className="mt-4 w-full py-2 rounded-lg bg-th-accent-600 text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showLastMonthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setShowLastMonthPopup(false)}
          />
          <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-th-border text-left">
            <h3 className="text-lg font-bold text-th-text-primary mb-4">Currently active — last month</h3>
            <div className="space-y-3 text-sm text-th-text-secondary">
              <p>
                <strong>Last month total:</strong> {stats.lastMonthActive.toLocaleString()}
              </p>
              <p>Cancelling last month: {stats.lastMonthExpiring.toLocaleString()}</p>
              <p>Starting this month (included): {stats.lastMonthActivatingNext.toLocaleString()}</p>
              <p>Scheduled future (not in total): {stats.lastMonthFutureActive.toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLastMonthPopup(false)}
              className="mt-4 w-full py-2 rounded-lg bg-th-accent-600 text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
