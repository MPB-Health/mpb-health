import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, MousePointerClick, Users, BarChart3, Target, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { adminAnalyticsService, MarketingCampaign } from '../../lib/adminAnalyticsService';

interface ROIData {
  channel: string;
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  totalConversions: number;
  roi: number;
  cpa: number;
}

export const MarketingAnalyticsDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      const [campaignsData, roiData] = await Promise.all([
        adminAnalyticsService.getMarketingCampaigns('active'),
        adminAnalyticsService.getMarketingROI()
      ]);

      setCampaigns(campaignsData);
      setRoiData(roiData as ROIData[]);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalMetrics = () => {
    return campaigns.reduce(
      (acc, campaign) => ({
        spent: acc.spent + (campaign.spent || 0),
        revenue: acc.revenue + (campaign.revenue || 0),
        conversions: acc.conversions + (campaign.conversions || 0),
        impressions: acc.impressions + (campaign.impressions || 0),
        clicks: acc.clicks + (campaign.clicks || 0)
      }),
      { spent: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
    );
  };

  const totalMetrics = getTotalMetrics();
  const overallROI = totalMetrics.spent > 0
    ? ((totalMetrics.revenue - totalMetrics.spent) / totalMetrics.spent) * 100
    : 0;
  const averageCTR = totalMetrics.impressions > 0
    ? (totalMetrics.clicks / totalMetrics.impressions) * 100
    : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading marketing analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Marketing Analytics</h2>
        <p className="text-neutral-600">Campaign performance and ROI tracking</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Total Spent</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">
            ${totalMetrics.spent.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-sm text-blue-700">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Across {campaigns.length} campaigns</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Revenue</span>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">
            ${totalMetrics.revenue.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-sm text-green-700">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>ROI: {overallROI.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Conversions</span>
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {totalMetrics.conversions.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-sm text-purple-700">
            <Users className="h-4 w-4 mr-1" />
            <span>From all channels</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Avg CTR</span>
            <MousePointerClick className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-900">
            {averageCTR.toFixed(2)}%
          </div>
          <div className="mt-2 flex items-center text-sm text-orange-700">
            <Eye className="h-4 w-4 mr-1" />
            <span>{totalMetrics.impressions.toLocaleString()} impressions</span>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            ROI by Channel
          </h3>
          <div className="space-y-4">
            {roiData.map((channel) => (
              <div key={channel.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 capitalize">
                    {channel.channel.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-600">
                      ${channel.totalSpent.toLocaleString()} spent
                    </span>
                    <span className={`text-sm font-semibold ${channel.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {channel.roi >= 0 ? '+' : ''}{channel.roi.toFixed(1)}% ROI
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${channel.roi >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(channel.roi), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{channel.totalConversions} conversions</span>
                  <span>${channel.cpa.toFixed(2)} CPA</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Active Campaigns
          </h3>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => {
              const campaignROI = campaign.spent > 0
                ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100
                : 0;

              return (
                <div
                  key={campaign.id}
                  className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-neutral-900">{campaign.name}</h4>
                      <p className="text-xs text-neutral-500 capitalize">{campaign.channel.replace('_', ' ')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      campaignROI >= 50 ? 'bg-green-100 text-green-800' :
                      campaignROI >= 0 ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaignROI >= 0 ? '+' : ''}{campaignROI.toFixed(0)}% ROI
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-500">Spent:</span>
                      <span className="ml-1 font-medium text-neutral-700">
                        ${campaign.spent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Revenue:</span>
                      <span className="ml-1 font-medium text-neutral-700">
                        ${campaign.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Conv:</span>
                      <span className="ml-1 font-medium text-neutral-700">
                        {campaign.conversions}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
