import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  Users,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  TrendingUp,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../ui/Card';
import {
  subscribeToPageViews,
  unsubscribeFromPageViews,
  getRealTimeStats,
  getTodayHourlyBreakdown,
  getGeographicDistribution,
  type PageView,
  type RealTimeStats,
} from '../../lib/realTimeAnalyticsService';

export const RealTimeAnalyticsPanel: React.FC = () => {
  const [stats, setStats] = useState<RealTimeStats>({
    activeVisitors: 0,
    pageViewsLast5Min: 0,
    topPagesNow: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
    recentPageViews: [],
  });
  const [hourlyData, setHourlyData] = useState<Array<{ hour: number; count: number }>>([]);
  const [geoData, setGeoData] = useState<Array<{ country: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const feedRef = useRef<HTMLDivElement>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [realTimeStats, hourly, geo] = await Promise.all([
        getRealTimeStats(),
        getTodayHourlyBreakdown(),
        getGeographicDistribution(),
      ]);

      setStats(realTimeStats);
      setHourlyData(hourly);
      setGeoData(geo);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading real-time analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle new page view from realtime subscription
  const handleNewPageView = useCallback((pageView: PageView) => {
    setStats((prev) => ({
      ...prev,
      recentPageViews: [pageView, ...prev.recentPageViews].slice(0, 20),
      pageViewsLast5Min: prev.pageViewsLast5Min + 1,
    }));
    setLastUpdate(new Date());
  }, []);

  // Setup realtime subscription and polling
  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    if (isLive) {
      subscribeToPageViews(handleNewPageView);
    }

    // Poll for updated stats every 30 seconds
    const pollInterval = setInterval(() => {
      if (isLive) {
        loadData();
      }
    }, 30000);

    return () => {
      unsubscribeFromPageViews();
      clearInterval(pollInterval);
    };
  }, [isLive, loadData, handleNewPageView]);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Get device icon
  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Tablet className="h-3 w-3" />;
      case 'desktop':
        return <Monitor className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3 opacity-50" />;
    }
  };

  // Get max count for hourly chart scaling
  const maxHourlyCount = Math.max(...hourlyData.map((h) => h.count), 1);
  const currentHour = new Date().getHours();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-neutral-600">Loading real-time analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            <div className="relative">
              <Activity className="h-7 w-7 text-emerald-600" />
              {isLive && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </div>
            Real-Time Analytics
          </h2>
          <p className="text-neutral-600 mt-1">
            Live website activity • Last updated {formatTimeAgo(lastUpdate.toISOString())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isLive
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
            }`}
          >
            <Zap className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-900">Active Now</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-4xl font-bold text-emerald-900 flex items-center gap-2">
            {stats.activeVisitors}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-1">visitors in last 5 min</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Page Views</span>
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-blue-900">{stats.pageViewsLast5Min}</div>
          <p className="text-xs text-blue-700 mt-1">in last 5 minutes</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-900">Top Page</span>
            <TrendingUp className="h-5 w-5 text-violet-600" />
          </div>
          <div className="text-lg font-bold text-violet-900 truncate">
            {stats.topPagesNow[0]?.path || '-'}
          </div>
          <p className="text-xs text-violet-700 mt-1">
            {stats.topPagesNow[0]?.count || 0} views right now
          </p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-900">Locations</span>
            <Globe className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-amber-900">{geoData.length}</div>
          <p className="text-xs text-amber-700 mt-1">countries active now</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            Live Activity Feed
            <span className="ml-auto text-xs font-normal text-neutral-500">
              Showing last 20 views
            </span>
          </h3>
          <div
            ref={feedRef}
            className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-300"
          >
            {stats.recentPageViews.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-xs mt-1">Page views will appear here in real-time</p>
              </div>
            ) : (
              stats.recentPageViews.map((pv, index) => (
                <div
                  key={pv.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === 0 && isLive
                      ? 'bg-emerald-50 border border-emerald-200 animate-pulse'
                      : 'bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex-shrink-0 text-neutral-400">
                    {getDeviceIcon(pv.device_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {pv.title || pv.path}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{pv.path}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {pv.country && (
                      <span className="px-2 py-0.5 bg-neutral-200 rounded text-neutral-600">
                        {pv.country}
                      </span>
                    )}
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(pv.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Device Breakdown */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Devices
          </h3>
          <div className="space-y-4">
            {[
              {
                type: 'desktop',
                label: 'Desktop',
                icon: Monitor,
                count: stats.deviceBreakdown.desktop,
                color: 'blue',
              },
              {
                type: 'mobile',
                label: 'Mobile',
                icon: Smartphone,
                count: stats.deviceBreakdown.mobile,
                color: 'green',
              },
              {
                type: 'tablet',
                label: 'Tablet',
                icon: Tablet,
                count: stats.deviceBreakdown.tablet,
                color: 'purple',
              },
            ].map((device) => {
              const total =
                stats.deviceBreakdown.desktop +
                stats.deviceBreakdown.mobile +
                stats.deviceBreakdown.tablet +
                stats.deviceBreakdown.unknown;
              const percentage = total > 0 ? (device.count / total) * 100 : 0;
              const Icon = device.icon;

              return (
                <div key={device.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 text-${device.color}-600`} />
                      <span className="text-sm text-neutral-700">{device.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {device.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        device.color === 'blue'
                          ? 'bg-blue-500'
                          : device.color === 'green'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Geographic Distribution */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-600" />
              Active Locations
            </h4>
            <div className="space-y-2">
              {geoData.slice(0, 5).map((geo) => (
                <div key={geo.country} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">{geo.country}</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {geo.count} visitor{geo.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              {geoData.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-2">No location data yet</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Activity Chart */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-600" />
          Today's Activity
          <span className="ml-auto text-xs font-normal text-neutral-500">
            Page views by hour
          </span>
        </h3>
        <div className="flex items-end gap-1 h-32">
          {hourlyData.map((hour) => {
            const heightPercent = maxHourlyCount > 0 ? (hour.count / maxHourlyCount) * 100 : 0;
            const isCurrentHour = hour.hour === currentHour;
            const isPastHour = hour.hour < currentHour;

            return (
              <div
                key={hour.hour}
                className="flex-1 flex flex-col items-center group"
                title={`${hour.hour}:00 - ${hour.count} views`}
              >
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all duration-300 ${
                      isCurrentHour
                        ? 'bg-emerald-500'
                        : isPastHour
                        ? 'bg-blue-400 group-hover:bg-blue-500'
                        : 'bg-neutral-200'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isCurrentHour ? 'text-emerald-600 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {hour.hour % 3 === 0 ? `${hour.hour}` : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
      </Card>

      {/* Top Pages Right Now */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          Top Pages Right Now
        </h3>
        <div className="space-y-3">
          {stats.topPagesNow.length === 0 ? (
            <p className="text-center text-neutral-500 py-4">No active pages</p>
          ) : (
            stats.topPagesNow.map((page, index) => {
              const maxCount = stats.topPagesNow[0]?.count || 1;
              const widthPercent = (page.count / maxCount) * 100;

              return (
                <div key={page.path} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : index === 1
                            ? 'bg-blue-100 text-blue-700'
                            : index === 2
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 truncate max-w-md">
                        {page.title || page.path}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">
                      {page.count} view{page.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 ml-8">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-emerald-500'
                          : index === 1
                          ? 'bg-blue-500'
                          : index === 2
                          ? 'bg-violet-500'
                          : 'bg-neutral-400'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 ml-8 truncate">{page.path}</p>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

