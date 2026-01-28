// ============================================================================
// Leaderboard Page — Team rankings and gamification
// ============================================================================

import { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  Crown,
  Star,
  Flame,
} from 'lucide-react';
import { useLeaderboard } from '../hooks/useAnalytics';
import { useAdvisor } from '../contexts/AdvisorContext';
import type { TimeGranularity } from '@mpbhealth/champion-core';

const METRICS = [
  { value: 'overall', label: 'Overall', icon: Trophy },
  { value: 'leads_converted', label: 'Leads Converted', icon: TrendingUp },
  { value: 'messages_sent', label: 'Messages', icon: MessageSquare },
  { value: 'response_time', label: 'Response Time', icon: Clock },
  { value: 'compliance_score', label: 'Compliance', icon: Shield },
  { value: 'tasks_completed', label: 'Tasks', icon: CheckCircle },
];

const PERIODS: { value: TimeGranularity; label: string }[] = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'quarterly', label: 'This Quarter' },
  { value: 'yearly', label: 'This Year' },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
  return null;
}

function getRankBgColor(rank: number) {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
  if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
  if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
  return 'bg-surface-primary border-th-border-primary';
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function formatMetricValue(value: number, metric: string): string {
  if (metric === 'response_time') {
    if (value < 60) return `${Math.round(value)}m`;
    return `${(value / 60).toFixed(1)}h`;
  }
  if (metric === 'compliance_score') {
    return `${value.toFixed(0)}%`;
  }
  return value.toLocaleString();
}

export default function Leaderboard() {
  const { profile } = useAdvisor();
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [selectedPeriod, setSelectedPeriod] = useState<TimeGranularity>('monthly');

  const { leaderboard, userRank, loading, error, refresh } = useLeaderboard(
    selectedMetric,
    selectedPeriod
  );

  const currentMetric = METRICS.find((m) => m.value === selectedMetric);
  const MetricIcon = currentMetric?.icon || Trophy;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-th-text-primary">Team Leaderboard</h1>
          <p className="text-th-text-secondary mt-1">
            See how you rank against your teammates
          </p>
        </div>

        {/* Your Rank Card */}
        {userRank && (
          <div className="mb-8 p-6 bg-gradient-to-r from-th-accent-50 to-th-accent-100 rounded-xl border border-th-accent-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-th-accent-200 flex items-center justify-center text-th-accent-700 font-semibold text-lg border-2 border-white shadow">
                    {getInitials(profile?.first_name || null, profile?.last_name || null)}
                  </div>
                )}
                <div>
                  <p className="text-sm text-th-accent-700">Your Ranking</p>
                  <p className="text-2xl font-bold text-th-accent-900">
                    #{userRank} <span className="text-sm font-normal">of {leaderboard.length}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userRank <= 3 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">Top 3!</span>
                  </div>
                )}
                {userRank <= 10 && userRank > 3 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full">
                    <Star className="w-4 h-4 text-th-accent-500" />
                    <span className="text-sm font-medium text-th-accent-700">Top 10</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map((metric) => (
              <button
                key={metric.value}
                onClick={() => setSelectedMetric(metric.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric.value
                    ? 'bg-th-accent-600 text-white'
                    : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                <metric.icon className="w-4 h-4" />
                {metric.label}
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as TimeGranularity)}
            className="px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary text-sm focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const rank = user.rank || index + 1;
            const isCurrentUser = user.user_id === profile?.user_id;

            return (
              <div
                key={user.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBgColor(
                  rank
                )} ${isCurrentUser ? 'ring-2 ring-th-accent-500' : ''}`}
              >
                {/* Rank */}
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(rank) || (
                    <span className="text-xl font-bold text-th-text-muted">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-th-accent-100 flex items-center justify-center text-th-accent-600 font-semibold">
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isCurrentUser ? 'text-th-accent-700' : 'text-th-text-primary'}`}>
                    {user.first_name} {user.last_name}
                    {isCurrentUser && <span className="text-sm font-normal ml-2">(You)</span>}
                  </p>
                  {rank <= 3 && (
                    <p className="text-xs text-th-text-muted">
                      {rank === 1 ? 'Champion' : rank === 2 ? 'Runner Up' : 'Third Place'}
                    </p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <MetricIcon className="w-4 h-4 text-th-text-muted" />
                    <span className="text-lg font-bold text-th-text-primary">
                      {formatMetricValue(user.metric_value, selectedMetric)}
                    </span>
                  </div>
                  <p className="text-xs text-th-text-muted capitalize">
                    {currentMetric?.label || selectedMetric.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border-primary">
              <Users className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
              <p className="text-th-text-secondary">No leaderboard data available</p>
              <p className="text-sm text-th-text-muted mt-1">
                Start tracking activity to populate the leaderboard
              </p>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-primary rounded-xl border border-th-border-primary text-center opacity-50">
              <div className="w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="font-medium text-th-text-primary text-sm">First Place</p>
              <p className="text-xs text-th-text-muted">Rank #1 for a month</p>
            </div>
            <div className="p-4 bg-surface-primary rounded-xl border border-th-border-primary text-center opacity-50">
              <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Flame className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-medium text-th-text-primary text-sm">On Fire</p>
              <p className="text-xs text-th-text-muted">7-day streak</p>
            </div>
            <div className="p-4 bg-surface-primary rounded-xl border border-th-border-primary text-center opacity-50">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-th-text-primary text-sm">Compliant</p>
              <p className="text-xs text-th-text-muted">100% compliance</p>
            </div>
            <div className="p-4 bg-surface-primary rounded-xl border border-th-border-primary text-center opacity-50">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-medium text-th-text-primary text-sm">Rising Star</p>
              <p className="text-xs text-th-text-muted">Most improved</p>
            </div>
          </div>
          <p className="text-xs text-th-text-muted text-center mt-4">
            Achievements coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
