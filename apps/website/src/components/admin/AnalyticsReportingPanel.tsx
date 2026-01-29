import React, { useEffect, useState } from 'react';
import { Download, Calendar, TrendingUp, Users, Eye, MousePointerClick, DollarSign, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { adminAnalyticsService, SiteAnalytics } from '../../lib/adminAnalyticsService';
import { AnalyticsDataEntryPanel } from './AnalyticsDataEntryPanel';

export const AnalyticsReportingPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<SiteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [showDataEntry, setShowDataEntry] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();

      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const data = await adminAnalyticsService.getSiteAnalytics(
        startDate.toISOString().split('T')[0],
        endDate
      );

      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    return analytics.reduce(
      (acc, day) => ({
        pageViews: acc.pageViews + day.page_views,
        uniqueVisitors: acc.uniqueVisitors + day.unique_visitors,
        avgBounceRate: acc.avgBounceRate + day.bounce_rate,
        avgSessionDuration: acc.avgSessionDuration + day.avg_session_duration,
        avgConversionRate: acc.avgConversionRate + day.conversion_rate
      }),
      { pageViews: 0, uniqueVisitors: 0, avgBounceRate: 0, avgSessionDuration: 0, avgConversionRate: 0 }
    );
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Page Views', 'Unique Visitors', 'Bounce Rate', 'Avg Session Duration', 'Conversion Rate'],
      ...analytics.map(a => [
        a.date,
        a.page_views,
        a.unique_visitors,
        a.bounce_rate.toFixed(2),
        a.avg_session_duration,
        a.conversion_rate.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading analytics...</div>
      </div>
    );
  }

  const totals = getTotals();
  const avgBounceRate = analytics.length > 0 ? totals.avgBounceRate / analytics.length : 0;
  const avgSessionDuration = analytics.length > 0 ? totals.avgSessionDuration / analytics.length : 0;
  const avgConversionRate = analytics.length > 0 ? totals.avgConversionRate / analytics.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analytics & Reporting</h2>
          <p className="text-neutral-600">Site performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={exportData} variant="secondary" className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowDataEntry(!showDataEntry)} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {showDataEntry ? 'Hide Entry' : 'Add Data'}
          </Button>
        </div>
      </div>

      {/* Data Entry Panel */}
      {showDataEntry && (
        <AnalyticsDataEntryPanel />
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Page Views</span>
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {totals.pageViews.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {Math.round(totals.pageViews / analytics.length)} per day avg
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Unique Visitors</span>
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">
            {totals.uniqueVisitors.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-green-700">
            {Math.round(totals.uniqueVisitors / analytics.length)} per day avg
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Bounce Rate</span>
            <MousePointerClick className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-900">
            {avgBounceRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-sm text-orange-700">
            Average across period
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Conversion Rate</span>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {avgConversionRate.toFixed(2)}%
          </div>
          <div className="mt-2 text-sm text-purple-700">
            Average conversion
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Traffic Trend
        </h3>

        <div className="space-y-3">
          {analytics.slice(0, 14).reverse().map((day) => {
            const maxViews = Math.max(...analytics.map(a => a.page_views));
            const widthPercent = (day.page_views / maxViews) * 100;

            return (
              <div key={day.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 w-24">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-neutral-200 rounded-full h-8">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-xs font-medium transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {widthPercent > 15 && day.page_views.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-40">
                    <div className="text-neutral-900 font-semibold">
                      {day.page_views.toLocaleString()} views
                    </div>
                    <div className="text-xs text-neutral-500">
                      {day.unique_visitors.toLocaleString()} visitors
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm text-neutral-600">Avg Session Duration</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {Math.floor(avgSessionDuration / 60)}:{(avgSessionDuration % 60).toFixed(0).padStart(2, '0')}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm text-neutral-600">Pages per Session</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {(totals.pageViews / totals.uniqueVisitors || 0).toFixed(2)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-600">Engagement Rate</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {(100 - avgBounceRate).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${100 - avgBounceRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-600">Conversion Success</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {avgConversionRate.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(avgConversionRate * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-600">Visitor Retention</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {((totals.uniqueVisitors / totals.pageViews) * 100 || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(totals.uniqueVisitors / totals.pageViews) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
