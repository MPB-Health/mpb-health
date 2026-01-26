import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  Pill,
  Heart,
  CreditCard,
  Shield,
  Users,
  Bell,
  HelpCircle,
  Activity,
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { memberPortalService } from '../../lib/memberPortalService';
import type { MemberDashboardData } from '../../types/memberPortal';

const MemberPortalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setLoading(true);
      const data = await memberPortalService.getDashboardData(user.id);
      setDashboardData(data);
      setLoading(false);
    };

    loadDashboardData();
  }, [user?.id]);

  const portalSections = [
    {
      title: 'Claims',
      icon: FileText,
      description: 'Submit and track claims',
      href: '/member/portal/claims',
      color: 'blue',
      badge: dashboardData?.claim_summary.pending_claims || 0
    },
    {
      title: 'My Profile',
      icon: Users,
      description: 'Manage personal information',
      href: '/member/portal/profile',
      color: 'purple'
    },
    {
      title: 'Prescriptions',
      icon: Pill,
      description: 'View and manage prescriptions',
      href: '/member/portal/prescriptions',
      color: 'green',
      badge: dashboardData?.active_prescriptions.length || 0
    },
    {
      title: 'Health Records',
      icon: Activity,
      description: 'Access medical history',
      href: '/member/portal/health-records',
      color: 'red'
    },
    {
      title: 'Documents',
      icon: Upload,
      description: 'View and upload documents',
      href: '/member/portal/documents',
      color: 'orange'
    },
    {
      title: 'Payments',
      icon: CreditCard,
      description: 'Manage billing and payments',
      href: '/member/portal/payments',
      color: 'teal'
    },
    {
      title: 'Membership',
      icon: Shield,
      description: 'View plan and benefits',
      href: '/member/portal/coverage',
      color: 'cyan'
    },
    {
      title: 'Find Providers',
      icon: Heart,
      description: 'Search healthcare providers',
      href: '/member/portal/providers',
      color: 'pink'
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'View alerts and updates',
      href: '/member/portal/notifications',
      color: 'yellow',
      badge: dashboardData?.unread_notifications || 0
    },
    {
      title: 'Support',
      icon: HelpCircle,
      description: 'Get help and submit tickets',
      href: '/member/portal/support',
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100' },
      red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:bg-red-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'hover:bg-teal-100' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:bg-cyan-100' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'hover:bg-pink-100' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:bg-yellow-100' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100' }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Member Portal - MPB Health</title>
        <meta name="description" content="Complete member portal for managing your healthcare" />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">
              Welcome back, {dashboardData?.profile.first_name || user?.email?.split('@')[0] || 'Member'}
            </h1>
            <p className="text-lg text-neutral-600">
              Complete healthcare management at your fingertips
            </p>
          </div>

          {dashboardData && (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Total Claims</span>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {dashboardData.claim_summary.total_claims}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {dashboardData.claim_summary.pending_claims} pending
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">YTD Expenses</span>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    ${dashboardData.claim_summary.year_to_date_expenses.toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-neutral-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    ${dashboardData.claim_summary.year_to_date_reimbursed.toLocaleString()} reimbursed
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Active Rx</span>
                    <Pill className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {dashboardData.active_prescriptions.length}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    prescriptions
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Status</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {dashboardData.profile.membership_status}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    {dashboardData.coverage?.plan_name || 'No active plan'}
                  </div>
                </div>
              </div>

              {dashboardData.recent_claims.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">Recent Claims</h2>
                    <Link
                      to="/member/portal/claims"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.recent_claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold text-neutral-900">
                              {claim.claim_number}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              claim.status === 'paid' ? 'bg-green-100 text-green-800' :
                              claim.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              claim.status === 'denied' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {claim.status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-neutral-600">
                            {claim.provider_name} - {new Date(claim.service_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-neutral-900">
                            ${claim.total_amount.toFixed(2)}
                          </div>
                          {claim.approved_amount && (
                            <div className="text-sm text-green-600">
                              ${claim.approved_amount.toFixed(2)} approved
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Member Portal</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {portalSections.map((section) => {
                const Icon = section.icon;
                const colors = getColorClasses(section.color);
                return (
                  <Link
                    key={section.href}
                    to={section.href}
                    className="group relative bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-all duration-300"
                  >
                    {section.badge !== undefined && section.badge > 0 && (
                      <span className="absolute top-4 right-4 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                        {section.badge}
                      </span>
                    )}
                    <div className={`inline-flex p-3 rounded-lg ${colors.bg} ${colors.hover} transition-colors mb-4`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {section.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {dashboardData && dashboardData.unread_notifications > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    You have {dashboardData.unread_notifications} unread notification{dashboardData.unread_notifications !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Stay updated on your claims, payments, and important health information.
                  </p>
                  <Link
                    to="/member/portal/notifications"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Notifications
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-neutral-500">
            <p>Need help? Contact support at <a href="tel:8558164650" className="text-blue-600 hover:underline">(855) 816-4650</a> or <a href="mailto:support@mpb.health" className="text-blue-600 hover:underline">support@mpb.health</a></p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberPortalDashboard;
