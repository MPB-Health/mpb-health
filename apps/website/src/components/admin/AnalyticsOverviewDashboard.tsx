import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users,
  Eye,
  Clock,
  MousePointerClick,
  TrendingUp,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ComparisonSelector, MetricCard, TrendChart, DonutChart, BarChart } from './analytics';
import {
  type DatePreset,
  type SummaryComparison,
  getDateRangeFromPreset,
  getPreviousPeriod,
  analyticsComparisonService,
  formatDuration,
  formatNumber,
} from '../../lib/analyticsComparisonService';
import {
  analyticsDataService,
  type TrafficSource,
  type DeviceBreakdown,
  type GeoData,
  type PageMetrics,
  type DailyMetric,
} from '../../lib/analyticsDataService';

export const AnalyticsOverviewDashboard: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last30days');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request tracking to prevent race conditions
  const requestIdRef = useRef(0);
  const isLoadingRef = useRef(false);

  // Data states
  const [comparison, setComparison] = useState<SummaryComparison | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [comparisonDailyMetrics, setComparisonDailyMetrics] = useState<DailyMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown | null>(null);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [topPages, setTopPages] = useState<PageMetrics[]>([]);

  // Load all data with race condition prevention
  const loadData = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent requests unless force refresh
    if (isLoadingRef.current && !forceRefresh) {
      return;
    }

    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const currentRange = getDateRangeFromPreset(selectedPreset);
      const previousRange = getPreviousPeriod(currentRange);

      // Load all data in parallel with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const dataPromise = Promise.all([
        compareEnabled
          ? analyticsComparisonService.compareSummary(currentRange, previousRange)
          : null,
        analyticsDataService.getDailyMetrics(currentRange, 'sessions'),
        compareEnabled
          ? analyticsDataService.getDailyMetrics(previousRange, 'sessions')
          : null,
        analyticsDataService.getTrafficSources(currentRange),
        analyticsDataService.getDeviceBreakdown(currentRange),
        analyticsDataService.getGeoDistribution(currentRange),
        analyticsDataService.getTopPages(currentRange, 10),
      ]);

      const [
        comparisonData,
        dailyData,
        previousDailyData,
        sources,
        devices,
        geo,
        pages,
      ] = await Promise.race([dataPromise, timeoutPromise]) as [
        SummaryComparison | null,
        DailyMetric[],
        DailyMetric[] | null,
        TrafficSource[],
        DeviceBreakdown | null,
        GeoData[],
        PageMetrics[]
      ];

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setComparison(comparisonData);
        setDailyMetrics(dailyData);
        setComparisonDailyMetrics(previousDailyData || []);
        setTrafficSources(sources);
        setDeviceBreakdown(devices);
        setGeoData(geo);
        setTopPages(pages);
      }
    } catch (err) {
      // Only update error if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        console.error('Error loading analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [selectedPreset, compareEnabled]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    loadData(true); // Force refresh even if loading
  }, [loadData]);

  // Get source type colors
  const getSourceColor = (sourceType: string): string => {
    const colors: Record<string, string> = {
      direct: '#3b82f6',
      organic: '#22c55e',
      referral: '#f59e0b',
      social: '#ec4899',
      email: '#8b5cf6',
      paid: '#ef4444',
      other: '#6b7280',
    };
    return colors[sourceType] || colors.other;
  };

  // Format source type label
  const formatSourceLabel = (sourceType: string): string => {
    const labels: Record<string, string> = {
      direct: 'Direct',
      organic: 'Organic Search',
      referral: 'Referral',
      social: 'Social Media',
      email: 'Email',
      paid: 'Paid Ads',
      other: 'Other',
    };
    return labels[sourceType] || sourceType;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Analytics Overview
          </h2>
          <p className="text-neutral-600 mt-1">
            Track traffic, behavior, and performance metrics
          </p>
        </div>

        <ComparisonSelector
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          compareEnabled={compareEnabled}
          onCompareToggle={setCompareEnabled}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Failed to load analytics</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Sessions"
          value={comparison?.sessions.current || 0}
          previousValue={compareEnabled ? comparison?.sessions.previous : undefined}
          change={comparison?.sessions.change}
          changePercent={comparison?.sessions.changePercent}
          trend={comparison?.sessions.trend}
          icon={Users}
          iconColor="text-blue-600"
          bgGradient="from-blue-50 to-blue-100"
          loading={loading}
        />

        <MetricCard
          title="Page Views"
          value={comparison?.pageViews.current || 0}
          previousValue={compareEnabled ? comparison?.pageViews.previous : undefined}
          change={comparison?.pageViews.change}
          changePercent={comparison?.pageViews.changePercent}
          trend={comparison?.pageViews.trend}
          icon={Eye}
          iconColor="text-green-600"
          bgGradient="from-green-50 to-green-100"
          loading={loading}
        />

        <MetricCard
          title="Avg. Duration"
          value={comparison?.avgSessionDuration.current || 0}
          previousValue={compareEnabled ? comparison?.avgSessionDuration.previous : undefined}
          changePercent={comparison?.avgSessionDuration.changePercent}
          trend={comparison?.avgSessionDuration.trend}
          format="duration"
          icon={Clock}
          iconColor="text-purple-600"
          bgGradient="from-purple-50 to-purple-100"
          loading={loading}
        />

        <MetricCard
          title="Bounce Rate"
          value={comparison?.bounceRate?.current || 0}
          previousValue={compareEnabled ? comparison?.bounceRate?.previous : undefined}
          changePercent={comparison?.bounceRate?.changePercent}
          trend={comparison?.bounceRate?.trend}
          format="percent"
          icon={MousePointerClick}
          iconColor="text-orange-600"
          bgGradient="from-orange-50 to-orange-100"
          loading={loading}
          invertTrend // Lower bounce rate is better
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <div className="text-sm text-neutral-600 mb-1">Users</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {formatNumber(comparison?.users.current || 0)}
            </span>
            {compareEnabled && comparison?.users.trend !== 'neutral' && (
              <span
                className={`text-sm flex items-center gap-1 ${
                  comparison?.users.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison?.users.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(comparison?.users.changePercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-sm text-neutral-600 mb-1">New Users</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {formatNumber(comparison?.newUsers.current || 0)}
            </span>
            {compareEnabled && comparison?.newUsers.trend !== 'neutral' && (
              <span
                className={`text-sm flex items-center gap-1 ${
                  comparison?.newUsers.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison?.newUsers.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(comparison?.newUsers.changePercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-sm text-neutral-600 mb-1">Returning Users</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {formatNumber(comparison?.returningUsers.current || 0)}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-sm text-neutral-600 mb-1">Pages/Session</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {(comparison?.pagesPerSession.current || 0).toFixed(2)}
            </span>
            {compareEnabled && comparison?.pagesPerSession.trend !== 'neutral' && (
              <span
                className={`text-sm flex items-center gap-1 ${
                  comparison?.pagesPerSession.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison?.pagesPerSession.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(comparison?.pagesPerSession.changePercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Sessions Trend Chart */}
      <TrendChart
        title="Sessions Over Time"
        data={dailyMetrics.map((d) => ({ date: d.date, value: d.value }))}
        comparisonData={
          compareEnabled
            ? comparisonDailyMetrics.map((d) => ({ date: d.date, value: d.value }))
            : undefined
        }
        showComparison={compareEnabled}
        height={250}
        loading={loading}
      />

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <DonutChart
          title="Traffic Sources"
          data={trafficSources.slice(0, 6).map((source) => ({
            label: formatSourceLabel(source.sourceType),
            value: source.sessions,
            color: getSourceColor(source.sourceType),
          }))}
          loading={loading}
        />

        {/* Device Breakdown */}
        <DonutChart
          title="Device Breakdown"
          data={[
            { label: 'Desktop', value: deviceBreakdown?.desktop || 0, color: '#3b82f6' },
            { label: 'Mobile', value: deviceBreakdown?.mobile || 0, color: '#22c55e' },
            { label: 'Tablet', value: deviceBreakdown?.tablet || 0, color: '#8b5cf6' },
          ]}
          loading={loading}
        />
      </div>

      {/* Top Pages */}
      <BarChart
        title="Top Pages"
        data={topPages.map((page, index) => ({
          label: page.pageTitle || page.pagePath,
          value: page.views,
          color: index < 3 ? '#3b82f6' : '#94a3b8',
        }))}
        height={300}
        loading={loading}
      />

      {/* Geographic Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-neutral-900">Geographic Distribution</h3>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-neutral-100 rounded"></div>
            ))}
          </div>
        ) : geoData.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No geographic data available</p>
        ) : (
          <div className="space-y-3">
            {geoData.slice(0, 10).map((geo, index) => {
              const maxSessions = geoData[0]?.sessions || 1;
              const widthPercent = (geo.sessions / maxSessions) * 100;

              return (
                <div key={geo.country}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-neutral-900">{geo.country}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatNumber(geo.sessions)} sessions
                      </span>
                      <span className="text-xs text-neutral-500 ml-2">
                        ({(geo.bounceRate || 0).toFixed(1)}% bounce)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 ml-8">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-blue-500'
                          : index === 1
                          ? 'bg-blue-400'
                          : index === 2
                          ? 'bg-blue-300'
                          : 'bg-neutral-300'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* New vs Returning Users */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            New vs Returning
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-neutral-700">New Users</span>
              </div>
              <div className="text-3xl font-bold text-neutral-900">
                {formatNumber(comparison?.newUsers.current || 0)}
              </div>
              <div className="text-sm text-neutral-500">
                {comparison?.users.current
                  ? ((comparison.newUsers.current / comparison.users.current) * 100).toFixed(1)
                  : 0}
                % of total
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-neutral-700">Returning Users</span>
              </div>
              <div className="text-3xl font-bold text-neutral-900">
                {formatNumber(comparison?.returningUsers.current || 0)}
              </div>
              <div className="text-sm text-neutral-500">
                {comparison?.users.current
                  ? ((comparison.returningUsers.current / comparison.users.current) * 100).toFixed(1)
                  : 0}
                % of total
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Engagement Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600">Avg. Time on Site</div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatDuration(comparison?.avgSessionDuration.current || 0)}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600">Pages per Visit</div>
              <div className="text-2xl font-bold text-neutral-900">
                {(comparison?.pagesPerSession.current || 0).toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600">Bounce Rate</div>
              <div className="text-2xl font-bold text-neutral-900">
                {(comparison?.bounceRate?.current || 0).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600">Total Page Views</div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatNumber(comparison?.pageViews.current || 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

