import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  ExternalLink,
  Search,
  Share2,
  Mail,
  DollarSign,
  Link2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ComparisonSelector, DonutChart } from './analytics';
import {
  type DatePreset,
  getDateRangeFromPreset,
  getPreviousPeriod,
  formatNumber,
} from '../../lib/analyticsComparisonService';
import {
  analyticsDataService,
  type TrafficSource,
  type GeoData,
} from '../../lib/analyticsDataService';

export const TrafficAnalyticsPanel: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last30days');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [previousTrafficSources, setPreviousTrafficSources] = useState<TrafficSource[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [newVsReturning, setNewVsReturning] = useState<{ new: number; returning: number }>({
    new: 0,
    returning: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentRange = getDateRangeFromPreset(selectedPreset);
      const previousRange = getPreviousPeriod(currentRange);

      const [sources, prevSources, geo, nvr] = await Promise.all([
        analyticsDataService.getTrafficSources(currentRange),
        compareEnabled ? analyticsDataService.getTrafficSources(previousRange) : null,
        analyticsDataService.getGeoDistribution(currentRange),
        analyticsDataService.getNewVsReturning(currentRange),
      ]);

      setTrafficSources(sources);
      setPreviousTrafficSources(prevSources || []);
      setGeoData(geo);
      setNewVsReturning(nvr);
    } catch (error) {
      console.error('Error loading traffic data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPreset, compareEnabled]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get source icon
  const getSourceIcon = (sourceType: string) => {
    const icons: Record<string, typeof Globe> = {
      direct: Link2,
      organic: Search,
      referral: ExternalLink,
      social: Share2,
      email: Mail,
      paid: DollarSign,
    };
    return icons[sourceType] || Globe;
  };

  // Get source color
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

  // Format source label
  const formatSourceLabel = (sourceType: string): string => {
    const labels: Record<string, string> = {
      direct: 'Direct Traffic',
      organic: 'Organic Search',
      referral: 'Referral',
      social: 'Social Media',
      email: 'Email Campaigns',
      paid: 'Paid Advertising',
      other: 'Other Sources',
    };
    return labels[sourceType] || sourceType;
  };

  // Calculate change for a source
  const getSourceChange = (sourceType: string): number | null => {
    if (!compareEnabled) return null;
    const current = trafficSources.find((s) => s.sourceType === sourceType)?.sessions || 0;
    const previous = previousTrafficSources.find((s) => s.sourceType === sourceType)?.sessions || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Total sessions
  const totalSessions = trafficSources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Globe className="h-7 w-7 text-blue-600" />
            Traffic Analytics
          </h2>
          <p className="text-neutral-600 mt-1">
            Understand where your visitors come from
          </p>
        </div>

        <ComparisonSelector
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          compareEnabled={compareEnabled}
          onCompareToggle={setCompareEnabled}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* Traffic Source Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DonutChart
          title="Traffic Distribution"
          data={trafficSources.map((source) => ({
            label: formatSourceLabel(source.sourceType),
            value: source.sessions,
            color: getSourceColor(source.sourceType),
          }))}
          loading={loading}
        />

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Source Performance
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {trafficSources.slice(0, 6).map((source) => {
                const Icon = getSourceIcon(source.sourceType);
                const change = getSourceChange(source.sourceType);
                const percentage = totalSessions > 0 ? (source.sessions / totalSessions) * 100 : 0;

                return (
                  <div
                    key={source.sourceType}
                    className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${getSourceColor(source.sourceType)}20` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: getSourceColor(source.sourceType) }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-900">
                          {formatSourceLabel(source.sourceType)}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          {formatNumber(source.sessions)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-neutral-500">
                          {percentage.toFixed(1)}% of total
                        </span>
                        {change !== null && (
                          <span
                            className={`text-sm flex items-center gap-1 ${
                              change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* New vs Returning */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          New vs Returning Visitors
        </h3>
        {loading ? (
          <div className="animate-pulse h-32 bg-neutral-100 rounded"></div>
        ) : (
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-sm text-neutral-600">New Visitors</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatNumber(newVsReturning.new)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-600">Returning Visitors</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(newVsReturning.returning)}
                  </div>
                </div>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-neutral-100">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{
                    width: `${
                      newVsReturning.new + newVsReturning.returning > 0
                        ? (newVsReturning.new / (newVsReturning.new + newVsReturning.returning)) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${
                      newVsReturning.new + newVsReturning.returning > 0
                        ? (newVsReturning.returning / (newVsReturning.new + newVsReturning.returning)) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-neutral-500">
                <span>
                  {newVsReturning.new + newVsReturning.returning > 0
                    ? ((newVsReturning.new / (newVsReturning.new + newVsReturning.returning)) * 100).toFixed(1)
                    : 0}
                  % New
                </span>
                <span>
                  {newVsReturning.new + newVsReturning.returning > 0
                    ? ((newVsReturning.returning / (newVsReturning.new + newVsReturning.returning)) * 100).toFixed(1)
                    : 0}
                  % Returning
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Geographic Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-amber-600" />
          Top Countries
        </h3>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded"></div>
            ))}
          </div>
        ) : geoData.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No geographic data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium text-right">Sessions</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                  <th className="pb-3 font-medium text-right">Bounce Rate</th>
                  <th className="pb-3 font-medium w-32"></th>
                </tr>
              </thead>
              <tbody>
                {geoData.slice(0, 10).map((geo, index) => {
                  const maxSessions = geoData[0]?.sessions || 1;
                  const widthPercent = (geo.sessions / maxSessions) * 100;

                  return (
                    <tr key={geo.country} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3">
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
                          <span className="font-medium text-neutral-900">{geo.country}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium text-neutral-900">
                        {formatNumber(geo.sessions)}
                      </td>
                      <td className="py-3 text-right text-neutral-600">
                        {formatNumber(geo.users)}
                      </td>
                      <td className="py-3 text-right text-neutral-600">
                        {(geo.bounceRate || 0).toFixed(1)}%
                      </td>
                      <td className="py-3">
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Source Details Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Detailed Source Metrics
        </h3>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium text-right">Sessions</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                  <th className="pb-3 font-medium text-right">Page Views</th>
                  <th className="pb-3 font-medium text-right">Bounce Rate</th>
                  <th className="pb-3 font-medium text-right">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {trafficSources.map((source) => (
                  <tr key={source.sourceType} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSourceColor(source.sourceType) }}
                        />
                        <span className="font-medium text-neutral-900">
                          {formatSourceLabel(source.sourceType)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-neutral-900">
                      {formatNumber(source.sessions)}
                    </td>
                    <td className="py-3 text-right text-neutral-600">
                      {formatNumber(source.users)}
                    </td>
                    <td className="py-3 text-right text-neutral-600">
                      {formatNumber(source.pageViews)}
                    </td>
                    <td className="py-3 text-right text-neutral-600">
                      {(source.bounceRate || 0).toFixed(1)}%
                    </td>
                    <td className="py-3 text-right text-neutral-600">
                      {Math.floor(source.avgSessionDuration / 60)}:
                      {String(Math.floor(source.avgSessionDuration % 60)).padStart(2, '0')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

