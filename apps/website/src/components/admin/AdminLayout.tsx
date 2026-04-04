import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminStatsBar } from './AdminStatsBar';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { getRealTimeStats, getTodayHourlyBreakdown } from '../../lib/realTimeAnalyticsService';
import { analyticsDataService } from '../../lib/analyticsDataService';

export interface AdminStats {
  // Web Analytics Stats (for top bar)
  activeNow: number;
  pageViewsToday: number;
  topTrafficSource: { name: string; sessions: number };
  blogViews: number;
  // Dashboard stats (for admin dashboard cards)
  total_advisors: number;
  advisors_with_accounts: number;
  total_quote_leads: number;
  pending_quote_leads: number;
  new_leads_today: number;
  total_newsletter_subscribers: number;
  new_subscribers_this_month: number;
  // Legacy stats (still used by sidebar and other components)
  pending_support_tickets: number;
  unresolved_tickets: number;
  total_blog_articles: number;
  published_articles: number;
  draft_articles: number;
}

interface AdminStatsContextValue {
  stats: AdminStats;
  loading: boolean;
  refreshStats: () => void;
}

const AdminStatsContext = createContext<AdminStatsContextValue | null>(null);

export const useAdminStats = (): AdminStatsContextValue => {
  const context = useContext(AdminStatsContext);
  if (!context) {
    throw new Error('useAdminStats must be used within an AdminLayout');
  }
  return context;
};

interface AdminLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeView,
  onViewChange
}) => {
  const [stats, setStats] = useState<AdminStats>({
    // Web Analytics Stats
    activeNow: 0,
    pageViewsToday: 0,
    topTrafficSource: { name: 'Direct', sessions: 0 },
    blogViews: 0,
    // Dashboard stats
    total_advisors: 0,
    advisors_with_accounts: 0,
    total_quote_leads: 0,
    pending_quote_leads: 0,
    new_leads_today: 0,
    total_newsletter_subscribers: 0,
    new_subscribers_this_month: 0,
    // Legacy stats
    pending_support_tickets: 0,
    unresolved_tickets: 0,
    total_blog_articles: 0,
    published_articles: 0,
    draft_articles: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Persist sidebar state to localStorage
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const loadAdminStats = useCallback(async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Helper to safely query tables that might not exist
      const safeQuery = async <T,>(
        query: PromiseLike<{ data: T[] | null; error: any; count: number | null }>
      ): Promise<{ data: T[] | null; count: number | null }> => {
        try {
          const result = await query;
          // If table doesn't exist in schema cache, return empty result silently
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
        } catch (_e) {
          return { data: [], count: 0 };
        }
      };

      // Fetch web analytics data and legacy stats in parallel
      const [
        // Web Analytics
        realTimeStats,
        hourlyBreakdown,
        trafficSources,
        blogViewsResult,
        // Dashboard stats (for admin dashboard cards)
        totalAdvisorsResult,
        advisorsWithAccountsResult,
        totalQuoteLeadsResult,
        pendingQuoteLeadsResult,
        newLeadsTodayResult,
        totalNewsletterSubscribersResult,
        newSubscribersThisMonthResult,
        // Legacy stats (for sidebar and other components)
        pendingTicketsResult,
        unresolvedTicketsResult,
        blogArticlesResult,
        publishedArticlesResult,
        draftArticlesResult
      ] = await Promise.all([
        // Web Analytics queries
        getRealTimeStats().catch(() => ({ activeVisitors: 0, pageViewsLast5Min: 0, topPagesNow: [], deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 }, recentPageViews: [] })),
        getTodayHourlyBreakdown().catch(() => []),
        analyticsDataService.getTrafficSources({ startDate: startOfToday, endDate: new Date() }).catch(() => []),
        safeQuery(supabase.from('page_views').select('id', { count: 'exact', head: true }).like('path', '/blog%').gte('created_at', startOfToday.toISOString())),
        // Dashboard stats queries
        safeQuery(supabase.from('advisors').select('id', { count: 'exact', head: true }).eq('is_active', true)),
        safeQuery(supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'advisor')),
        safeQuery(supabase.from('lead_submissions').select('id', { count: 'exact', head: true })),
        safeQuery(supabase.from('lead_submissions').select('id', { count: 'exact', head: true }).is('pipeline_stage', null)),
        safeQuery(supabase.from('lead_submissions').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString())),
        safeQuery(supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active')),
        safeQuery(supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).gte('created_at', `${currentMonth}-01`)),
        // Legacy queries
        safeQuery(supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')),
        safeQuery(supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
        safeQuery(supabase.from('blog_articles').select('id', { count: 'exact', head: true })),
        safeQuery(supabase.from('blog_articles').select('id', { count: 'exact', head: true }).eq('is_published', true)),
        safeQuery(supabase.from('blog_articles').select('id', { count: 'exact', head: true }).eq('is_published', false))
      ]);

      // Calculate page views today from hourly breakdown
      const pageViewsToday = hourlyBreakdown.reduce((sum, hour) => sum + hour.count, 0);

      // Get top traffic source
      const topSource = trafficSources[0];
      const topTrafficSource = topSource 
        ? { name: topSource.sourceType.charAt(0).toUpperCase() + topSource.sourceType.slice(1), sessions: topSource.sessions }
        : { name: 'Direct', sessions: 0 };

      setStats({
        // Web Analytics Stats
        activeNow: realTimeStats.activeVisitors,
        pageViewsToday,
        topTrafficSource,
        blogViews: blogViewsResult.count || 0,
        // Dashboard stats
        total_advisors: totalAdvisorsResult.count || 0,
        advisors_with_accounts: advisorsWithAccountsResult.count || 0,
        total_quote_leads: totalQuoteLeadsResult.count || 0,
        pending_quote_leads: pendingQuoteLeadsResult.count || 0,
        new_leads_today: newLeadsTodayResult.count || 0,
        total_newsletter_subscribers: totalNewsletterSubscribersResult.count || 0,
        new_subscribers_this_month: newSubscribersThisMonthResult.count || 0,
        // Legacy stats
        pending_support_tickets: pendingTicketsResult.count || 0,
        unresolved_tickets: unresolvedTicketsResult.count || 0,
        total_blog_articles: blogArticlesResult.count || 0,
        published_articles: publishedArticlesResult.count || 0,
        draft_articles: draftArticlesResult.count || 0
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    loadAdminStats();
    
    const interval = setInterval(loadAdminStats, 30000);
    return () => clearInterval(interval);
  }, [loadAdminStats]);

  return (
    <AdminStatsContext.Provider value={{ stats, loading, refreshStats: loadAdminStats }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          activeView={activeView}
          onViewChange={onViewChange}
          stats={{
            pending_support_tickets: stats.pending_support_tickets,
            total_blog_articles: stats.total_blog_articles
          }}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Stats Bar */}
          <AdminStatsBar
            stats={stats}
            loading={loading}
            onRefresh={loadAdminStats}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className={cn(
              "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
              "transition-all duration-300"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminStatsContext.Provider>
  );
};

export default AdminLayout;

