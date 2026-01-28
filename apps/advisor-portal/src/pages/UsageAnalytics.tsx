// ============================================================================
// Usage Analytics — Detailed usage metrics and trends
// ============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  MessageSquare,
  Zap,
  Sparkles,
  HardDrive,
  BarChart3,
  Calendar,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useUsageSummary, useUsageHistory, useSubscription } from '../hooks/useBilling';

const METRIC_CONFIG: Record<string, {
  icon: typeof Users;
  label: string;
  color: string;
  bgColor: string;
}> = {
  users: { icon: Users, label: 'Team Members', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  leads: { icon: Users, label: 'Leads Managed', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  messages: { icon: MessageSquare, label: 'Messages Sent', color: 'text-green-600', bgColor: 'bg-green-100' },
  sequences: { icon: Zap, label: 'Active Sequences', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ai_assists: { icon: Sparkles, label: 'AI Assists', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  storage: { icon: HardDrive, label: 'Storage Used', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
};

export default function UsageAnalytics() {
  const navigate = useNavigate();
  const { usage, loading: usageLoading, refresh } = useUsageSummary();
  const { history, loading: historyLoading } = useUsageHistory(6);
  const { subscription } = useSubscription();

  const [selectedMetric, setSelectedMetric] = useState<string>('messages');

  // Calculate projections
  const projections = useMemo(() => {
    if (!usage) return {};

    const periodStart = new Date(usage.period_start);
    const periodEnd = new Date(usage.period_end);
    const now = new Date();

    const totalDays = differenceInDays(periodEnd, periodStart) || 1;
    const daysElapsed = differenceInDays(now, periodStart) || 1;

    const result: Record<string, number> = {};
    usage.metrics.forEach(metric => {
      const dailyRate = metric.current_value / daysElapsed;
      result[metric.metric] = Math.round(dailyRate * totalDays);
    });

    return result;
  }, [usage]);

  // Calculate trends from history
  const trends = useMemo(() => {
    if (history.length < 2) return {};

    const current = history.find(h => h.is_current) || history[0];
    const previous = history.find(h => !h.is_current) || history[1];

    if (!current || !previous) return {};

    const metrics = ['messages_sent', 'leads_count', 'ai_assists_used', 'sequences_active'] as const;
    const result: Record<string, { value: number; percent: number }> = {};

    metrics.forEach(metric => {
      const currentVal = current[metric] || 0;
      const prevVal = previous[metric] || 0;
      const change = currentVal - prevVal;
      const percent = prevVal > 0 ? (change / prevVal) * 100 : 0;
      result[metric] = { value: change, percent: Math.round(percent) };
    });

    return result;
  }, [history]);

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/billing')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your usage patterns and plan ahead
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Period Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Billing Period</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {usage && (
                <>
                  {format(new Date(usage.period_start), 'MMMM d')} -{' '}
                  {format(new Date(usage.period_end), 'MMMM d, yyyy')}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Days Remaining</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {usage?.days_remaining || 0}
            </p>
          </div>
        </div>

        {/* Limits Warning */}
        {usage?.limits_exceeded && usage.limits_exceeded.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Limits Reached</p>
              <p className="text-sm text-yellow-700">
                You've reached your limit for: {usage.limits_exceeded.join(', ')}
              </p>
            </div>
            <button
              onClick={() => navigate('/billing/plans')}
              className="ml-auto px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usage?.metrics.map((metric) => {
          const config = METRIC_CONFIG[metric.metric] || {
            icon: BarChart3,
            label: metric.metric,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
          };
          const Icon = config.icon;
          const isUnlimited = metric.limit_value === null;
          const projected = projections[metric.metric] || 0;
          const willExceed = !isUnlimited && projected > (metric.limit_value || 0);

          return (
            <button
              key={metric.metric}
              onClick={() => setSelectedMetric(metric.metric)}
              className={`bg-white rounded-xl border-2 p-5 text-left transition-all ${
                selectedMetric === metric.metric
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                {willExceed && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full font-medium">
                    Projected to exceed
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500">{config.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">
                  {metric.current_value.toLocaleString()}
                </p>
                {!isUnlimited && (
                  <p className="text-sm text-gray-400">
                    / {metric.limit_value?.toLocaleString()}
                  </p>
                )}
              </div>

              {!isUnlimited && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        metric.usage_percent >= 90 ? 'bg-red-500' :
                        metric.usage_percent >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, metric.usage_percent)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.usage_percent.toFixed(1)}% used
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Metric Detail */}
      {selectedMetric && usage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">End of Period Projection</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Current Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage.metrics.find(m => m.metric === selectedMetric)?.current_value.toLocaleString() || 0}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Projected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(projections[selectedMetric] || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {(() => {
                const metric = usage.metrics.find(m => m.metric === selectedMetric);
                if (!metric || metric.limit_value === null) return null;

                const projected = projections[selectedMetric] || 0;
                const remaining = metric.limit_value - projected;

                return remaining < 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Projected to exceed limit</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      At your current rate, you'll exceed your limit by {Math.abs(remaining).toLocaleString()} before the period ends.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium">On track</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      You'll have approximately {remaining.toLocaleString()} remaining at the end of this period.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Usage History</h3>
            {historyLoading ? (
              <div className="text-center py-8 text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No history available</div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((record, index) => {
                  const metricKey = selectedMetric === 'messages' ? 'messages_sent' :
                    selectedMetric === 'leads' ? 'leads_count' :
                    selectedMetric === 'ai_assists' ? 'ai_assists_used' :
                    selectedMetric === 'sequences' ? 'sequences_active' :
                    selectedMetric === 'users' ? 'users_count' : 'storage_used_mb';

                  const value = (record as any)[metricKey] || 0;
                  const prevValue = index < history.length - 1 ? (history[index + 1] as any)[metricKey] || 0 : 0;
                  const change = value - prevValue;
                  const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(record.period_start), 'MMM d')} -{' '}
                          {format(new Date(record.period_end), 'MMM d')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.is_current ? 'Current period' : 'Completed'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {value.toLocaleString()}
                        </p>
                        {index < history.length - 1 && (
                          <p className={`text-xs flex items-center justify-end gap-1 ${
                            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {change > 0 ? '+' : ''}{changePercent.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Usage Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Optimize Messages</p>
            <p className="text-sm text-gray-600 mt-1">
              Use templates and sequences to send more effective messages with fewer sends.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Smart AI Usage</p>
            <p className="text-sm text-gray-600 mt-1">
              Use AI assists for complex messages. Simple replies may not need AI help.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <Zap className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Sequence Efficiency</p>
            <p className="text-sm text-gray-600 mt-1">
              Combine similar sequences to stay within limits while maintaining effectiveness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
