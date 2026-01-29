import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Download, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  BarChart3,
  Activity,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';

interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

interface _ReportSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics: ReportMetric[];
  downloadable: boolean;
}

const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30');
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [reportData, setReportData] = useState<{
    totalMembers: number;
    newMembers: number;
    activeMembers: number;
    totalRevenue: number;
    totalClaims: number;
    approvedClaims: number;
    avgClaimAmount: number;
    supportTickets: number;
    resolvedTickets: number;
  }>({
    totalMembers: 0,
    newMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    totalClaims: 0,
    approvedClaims: 0,
    avgClaimAmount: 0,
    supportTickets: 0,
    resolvedTickets: 0
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);

    // Helper to safely query tables that might not exist
    const safeQuery = async <T,>(
      query: Promise<{ data: T[] | null; error: any; count: number | null }>
    ): Promise<{ data: T[] | null; count: number | null }> => {
      try {
        const result = await query;
        if (result.error?.message?.includes('schema cache') || 
            result.error?.code === 'PGRST204' ||
            result.error?.code === 'PGRST205') {
          return { data: [], count: 0 };
        }
        if (result.error) {
          console.warn('Query warning:', result.error.message);
          return { data: [], count: 0 };
        }
        return { data: result.data, count: result.count };
      } catch {
        return { data: [], count: 0 };
      }
    };

    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      const dateFilter = daysAgo.toISOString();

      const [
        membersResult,
        newMembersResult,
        activeMembersResult,
        revenueResult,
        claimsResult,
        approvedClaimsResult,
        ticketsResult,
        resolvedTicketsResult
      ] = await Promise.all([
        safeQuery(supabase.from('member_profiles').select('id', { count: 'exact', head: true })),
        safeQuery(supabase.from('member_profiles').select('id', { count: 'exact', head: true }).gte('created_at', dateFilter)),
        safeQuery(supabase.from('member_profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'active')),
        safeQuery(supabase.from('transactions').select('amount').eq('status', 'completed').eq('transaction_type', 'membership_fee').gte('created_at', dateFilter)),
        safeQuery(supabase.from('claims').select('id, total_amount', { count: 'exact' }).gte('created_at', dateFilter)),
        safeQuery(supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', dateFilter)),
        safeQuery(supabase.from('support_tickets').select('id', { count: 'exact', head: true }).gte('created_at', dateFilter)),
        safeQuery(supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', dateFilter))
      ]);

      const totalRevenue = (revenueResult.data as { amount?: number }[] | null)?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const claimsData = (claimsResult.data as { total_amount?: number }[] | null) || [];
      const avgClaimAmount = claimsData.length > 0 
        ? claimsData.reduce((sum, c) => sum + (c.total_amount || 0), 0) / claimsData.length 
        : 0;

      setReportData({
        totalMembers: membersResult.count || 0,
        newMembers: newMembersResult.count || 0,
        activeMembers: activeMembersResult.count || 0,
        totalRevenue,
        totalClaims: claimsResult.count || 0,
        approvedClaims: approvedClaimsResult.count || 0,
        avgClaimAmount,
        supportTickets: ticketsResult.count || 0,
        resolvedTickets: resolvedTicketsResult.count || 0
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'membership', label: 'Membership', icon: <Users className="h-5 w-5" /> },
    { id: 'financial', label: 'Financial', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'claims', label: 'Claims', icon: <FileText className="h-5 w-5" /> },
    { id: 'support', label: 'Support', icon: <Activity className="h-5 w-5" /> }
  ];

  const handleExportReport = (reportType: string) => {
    const data = getReportExportData(reportType);
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getReportExportData = (reportType: string) => {
    switch (reportType) {
      case 'membership':
        return [
          { Metric: 'Total Members', Value: reportData.totalMembers },
          { Metric: 'Active Members', Value: reportData.activeMembers },
          { Metric: 'New Members', Value: reportData.newMembers }
        ];
      case 'financial':
        return [
          { Metric: 'Total Revenue', Value: reportData.totalRevenue },
          { Metric: 'Avg Claim Amount', Value: reportData.avgClaimAmount }
        ];
      case 'claims':
        return [
          { Metric: 'Total Claims', Value: reportData.totalClaims },
          { Metric: 'Approved Claims', Value: reportData.approvedClaims },
          { Metric: 'Approval Rate', Value: `${reportData.totalClaims > 0 ? ((reportData.approvedClaims / reportData.totalClaims) * 100).toFixed(1) : 0}%` }
        ];
      default:
        return [
          { Metric: 'Total Members', Value: reportData.totalMembers },
          { Metric: 'Total Revenue', Value: reportData.totalRevenue },
          { Metric: 'Total Claims', Value: reportData.totalClaims }
        ];
    }
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-10 w-10 text-blue-600" />
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +{reportData.newMembers}
            </span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{reportData.totalMembers}</div>
          <div className="text-sm text-neutral-600 mt-1">Total Members</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-10 w-10 text-green-600" />
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              MTD
            </span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{formatCurrency(reportData.totalRevenue)}</div>
          <div className="text-sm text-neutral-600 mt-1">Total Revenue</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <FileText className="h-10 w-10 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">
              {reportData.totalClaims > 0 ? ((reportData.approvedClaims / reportData.totalClaims) * 100).toFixed(0) : 0}% approved
            </span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{reportData.totalClaims}</div>
          <div className="text-sm text-neutral-600 mt-1">Total Claims</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-10 w-10 text-orange-600" />
            <span className="text-sm font-medium text-green-600">
              {reportData.resolvedTickets} resolved
            </span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{reportData.supportTickets}</div>
          <div className="text-sm text-neutral-600 mt-1">Support Tickets</div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Membership Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Active Members</span>
              <span className="font-semibold text-green-600">{reportData.activeMembers}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${reportData.totalMembers > 0 ? (reportData.activeMembers / reportData.totalMembers) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">New This Period</span>
              <span className="font-semibold text-blue-600">{reportData.newMembers}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Claims Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Approval Rate</span>
              <span className="font-semibold text-green-600">
                {reportData.totalClaims > 0 ? ((reportData.approvedClaims / reportData.totalClaims) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${reportData.totalClaims > 0 ? (reportData.approvedClaims / reportData.totalClaims) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Avg Claim Amount</span>
              <span className="font-semibold text-purple-600">{formatCurrency(reportData.avgClaimAmount)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Reports & Analytics - Admin - MPB Health</title>
        <meta name="description" content="View insights and generate comprehensive reports" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminBreadcrumb currentPage="Reports & Analytics" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Reports & Analytics</h1>
                <p className="mt-2 text-neutral-600">View insights and generate comprehensive reports</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={loadReportData}>
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExportReport(activeReport)}>
                  <Download className="h-5 w-5" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Date Range & Report Type Selection */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-neutral-600" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="180">Last 6 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {reportTypes.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeReport === report.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {report.icon}
                    {report.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Report Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-neutral-600">Loading report data...</p>
            </div>
          ) : (
            renderOverviewReport()
          )}

          {/* Available Reports */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Available Reports</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">Membership Report</h3>
                    <p className="text-sm text-neutral-600 mt-1">Detailed breakdown of member demographics and status</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleExportReport('membership')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">Financial Report</h3>
                    <p className="text-sm text-neutral-600 mt-1">Revenue, transactions, and payment analytics</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleExportReport('financial')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">Claims Report</h3>
                    <p className="text-sm text-neutral-600 mt-1">Claims processing metrics and trends</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleExportReport('claims')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsAnalytics;

