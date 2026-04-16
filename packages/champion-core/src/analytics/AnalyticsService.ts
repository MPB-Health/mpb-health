// ============================================================================
// Analytics Service — Metrics, KPIs, and time-series data
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  MetricType,
  TimeGranularity,
  MetricSnapshot,
  MetricDataPoint,
  PerformanceGoal,
  CreateGoalInput,
  LeaderboardUser,
  KPIMetric,
  AnalyticsSummary,
  DateRangeParams,
} from './types';

// Metric configuration
const METRIC_CONFIG: Record<MetricType, { label: string; format: 'number' | 'percent' | 'currency' | 'duration' }> = {
  leads_total: { label: 'Total Leads', format: 'number' },
  leads_new: { label: 'New Leads', format: 'number' },
  leads_converted: { label: 'Converted Leads', format: 'number' },
  leads_lost: { label: 'Lost Leads', format: 'number' },
  conversion_rate: { label: 'Conversion Rate', format: 'percent' },
  messages_sent: { label: 'Messages Sent', format: 'number' },
  messages_received: { label: 'Messages Received', format: 'number' },
  response_time_avg: { label: 'Avg Response Time', format: 'duration' },
  response_time_median: { label: 'Median Response Time', format: 'duration' },
  compliance_score: { label: 'Compliance Score', format: 'percent' },
  tasks_completed: { label: 'Tasks Completed', format: 'number' },
  tasks_overdue: { label: 'Overdue Tasks', format: 'number' },
  calls_made: { label: 'Calls Made', format: 'number' },
  meetings_held: { label: 'Meetings Held', format: 'number' },
  revenue_potential: { label: 'Potential Revenue', format: 'currency' },
  revenue_closed: { label: 'Closed Revenue', format: 'currency' },
};

export class AnalyticsService {
  // =========================================================================
  // METRIC SNAPSHOTS
  // =========================================================================

  /**
   * Get metric time series data
   */
  async getMetricTimeSeries(
    orgId: string,
    metricType: MetricType,
    params: DateRangeParams,
    userId?: string
  ): Promise<MetricDataPoint[]> {
    const { data, error } = await supabase.rpc('get_metric_timeseries', {
      p_org_id: orgId,
      p_user_id: userId || null,
      p_metric_type: metricType,
      p_granularity: params.granularity || 'daily',
      p_start_date: params.start,
      p_end_date: params.end,
    });

    if (error) {
      console.error('[AnalyticsService] Failed to get time series:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get current metric value
   */
  async getCurrentMetricValue(
    orgId: string,
    metricType: MetricType,
    userId?: string
  ): Promise<MetricSnapshot | null> {
    let query = supabase
      .from('metric_snapshots')
      .select('id, org_id, user_id, metric_type, granularity, period_start, period_end, value, previous_value, change_percent, dimensions, created_at')
      .eq('org_id', orgId)
      .eq('metric_type', metricType)
      .order('period_start', { ascending: false })
      .limit(1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('[AnalyticsService] Failed to get metric:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Get multiple metrics for KPI dashboard
   */
  async getKPIMetrics(
    orgId: string,
    metrics: MetricType[],
    params: DateRangeParams,
    userId?: string
  ): Promise<KPIMetric[]> {
    const results: KPIMetric[] = [];

    for (const metric of metrics) {
      const timeSeries = await this.getMetricTimeSeries(orgId, metric, params, userId);

      const currentValue = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].value : 0;
      const previousValue = timeSeries.length > 1 ? timeSeries[timeSeries.length - 2].value : null;

      let changePercent: number | null = null;
      if (previousValue !== null && previousValue !== 0) {
        changePercent = ((currentValue - previousValue) / previousValue) * 100;
      }

      const config = METRIC_CONFIG[metric];
      results.push({
        metric,
        label: config.label,
        value: currentValue,
        previousValue,
        changePercent,
        trend: changePercent === null ? 'flat' : changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
        format: config.format,
      });
    }

    return results;
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(
    orgId: string,
    params: DateRangeParams,
    userId?: string
  ): Promise<AnalyticsSummary> {
    const defaultMetrics: MetricType[] = [
      'leads_new',
      'leads_converted',
      'conversion_rate',
      'messages_sent',
      'tasks_completed',
      'compliance_score',
    ];

    const kpis = await this.getKPIMetrics(orgId, defaultMetrics, params, userId);

    // Get time series for key metrics
    const charts = await Promise.all([
      this.getMetricTimeSeries(orgId, 'leads_new', params, userId).then((data) => ({
        timeSeries: data,
        metric: 'leads_new' as MetricType,
      })),
      this.getMetricTimeSeries(orgId, 'messages_sent', params, userId).then((data) => ({
        timeSeries: data,
        metric: 'messages_sent' as MetricType,
      })),
    ]);

    return {
      period: {
        start: params.start,
        end: params.end,
        granularity: params.granularity || 'daily',
      },
      kpis,
      charts,
    };
  }

  /**
   * Calculate and store metrics (typically called by cron)
   */
  async calculateMetrics(
    orgId: string,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc('calculate_user_metrics', {
      p_org_id: orgId,
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('[AnalyticsService] Failed to calculate metrics:', error);
      throw error;
    }

    return data as any;
  }

  // =========================================================================
  // PERFORMANCE GOALS
  // =========================================================================

  /**
   * Get goals for user or organization
   */
  async getGoals(orgId: string, userId?: string): Promise<PerformanceGoal[]> {
    let query = supabase
      .from('performance_goals')
      .select('id, org_id, user_id, name, description, metric_type, target_value, target_period, current_value, progress_percent, last_calculated_at, start_date, end_date, is_active, achieved_at, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AnalyticsService] Failed to get goals:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get a single goal
   */
  async getGoal(goalId: string): Promise<PerformanceGoal | null> {
    const { data, error } = await supabase
      .from('performance_goals')
      .select('id, org_id, user_id, name, description, metric_type, target_value, target_period, current_value, progress_percent, last_calculated_at, start_date, end_date, is_active, achieved_at, created_by, created_at, updated_at')
      .eq('id', goalId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[AnalyticsService] Failed to get goal:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create a performance goal
   */
  async createGoal(
    orgId: string,
    createdBy: string,
    input: CreateGoalInput
  ): Promise<PerformanceGoal> {
    const { data, error } = await supabase
      .from('performance_goals')
      .insert({
        org_id: orgId,
        user_id: input.user_id || null,
        name: input.name,
        description: input.description,
        metric_type: input.metric_type,
        target_value: input.target_value,
        target_period: input.target_period || 'monthly',
        start_date: input.start_date,
        end_date: input.end_date,
        created_by: createdBy,
      })
      .select('id, org_id, user_id, name, description, metric_type, target_value, target_period, current_value, progress_percent, last_calculated_at, start_date, end_date, is_active, achieved_at, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[AnalyticsService] Failed to create goal:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, currentValue: number): Promise<void> {
    const goal = await this.getGoal(goalId);
    if (!goal) return;

    const progressPercent = (currentValue / goal.target_value) * 100;
    const achieved = currentValue >= goal.target_value;

    const { error } = await supabase
      .from('performance_goals')
      .update({
        current_value: currentValue,
        progress_percent: Math.min(progressPercent, 100),
        last_calculated_at: new Date().toISOString(),
        achieved_at: achieved && !goal.achieved_at ? new Date().toISOString() : goal.achieved_at,
      })
      .eq('id', goalId);

    if (error) {
      console.error('[AnalyticsService] Failed to update goal progress:', error);
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('performance_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) {
      console.error('[AnalyticsService] Failed to delete goal:', error);
      throw error;
    }
  }

  // =========================================================================
  // LEADERBOARD
  // =========================================================================

  /**
   * Get leaderboard for a metric
   */
  async getLeaderboard(
    orgId: string,
    metric: string,
    periodType: TimeGranularity,
    periodStart: string,
    limit: number = 10
  ): Promise<LeaderboardUser[]> {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_org_id: orgId,
      p_metric: metric,
      p_period_type: periodType,
      p_period_start: periodStart,
      p_limit: limit,
    });

    if (error) {
      console.error('[AnalyticsService] Failed to get leaderboard:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get user's ranking
   */
  async getUserRanking(
    orgId: string,
    userId: string,
    periodType: TimeGranularity,
    periodStart: string
  ): Promise<{
    overall_rank: number | null;
    leads_converted_rank: number | null;
    response_time_rank: number | null;
    compliance_score_rank: number | null;
  } | null> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('overall_rank, leads_converted_rank, response_time_rank, compliance_score_rank')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .eq('period_start', periodStart)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[AnalyticsService] Failed to get user ranking:', error);
      throw error;
    }

    return data as any;
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get date range for preset
   */
  getDateRangeForPreset(preset: string): { start: string; end: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return {
          start: today.toISOString(),
          end: now.toISOString(),
        };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday.toISOString(),
          end: today.toISOString(),
        };
      }
      case 'last_7_days': {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          start: sevenDaysAgo.toISOString(),
          end: now.toISOString(),
        };
      }
      case 'last_30_days': {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          start: thirtyDaysAgo.toISOString(),
          end: now.toISOString(),
        };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: startOfMonth.toISOString(),
          end: now.toISOString(),
        };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: startOfLastMonth.toISOString(),
          end: endOfLastMonth.toISOString(),
        };
      }
      case 'this_quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return {
          start: startOfQuarter.toISOString(),
          end: now.toISOString(),
        };
      }
      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          start: startOfYear.toISOString(),
          end: now.toISOString(),
        };
      }
      default:
        return {
          start: new Date(today.setDate(today.getDate() - 30)).toISOString(),
          end: now.toISOString(),
        };
    }
  }

  /**
   * Get metric configuration
   */
  getMetricConfig(metric: MetricType) {
    return METRIC_CONFIG[metric];
  }

  /**
   * Get all available metrics
   */
  getAvailableMetrics(): { type: MetricType; label: string; format: string }[] {
    return Object.entries(METRIC_CONFIG).map(([type, config]) => ({
      type: type as MetricType,
      label: config.label,
      format: config.format,
    }));
  }
}

export const analyticsService = new AnalyticsService();
