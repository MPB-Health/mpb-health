import { analyticsDataService, type DateRange } from './analyticsDataService';

// ============================================================================
// Types
// ============================================================================

export type ComparisonPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';
export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

export interface ComparisonResult<T> {
  current: T;
  previous: T;
  change: T extends number ? number : Partial<Record<keyof T, number>>;
  changePercent: T extends number ? number : Partial<Record<keyof T, number>>;
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface SummaryComparison {
  sessions: MetricComparison;
  users: MetricComparison;
  pageViews: MetricComparison;
  bounceRate: MetricComparison;
  avgSessionDuration: MetricComparison;
  pagesPerSession: MetricComparison;
  newUsers: MetricComparison;
  returningUsers: MetricComparison;
}

export interface DateRangeWithComparison {
  current: DateRange;
  previous: DateRange;
  label: string;
  comparisonLabel: string;
}

// ============================================================================
// Date Range Helpers
// ============================================================================

/**
 * Get date range from a preset
 */
export const getDateRangeFromPreset = (preset: DatePreset): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    case 'last7days':
      return {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'last30days':
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'thisMonth': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: startOfMonth,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    case 'lastMonth': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
      };
    }

    case 'thisYear': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: startOfYear,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    case 'lastYear': {
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return {
        startDate: startOfLastYear,
        endDate: endOfLastYear,
      };
    }

    default:
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
  }
};

/**
 * Get the previous period for comparison
 */
export const getPreviousPeriod = (dateRange: DateRange): DateRange => {
  const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();

  return {
    startDate: new Date(dateRange.startDate.getTime() - duration - 24 * 60 * 60 * 1000),
    endDate: new Date(dateRange.startDate.getTime() - 1),
  };
};

/**
 * Get date range with comparison period
 */
export const getDateRangeWithComparison = (
  preset: DatePreset
): DateRangeWithComparison => {
  const current = getDateRangeFromPreset(preset);
  const previous = getPreviousPeriod(current);

  const labels: Record<DatePreset, { label: string; comparisonLabel: string }> = {
    today: { label: 'Today', comparisonLabel: 'vs Yesterday' },
    yesterday: { label: 'Yesterday', comparisonLabel: 'vs Day Before' },
    last7days: { label: 'Last 7 Days', comparisonLabel: 'vs Previous 7 Days' },
    last30days: { label: 'Last 30 Days', comparisonLabel: 'vs Previous 30 Days' },
    thisMonth: { label: 'This Month', comparisonLabel: 'vs Last Month' },
    lastMonth: { label: 'Last Month', comparisonLabel: 'vs Month Before' },
    thisYear: { label: 'This Year', comparisonLabel: 'vs Last Year' },
    lastYear: { label: 'Last Year', comparisonLabel: 'vs Year Before' },
  };

  return {
    current,
    previous,
    ...labels[preset],
  };
};

/**
 * Format date range for display
 */
export const formatDateRange = (dateRange: DateRange): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const startStr = dateRange.startDate.toLocaleDateString('en-US', options);
  const endStr = dateRange.endDate.toLocaleDateString('en-US', options);

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
};

// ============================================================================
// Comparison Helpers
// ============================================================================

/**
 * Calculate change between two values
 */
const calculateChange = (current: number, previous: number): MetricComparison => {
  const change = current - previous;
  const changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (change > 0) trend = 'up';
  else if (change < 0) trend = 'down';

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
};

/**
 * Calculate change for bounce rate (lower is better)
 */
const calculateBounceRateChange = (current: number, previous: number): MetricComparison => {
  const change = current - previous;
  const changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

  // For bounce rate, down is good
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (change < 0) trend = 'up'; // Improvement
  else if (change > 0) trend = 'down'; // Worse

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
};

// ============================================================================
// Comparison Service
// ============================================================================

export const analyticsComparisonService = {
  /**
   * Compare analytics summary between two periods
   */
  async compareSummary(
    currentRange: DateRange,
    previousRange: DateRange
  ): Promise<SummaryComparison> {
    const [current, previous] = await Promise.all([
      analyticsDataService.getSummary(currentRange),
      analyticsDataService.getSummary(previousRange),
    ]);

    return {
      sessions: calculateChange(current.totalSessions, previous.totalSessions),
      users: calculateChange(current.totalUsers, previous.totalUsers),
      pageViews: calculateChange(current.totalPageViews, previous.totalPageViews),
      bounceRate: calculateBounceRateChange(current.bounceRate, previous.bounceRate),
      avgSessionDuration: calculateChange(current.avgSessionDuration, previous.avgSessionDuration),
      pagesPerSession: calculateChange(current.pagesPerSession, previous.pagesPerSession),
      newUsers: calculateChange(current.newUsers, previous.newUsers),
      returningUsers: calculateChange(current.returningUsers, previous.returningUsers),
    };
  },

  /**
   * Compare a specific metric between two periods
   */
  async compareMetric(
    currentRange: DateRange,
    previousRange: DateRange,
    metric: 'sessions' | 'users' | 'pageViews' | 'bounceRate'
  ): Promise<MetricComparison> {
    const [currentData, previousData] = await Promise.all([
      analyticsDataService.getDailyMetrics(currentRange, metric),
      analyticsDataService.getDailyMetrics(previousRange, metric),
    ]);

    const currentTotal = currentData.reduce((sum, d) => sum + d.value, 0);
    const previousTotal = previousData.reduce((sum, d) => sum + d.value, 0);

    if (metric === 'bounceRate') {
      const currentAvg = currentData.length > 0 ? currentTotal / currentData.length : 0;
      const previousAvg = previousData.length > 0 ? previousTotal / previousData.length : 0;
      return calculateBounceRateChange(currentAvg, previousAvg);
    }

    return calculateChange(currentTotal, previousTotal);
  },

  /**
   * Get comparison data for charts (aligned by day index)
   */
  async getComparisonChartData(
    currentRange: DateRange,
    previousRange: DateRange,
    metric: 'sessions' | 'users' | 'pageViews' | 'bounceRate'
  ): Promise<{
    current: Array<{ index: number; date: string; value: number }>;
    previous: Array<{ index: number; date: string; value: number }>;
  }> {
    const [currentData, previousData] = await Promise.all([
      analyticsDataService.getDailyMetrics(currentRange, metric),
      analyticsDataService.getDailyMetrics(previousRange, metric),
    ]);

    return {
      current: currentData.map((d, index) => ({
        index,
        date: d.date,
        value: d.value,
      })),
      previous: previousData.map((d, index) => ({
        index,
        date: d.date,
        value: d.value,
      })),
    };
  },

  /**
   * Compare traffic sources between periods
   */
  async compareTrafficSources(
    currentRange: DateRange,
    previousRange: DateRange
  ): Promise<Array<{
    sourceType: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  }>> {
    const [currentSources, previousSources] = await Promise.all([
      analyticsDataService.getTrafficSources(currentRange),
      analyticsDataService.getTrafficSources(previousRange),
    ]);

    const previousMap = new Map(previousSources.map((s) => [s.sourceType, s.sessions]));
    const allSources = new Set([
      ...currentSources.map((s) => s.sourceType),
      ...previousSources.map((s) => s.sourceType),
    ]);

    return Array.from(allSources).map((sourceType) => {
      const current = currentSources.find((s) => s.sourceType === sourceType)?.sessions || 0;
      const previous = previousMap.get(sourceType) || 0;
      const change = current - previous;
      const changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return { sourceType, current, previous, change, changePercent };
    });
  },

  /**
   * Compare device breakdown between periods
   */
  async compareDevices(
    currentRange: DateRange,
    previousRange: DateRange
  ): Promise<{
    desktop: MetricComparison;
    mobile: MetricComparison;
    tablet: MetricComparison;
  }> {
    const [current, previous] = await Promise.all([
      analyticsDataService.getDeviceBreakdown(currentRange),
      analyticsDataService.getDeviceBreakdown(previousRange),
    ]);

    return {
      desktop: calculateChange(current.desktop, previous.desktop),
      mobile: calculateChange(current.mobile, previous.mobile),
      tablet: calculateChange(current.tablet, previous.tablet),
    };
  },

  /**
   * Compare top pages between periods
   */
  async compareTopPages(
    currentRange: DateRange,
    previousRange: DateRange,
    limit: number = 10
  ): Promise<Array<{
    pagePath: string;
    pageTitle: string | null;
    currentViews: number;
    previousViews: number;
    change: number;
    changePercent: number;
  }>> {
    const [currentPages, previousPages] = await Promise.all([
      analyticsDataService.getTopPages(currentRange, limit),
      analyticsDataService.getTopPages(previousRange, 100),
    ]);

    const previousMap = new Map(previousPages.map((p) => [p.pagePath, p.views]));

    return currentPages.map((page) => {
      const previousViews = previousMap.get(page.pagePath) || 0;
      const change = page.views - previousViews;
      const changePercent = previousViews !== 0 ? (change / previousViews) * 100 : page.views > 0 ? 100 : 0;

      return {
        pagePath: page.pagePath,
        pageTitle: page.pageTitle,
        currentViews: page.views,
        previousViews,
        change,
        changePercent,
      };
    });
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a number with commas for readability
 * Only uses K/M/B suffix for very large numbers (100K+)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 100000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  // Show exact numbers with comma formatting for values under 100K
  return Math.round(num).toLocaleString();
};

/**
 * Format duration in seconds to human readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

/**
 * Format percentage with sign
 */
export const formatPercentChange = (percent: number): string => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
};

