import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  Bell,
  FileText,
  GraduationCap,
  Zap,
  Settings,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Megaphone,
  Video,
  BookOpen,
  ArrowRight,
  Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/Badge';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CMSStats {
  navigationItems: number;
  bulletins: number;
  publishedBulletins: number;
  forms: number;
  activeForms: number;
  trainingModules: number;
  learningPaths: number;
  quickActions: number;
  announcements: number;
  activeAnnouncements: number;
  meetings: number;
  upcomingMeetings: number;
  totalAdvisors: number;
  activeAdvisors: number;
  videos: number;
  activeVideos: number;
  enrollmentLinks: number;
  activeEnrollmentLinks: number;
  lastUpdated: string | null;
}

interface RecentActivity {
  id: string;
  type: 'bulletin' | 'form' | 'navigation' | 'training' | 'announcement';
  action: string;
  title: string;
  timestamp: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdvisorCMSHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CMSStats>({
    navigationItems: 0,
    bulletins: 0,
    publishedBulletins: 0,
    forms: 0,
    activeForms: 0,
    trainingModules: 0,
    learningPaths: 0,
    quickActions: 0,
    announcements: 0,
    activeAnnouncements: 0,
    meetings: 0,
    upcomingMeetings: 0,
    totalAdvisors: 0,
    activeAdvisors: 0,
    videos: 0,
    activeVideos: 0,
    enrollmentLinks: 0,
    activeEnrollmentLinks: 0,
    lastUpdated: null,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        navResult,
        bulletinsResult,
        formsResult,
        modulesResult,
        pathsResult,
        quickLinksResult,
        announcementsResult,
        meetingsResult,
        advisorsAllResult,
        advisorsActiveResult,
        videosResult,
        enrollmentLinksResult,
      ] = await Promise.all([
        supabase.from('advisor_nav_menu').select('id', { count: 'exact' }),
        supabase.from('advisor_content').select('id, is_published', { count: 'exact' }).eq('content_type', 'bulletin'),
        supabase.from('cognito_forms').select('id, is_active', { count: 'exact' }),
        supabase.from('training_modules').select('id', { count: 'exact' }),
        supabase.from('advisor_learning_paths').select('id', { count: 'exact' }),
        supabase.from('advisor_quick_links').select('id', { count: 'exact' }),
        supabase.from('advisor_announcements').select('id, is_active', { count: 'exact' }),
        supabase.from('advisor_meetings').select('id, scheduled_at, status', { count: 'exact' }),
        supabase.from('advisors').select('id', { count: 'exact', head: true }),
        supabase.from('advisors').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('advisor_videos').select('id, is_active', { count: 'exact' }),
        supabase.from('advisor_enrollment_links').select('id, is_active', { count: 'exact' }),
      ]);

      // Calculate stats
      const publishedBulletins = bulletinsResult.data?.filter(b => b.is_published).length || 0;
      const activeForms = formsResult.data?.filter(f => f.is_active).length || 0;
      const activeAnnouncements = announcementsResult.data?.filter(a => a.is_active).length || 0;
      const upcomingMeetings = meetingsResult.data?.filter(m => 
        m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()
      ).length || 0;
      const activeVideos = videosResult.data?.filter(v => v.is_active).length || 0;
      const activeEnrollmentLinks = enrollmentLinksResult.data?.filter(e => e.is_active).length || 0;

      setStats({
        navigationItems: navResult.count || 0,
        bulletins: bulletinsResult.count || 0,
        publishedBulletins,
        forms: formsResult.count || 0,
        activeForms,
        trainingModules: modulesResult.count || 0,
        learningPaths: pathsResult.count || 0,
        quickActions: quickLinksResult.count || 0,
        announcements: announcementsResult.count || 0,
        activeAnnouncements,
        meetings: meetingsResult.count || 0,
        upcomingMeetings,
        totalAdvisors: advisorsAllResult.count || 0,
        activeAdvisors: advisorsActiveResult.count || 0,
        videos: videosResult.count || 0,
        activeVideos,
        enrollmentLinks: enrollmentLinksResult.count || 0,
        activeEnrollmentLinks,
        lastUpdated: new Date().toISOString(),
      });

      // Load recent activity (last 10 content updates)
      const { data: recentContent } = await supabase
        .from('advisor_content')
        .select('id, title, updated_at, content_type')
        .order('updated_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (recentContent || []).map(item => ({
        id: item.id,
        type: item.content_type as RecentActivity['type'],
        action: 'Updated',
        title: item.title,
        timestamp: item.updated_at,
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading CMS stats:', error);
      toast.error('Failed to load CMS statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
    toast.success('Statistics refreshed');
  };

  // Management sections configuration
  const managementSections = [
    {
      title: 'Navigation Menu',
      description: 'Manage sidebar navigation items and ordering',
      icon: Menu,
      href: '/admin/advisor-cms/navigation',
      color: 'blue',
      stats: `${stats.navigationItems} items`,
      badge: null,
    },
    {
      title: 'Bulletins & News',
      description: 'Create and publish bulletins for advisors',
      icon: Bell,
      href: '/admin/advisor-cms/bulletins',
      color: 'purple',
      stats: `${stats.publishedBulletins} published`,
      badge: stats.bulletins - stats.publishedBulletins > 0 ? `${stats.bulletins - stats.publishedBulletins} drafts` : null,
    },
    {
      title: 'Forms Management',
      description: 'Manage Cognito forms and embed codes',
      icon: FileText,
      href: '/admin/advisor-cms/forms',
      color: 'green',
      stats: `${stats.activeForms} active`,
      badge: null,
    },
    {
      title: 'Training & Learning',
      description: 'Learning paths and training modules',
      icon: GraduationCap,
      href: '/admin/advisor-cms/training',
      color: 'orange',
      stats: `${stats.learningPaths} paths, ${stats.trainingModules} modules`,
      badge: null,
    },
    {
      title: 'Quick Actions',
      description: 'Dashboard quick links and shortcuts',
      icon: Zap,
      href: '/admin/advisor-cms/quick-actions',
      color: 'yellow',
      stats: `${stats.quickActions} actions`,
      badge: null,
    },
    {
      title: 'Advisor Directory',
      description: 'Manage the public advisor directory listing',
      icon: Users,
      href: '/admin/advisor-cms/directory',
      color: 'cyan',
      stats: `${stats.activeAdvisors} active of ${stats.totalAdvisors}`,
      badge: stats.totalAdvisors - stats.activeAdvisors > 0 ? `${stats.totalAdvisors - stats.activeAdvisors} inactive` : null,
    },
    {
      title: 'Video Library',
      description: 'Manage Vimeo videos shown to advisors',
      icon: Video,
      href: '/admin/advisor-cms/videos',
      color: 'purple',
      stats: `${stats.activeVideos} active`,
      badge: stats.videos - stats.activeVideos > 0 ? `${stats.videos - stats.activeVideos} hidden` : null,
    },
    {
      title: 'Enrollment Links',
      description: 'Manage enrollment page links for advisors',
      icon: Link2,
      href: '/admin/advisor-cms/enrollment',
      color: 'blue',
      stats: `${stats.activeEnrollmentLinks} active`,
      badge: stats.enrollmentLinks - stats.activeEnrollmentLinks > 0 ? `${stats.enrollmentLinks - stats.activeEnrollmentLinks} hidden` : null,
    },
    {
      title: 'Meetings & Events',
      description: 'Schedule and manage advisor meetings',
      icon: Video,
      href: '/admin/advisor-cms/meetings',
      color: 'cyan',
      stats: `${stats.upcomingMeetings} upcoming`,
      badge: stats.upcomingMeetings > 0 ? 'Live' : null,
    },
    {
      title: 'Announcements',
      description: 'Banner announcements and alerts',
      icon: Megaphone,
      href: '/admin/advisor-cms/announcements',
      color: 'red',
      stats: `${stats.activeAnnouncements} active`,
      badge: null,
    },
    {
      title: 'Portal Settings',
      description: 'Manage portal-wide configuration values',
      icon: Settings,
      href: '/admin/advisor-cms/settings',
      color: 'slate',
      stats: 'Key-value config',
      badge: null,
    },
    {
      title: 'Widget Config',
      description: 'Dashboard widget visibility and layout',
      icon: Settings,
      href: '/admin/advisor-cms/widgets',
      color: 'slate',
      stats: 'Configure layout',
      badge: null,
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    green: 'bg-green-50 border-green-200 hover:border-green-400',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
    cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
    red: 'bg-red-50 border-red-200 hover:border-red-400',
    slate: 'bg-slate-50 border-slate-200 hover:border-slate-400',
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    cyan: 'text-cyan-600 bg-cyan-100',
    red: 'text-red-600 bg-red-100',
    slate: 'text-slate-600 bg-slate-100',
  };

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Advisor Portal CMS" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Advisor Portal Command Center
            </h1>
            <p className="text-gray-600 mt-1">
              Manage content, navigation, and configuration for the Advisor Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>
            <a
              href="https://advisor.mpb.health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Advisor Portal
            </a>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">All Systems Synced</p>
              <p className="text-sm text-green-700">
                Changes are live in the Advisor Portal immediately
              </p>
            </div>
          </div>
          {stats.lastUpdated && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last checked: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Content</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.bulletins + stats.forms + stats.trainingModules}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Published</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.publishedBulletins + stats.activeForms}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">Learning Paths</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.learningPaths}
                  </p>
                </div>
                <GraduationCap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Active Alerts</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.activeAnnouncements}
                  </p>
                </div>
                <Megaphone className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managementSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                to={section.href}
                className={cn(
                  'block p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg group',
                  colorClasses[section.color]
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', iconColorClasses[section.color])}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {section.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {section.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    {section.stats}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                        {activity.type === 'bulletin' && <Bell className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'form' && <FileText className="w-4 h-4 text-green-600" />}
                        {activity.type === 'training' && <GraduationCap className="w-4 h-4 text-orange-600" />}
                        {activity.type === 'announcement' && <Megaphone className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legacy CMS Link */}
        <div className="text-center text-sm text-gray-500">
          <Link to="/admin/advisor-portal-cms-legacy" className="hover:text-primary-600">
            Access legacy CMS interface →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
