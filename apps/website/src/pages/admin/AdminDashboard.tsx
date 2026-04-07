import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Activity,
  Bell,
  Settings,
  Database,
  BarChart3,
  Clock,
  UserCheck,
  Mail,
  Sparkles,
  Send,
  HelpCircle,
  Book
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { AdminLayout, useAdminStats } from '../../components/admin/AdminLayout';
import { MarketingAnalyticsDashboard } from '../../components/admin/MarketingAnalyticsDashboard';
import { ContentManagementPanel } from '../../components/admin/ContentManagementPanel';
import { SiteConfigPanel } from '../../components/admin/SiteConfigPanel';
import { SEOManagementPanel } from '../../components/admin/SEOManagementPanel';
import { AnalyticsIntegrationPanel } from '../../components/admin/AnalyticsIntegrationPanel';
import { UTMCampaignBuilder } from '../../components/admin/UTMCampaignBuilder';
import { IntegrationHealthMonitor } from '../../components/admin/IntegrationHealthMonitor';
import { QuoteSubmissionsPanel } from '../../components/admin/QuoteSubmissionsPanel';
import { GeoLocationAdminPanel } from '../../components/admin/GeoLocationAdminPanel';
import { SocialMediaTrackingPanel } from '../../components/admin/SocialMediaTrackingPanel';
import { RealTimeAnalyticsPanel } from '../../components/admin/RealTimeAnalyticsPanel';
import { AnalyticsOverviewDashboard } from '../../components/admin/AnalyticsOverviewDashboard';
import { TrafficAnalyticsPanel } from '../../components/admin/TrafficAnalyticsPanel';
import { UserBehaviorPanel } from '../../components/admin/UserBehaviorPanel';
import { PagePerformancePanel } from '../../components/admin/PagePerformancePanel';
import { SEOAnalyticsDashboard } from '../../components/admin/SEOAnalyticsDashboard';

// Inner component that uses the stats context
const AdminDashboardContent: React.FC<{ activeView: string }> = ({ activeView }) => {
  // Use shared stats from AdminLayout context - automatically refreshes every 2 minutes
  const { stats } = useAdminStats();

  const adminSections: Array<{ title: string; icon: React.FC<{ className?: string }>; description: string; href: string; color: string; badge?: number; urgent?: boolean }> = [
    {
      title: 'Reports & Analytics',
      icon: BarChart3,
      description: 'View insights and generate reports',
      href: '/admin/reports',
      color: 'cyan'
    },
    {
      title: 'Membership Management',
      icon: Activity,
      description: 'Manage plans and benefits',
      href: '/admin/coverage',
      color: 'teal'
    },
    {
      title: 'Provider Directory',
      icon: UserCheck,
      description: 'Manage provider listings',
      href: '/admin/providers',
      color: 'pink'
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Send system notifications',
      href: '/admin/notifications',
      color: 'yellow'
    },
    {
      title: 'System Settings',
      icon: Settings,
      description: 'Configure system settings',
      href: '/admin/settings',
      color: 'gray'
    },
    {
      title: 'Advisor Training',
      icon: TrendingUp,
      description: 'Manage training content',
      href: '/admin/advisor-training',
      color: 'violet'
    },
    {
      title: 'Blog Management',
      icon: Book,
      description: 'Create and manage blog articles',
      href: '/admin/blog',
      color: 'indigo',
      badge: stats.total_blog_articles
    },
    {
      title: 'Resource Library',
      icon: Database,
      description: 'Manage resources and downloads',
      href: '/admin/resources',
      color: 'emerald'
    },
    {
      title: 'Newsletter Subscribers',
      icon: Mail,
      description: 'Manage newsletter subscriptions',
      href: '/admin/newsletter-subscribers',
      color: 'sky'
    },
    {
      title: 'AI Blog Generator',
      icon: Sparkles,
      description: 'Generate blog posts with Gemini AI',
      href: '/admin/gemini-blog-generator',
      color: 'fuchsia'
    },
    {
      title: 'Newsletter Campaigns',
      icon: Send,
      description: 'Create and manage campaigns',
      href: '/admin/newsletter-campaigns',
      color: 'rose'
    },
    {
      title: 'FAQ Management',
      icon: HelpCircle,
      description: 'Manage FAQ and Why Choose content',
      href: '/admin/faq',
      color: 'amber'
    },
    {
      title: 'Member Handbooks',
      icon: Book,
      description: 'Access and share handbook links',
      href: '/admin/handbooks',
      color: 'cyan'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:bg-red-100', border: 'border-red-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100', border: 'border-orange-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'hover:bg-teal-100', border: 'border-teal-200' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:bg-cyan-100', border: 'border-cyan-200' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'hover:bg-pink-100', border: 'border-pink-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:bg-yellow-100', border: 'border-yellow-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100', border: 'border-gray-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', border: 'border-indigo-200' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:bg-violet-100', border: 'border-violet-200' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:bg-emerald-100', border: 'border-emerald-200' },
      sky: { bg: 'bg-sky-50', text: 'text-sky-600', hover: 'hover:bg-sky-100', border: 'border-sky-200' },
      fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', hover: 'hover:bg-fuchsia-100', border: 'border-fuchsia-200' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:bg-rose-100', border: 'border-rose-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:bg-amber-100', border: 'border-amber-200' }
    };
    return colors[color] || colors.blue;
  };

  // Render the Overview content
  const renderOverview = () => (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to Admin Control Center</h1>
        <p className="text-neutral-600">Manage your site, view analytics, and optimize your team's performance.</p>
      </div>

      {/* Urgent Actions Alert */}
      {stats.pending_support_tickets > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Action Required</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-neutral-700">
                      <strong>{stats.pending_support_tickets}</strong> support tickets need attention
                    </span>
                  </div>
                  <Link 
                    to="/admin/support" 
                    className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    View Tickets
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-900/70">Total Advisors</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{stats.total_advisors}</div>
          <div className="mt-2 flex items-center text-sm">
            <UserCheck className="h-4 w-4 text-emerald-600 mr-1" />
            <span className="text-blue-800/70">{stats.advisors_with_accounts} with accounts</span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-900/70">Julia's Quote Leads</span>
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">{stats.total_quote_leads}</div>
          <div className="mt-2 flex items-center text-sm">
            <Clock className="h-4 w-4 text-amber-600 mr-1" />
            <span className="text-purple-800/70">{stats.pending_quote_leads} pending sync</span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-900/70">Total Leads</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-900">{stats.total_quote_leads}</div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
            <span className="text-emerald-800/70">{stats.new_leads_today} new today</span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-rose-900/70">Newsletter Subscribers</span>
            <Mail className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-900">{stats.total_newsletter_subscribers}</div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
            <span className="text-rose-800/70">{stats.new_subscribers_this_month} new this month</span>
          </div>
        </Card>
      </div>

      {/* Help Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">Advisor Login</h3>
          <p className="text-sm text-gray-600 mb-4">
            Quick access to the advisor dashboard to verify updates.
          </p>
          <Link
            to="/advisor/dashboard"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium border border-neutral-300 bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-sm hover:shadow-md rounded-xl transition-all duration-200"
          >
            Open Advisor Dashboard
          </Link>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <h3 className="font-semibold text-gray-900 mb-2">MPB Health IT Support Login</h3>
          <p className="text-sm text-gray-600 mb-4">
            Access the main support portal for IT and technical assistance.
          </p>
          <a
            href="https://support.mpb.health/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium border border-neutral-300 bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-sm hover:shadow-md rounded-xl transition-all duration-200"
          >
            IT Support Portal
          </a>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-2">Marketing Suite</h3>
          <p className="text-sm text-gray-600 mb-4">
            Access the Content Optimization System for marketing campaigns.
          </p>
          <a
            href="https://cos.mpowering.cloud/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium border border-neutral-300 bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-sm hover:shadow-md rounded-xl transition-all duration-200"
          >
            Open Marketing Suite
          </a>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <h3 className="font-semibold text-gray-900 mb-2">Zoho CRM</h3>
          <p className="text-sm text-gray-600 mb-4">
            Access Zoho CRM for customer relationship management.
          </p>
          <a
            href="https://accounts.zoho.com/signin?servicename=ZohoCRM&signupurl=https://www.zoho.com/crm/signup.html&serviceurl=https%3A%2F%2Fcrm.zoho.com%2Fcrm%2FShowHomePage.do"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium border border-neutral-300 bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-sm hover:shadow-md rounded-xl transition-all duration-200"
          >
            Open Zoho CRM
          </a>
        </Card>
      </div>

      {/* Quick Access Tools Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Access</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {adminSections.slice(0, 8).map((section) => {
            const Icon = section.icon;
            const colors = getColorClasses(section.color);
            return (
              <Link
                key={section.href}
                to={section.href}
                className={`group relative bg-white rounded-xl shadow-sm border ${section.urgent ? 'border-red-300 ring-2 ring-red-200' : 'border-neutral-200'} p-5 hover:shadow-md transition-all duration-300`}
              >
                {section.badge !== undefined && section.badge > 0 && (
                  <span className={`absolute top-3 right-3 inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white rounded-full ${section.urgent ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                    {section.badge}
                  </span>
                )}
                <div className={`inline-flex p-3 rounded-xl ${colors.bg} ${colors.hover} transition-colors mb-3`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-neutral-600">{section.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-neutral-500 py-4 border-t border-neutral-200">
        <p>Admin access restricted to authorized staff only</p>
      </div>
    </>
  );

  // Render the content based on activeView
  switch (activeView) {
    case 'overview':
      return renderOverview();
    case 'live':
      return <RealTimeAnalyticsPanel />;
    case 'analytics':
      return <AnalyticsOverviewDashboard />;
    case 'traffic':
      return <TrafficAnalyticsPanel />;
    case 'behavior':
      return <UserBehaviorPanel />;
    case 'pages':
      return <PagePerformancePanel />;
    case 'marketing':
      return <MarketingAnalyticsDashboard />;
    case 'social':
      return <SocialMediaTrackingPanel />;
    case 'campaigns':
      return <UTMCampaignBuilder />;
    case 'quotes':
      return <QuoteSubmissionsPanel />;
    case 'content':
      return <ContentManagementPanel />;
    case 'seoanalytics':
      return <SEOAnalyticsDashboard />;
    case 'seo':
      return <SEOManagementPanel />;
    case 'settings':
      return <SiteConfigPanel />;
    case 'geo':
      return <GeoLocationAdminPanel />;
    case 'integrations':
      return <AnalyticsIntegrationPanel />;
    case 'health':
      return <IntegrationHealthMonitor />;
    default:
      return renderOverview();
  }
};

const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<string>(
    searchParams.get('view') || 'overview'
  );

  // Sync activeView with URL query params when they change
  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl && viewFromUrl !== activeView) {
      setActiveView(viewFromUrl);
    }
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>Admin Control Center - MPB Health</title>
        <meta name="description" content="Complete site management and administration dashboard" />
      </Helmet>

      <AdminLayout activeView={activeView} onViewChange={setActiveView}>
        <AdminDashboardContent activeView={activeView} />
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;
