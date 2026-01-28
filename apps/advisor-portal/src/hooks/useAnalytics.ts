// ============================================================================
// Analytics Hooks — React hooks for analytics and reporting
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  analyticsService,
  reportService,
  AnalyticsSummary,
  KPIMetric,
  MetricDataPoint,
  MetricType,
  PerformanceGoal,
  CreateGoalInput,
  LeaderboardUser,
  TimeGranularity,
  SavedReport,
  CreateReportInput,
  ReportRun,
  DashboardWidget,
  CreateWidgetInput,
  UpdateWidgetInput,
  REPORT_TEMPLATES,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// Analytics Summary Hook
// ============================================================================

export function useAnalyticsSummary(dateRange?: { start: string; end: string }) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!orgId) return;

    const range = dateRange || analyticsService.getDateRangeForPreset('last_30_days');

    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsSummary(orgId, range, userId);
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error('[useAnalyticsSummary] Failed to fetch:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
  };
}

// ============================================================================
// KPI Metrics Hook
// ============================================================================

export function useKPIMetrics(
  metrics: MetricType[],
  dateRange?: { start: string; end: string }
) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    if (!orgId) return;

    const range = dateRange || analyticsService.getDateRangeForPreset('last_30_days');

    try {
      setLoading(true);
      const data = await analyticsService.getKPIMetrics(orgId, metrics, range, userId);
      setKpis(data);
      setError(null);
    } catch (err) {
      console.error('[useKPIMetrics] Failed to fetch:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, metrics, dateRange]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    kpis,
    loading,
    error,
    refresh: fetchKPIs,
  };
}

// ============================================================================
// Metric Time Series Hook
// ============================================================================

export function useMetricTimeSeries(
  metricType: MetricType,
  dateRange?: { start: string; end: string },
  granularity: TimeGranularity = 'daily'
) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!orgId) return;

    const range = dateRange || analyticsService.getDateRangeForPreset('last_30_days');

    try {
      setLoading(true);
      const result = await analyticsService.getMetricTimeSeries(
        orgId,
        metricType,
        { ...range, granularity },
        userId
      );
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[useMetricTimeSeries] Failed to fetch:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, metricType, dateRange, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}

// ============================================================================
// Performance Goals Hook
// ============================================================================

export function usePerformanceGoals() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await analyticsService.getGoals(orgId, userId);
      setGoals(data);
      setError(null);
    } catch (err) {
      console.error('[usePerformanceGoals] Failed to fetch:', err);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      if (!orgId || !userId) return;
      const goal = await analyticsService.createGoal(orgId, userId, input);
      await fetchGoals();
      return goal;
    },
    [orgId, userId, fetchGoals]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      await analyticsService.deleteGoal(goalId);
      await fetchGoals();
    },
    [fetchGoals]
  );

  return {
    goals,
    loading,
    error,
    createGoal,
    deleteGoal,
    refresh: fetchGoals,
  };
}

// ============================================================================
// Leaderboard Hook
// ============================================================================

export function useLeaderboard(
  metric: string = 'overall',
  periodType: TimeGranularity = 'monthly'
) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!orgId) return;

    // Calculate period start based on period type
    const now = new Date();
    let periodStart: string;

    if (periodType === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      periodStart = startOfWeek.toISOString().split('T')[0];
    } else if (periodType === 'monthly') {
      periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      periodStart = `${now.getFullYear()}-01-01`;
    }

    try {
      setLoading(true);
      const data = await analyticsService.getLeaderboard(orgId, metric, periodType, periodStart, 10);
      setLeaderboard(data);

      // Get user's rank
      if (userId) {
        const ranking = await analyticsService.getUserRanking(orgId, userId, periodType, periodStart);
        setUserRank(ranking?.overall_rank || null);
      }

      setError(null);
    } catch (err) {
      console.error('[useLeaderboard] Failed to fetch:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, metric, periodType]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    loading,
    error,
    refresh: fetchLeaderboard,
  };
}

// ============================================================================
// Saved Reports Hook
// ============================================================================

export function useSavedReports() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await reportService.getReports(orgId, userId);
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('[useSavedReports] Failed to fetch:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(
    async (input: CreateReportInput) => {
      if (!orgId || !userId) return null;
      const report = await reportService.createReport(orgId, userId, input);
      await fetchReports();
      return report;
    },
    [orgId, userId, fetchReports]
  );

  const deleteReport = useCallback(
    async (reportId: string) => {
      await reportService.deleteReport(reportId);
      await fetchReports();
    },
    [fetchReports]
  );

  const runReport = useCallback(
    async (reportId: string, dateRange?: { start: string; end: string }) => {
      if (!orgId || !userId) return null;
      return reportService.runReport(
        orgId,
        reportId,
        userId,
        dateRange?.start,
        dateRange?.end
      );
    },
    [orgId, userId]
  );

  // Get templates
  const templates = REPORT_TEMPLATES;

  return {
    reports,
    templates,
    loading,
    error,
    createReport,
    deleteReport,
    runReport,
    refresh: fetchReports,
  };
}

// ============================================================================
// Report Runs Hook
// ============================================================================

export function useReportRuns(reportId?: string) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await reportService.getReportRuns(orgId, reportId);
      setRuns(data);
      setError(null);
    } catch (err) {
      console.error('[useReportRuns] Failed to fetch:', err);
      setError('Failed to load report history');
    } finally {
      setLoading(false);
    }
  }, [orgId, reportId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return {
    runs,
    loading,
    error,
    refresh: fetchRuns,
  };
}

// ============================================================================
// Dashboard Widgets Hook
// ============================================================================

export function useDashboardWidgets() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWidgets = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await reportService.getWidgets(orgId, userId);
      setWidgets(data);
      setError(null);
    } catch (err) {
      console.error('[useDashboardWidgets] Failed to fetch:', err);
      setError('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const createWidget = useCallback(
    async (input: CreateWidgetInput) => {
      if (!orgId || !userId) return null;
      const widget = await reportService.createWidget(orgId, userId, input);
      await fetchWidgets();
      return widget;
    },
    [orgId, userId, fetchWidgets]
  );

  const updateWidget = useCallback(
    async (widgetId: string, input: UpdateWidgetInput) => {
      const widget = await reportService.updateWidget(widgetId, input);
      await fetchWidgets();
      return widget;
    },
    [fetchWidgets]
  );

  const deleteWidget = useCallback(
    async (widgetId: string) => {
      await reportService.deleteWidget(widgetId);
      await fetchWidgets();
    },
    [fetchWidgets]
  );

  return {
    widgets,
    loading,
    error,
    createWidget,
    updateWidget,
    deleteWidget,
    refresh: fetchWidgets,
  };
}

// ============================================================================
// Date Range Helper Hook
// ============================================================================

export function useDateRange(initialPreset: string = 'last_30_days') {
  const [preset, setPreset] = useState(initialPreset);
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);

  const dateRange = customRange || analyticsService.getDateRangeForPreset(preset);

  const setPresetRange = (newPreset: string) => {
    setPreset(newPreset);
    setCustomRange(null);
  };

  const setCustomDateRange = (start: string, end: string) => {
    setCustomRange({ start, end });
    setPreset('custom');
  };

  return {
    preset,
    dateRange,
    setPresetRange,
    setCustomDateRange,
  };
}
