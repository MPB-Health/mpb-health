import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  totalPageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

export interface TrafficSource {
  sourceType: string;
  sourceName: string | null;
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface PageMetrics {
  pagePath: string;
  pageTitle: string | null;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  entryCount: number;
  exitCount: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  unknown: number;
}

export interface GeoData {
  country: string;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface DailyMetric {
  date: string;
  value: number;
}

export interface HourlyMetric {
  hour: number;
  value: number;
}

export interface SessionData {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  pageCount: number;
  isBounce: boolean;
  entryPage: string;
  exitPage: string | null;
  deviceType: string | null;
  country: string | null;
  referrerSource: string | null;
  isNewVisitor: boolean;
}

// ============================================================================
// Analytics Data Service
// ============================================================================

export const analyticsDataService = {
  /**
   * Get analytics summary for a date range
   * Calculates from analytics_sessions + page_views for accurate real-time data
   */
  async getSummary(dateRange: DateRange): Promise<AnalyticsSummary> {
    const { startDate, endDate } = dateRange;
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const [sessionsResult, pageViewsResult] = await Promise.all([
      supabase
        .from('analytics_sessions')
        .select('session_id, visitor_id, user_id, is_new_visitor, is_bounce, duration_seconds, page_count')
        .gte('started_at', startISO)
        .lte('started_at', endISO),
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startISO)
        .lte('created_at', endISO),
    ]);

    if (sessionsResult.error || !sessionsResult.data) {
      console.error('Error fetching sessions:', sessionsResult.error);
      return {
        totalSessions: 0,
        totalUsers: 0,
        newUsers: 0,
        returningUsers: 0,
        totalPageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pagesPerSession: 0,
      };
    }

    const sessions = sessionsResult.data;
    const totalPageViews = pageViewsResult.count ?? sessions.reduce((sum, s) => sum + (s.page_count || 0), 0);

    // Deduplicate users by visitor_id (falls back to session_id for old records)
    const uniqueUsers = new Set(sessions.map((s) => s.visitor_id || s.user_id || s.session_id));

    // Count unique new visitors (not sessions) to avoid overcounting
    const newVisitorIds = new Set(
      sessions.filter((s) => s.is_new_visitor).map((s) => s.visitor_id || s.user_id || s.session_id)
    );

    const bounces = sessions.filter((s) => s.is_bounce).length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    return {
      totalSessions: sessions.length,
      totalUsers: uniqueUsers.size,
      newUsers: newVisitorIds.size,
      returningUsers: uniqueUsers.size - newVisitorIds.size,
      totalPageViews,
      bounceRate: sessions.length > 0 ? (bounces / sessions.length) * 100 : 0,
      avgSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      pagesPerSession: sessions.length > 0 ? totalPageViews / sessions.length : 0,
    };
  },

  /**
   * Get daily metrics for trend charts
   * Calculates from analytics_sessions (+ page_views for pageViews metric)
   */
  async getDailyMetrics(
    dateRange: DateRange,
    metric: 'sessions' | 'users' | 'pageViews' | 'bounceRate'
  ): Promise<DailyMetric[]> {
    const { startDate, endDate } = dateRange;
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // For pageViews metric, count directly from page_views table
    if (metric === 'pageViews') {
      const { data: pvData, error: pvError } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (pvError || !pvData) {
        console.error('Error fetching daily page views:', pvError);
        return [];
      }

      const dailyCounts: Record<string, number> = {};
      pvData.forEach((pv) => {
        const date = new Date(pv.created_at).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      return Object.keys(dailyCounts).sort().map((date) => ({ date, value: dailyCounts[date] }));
    }

    // For session-based metrics
    const { data: sessions, error } = await supabase
      .from('analytics_sessions')
      .select('started_at, visitor_id, user_id, session_id, is_bounce')
      .gte('started_at', startISO)
      .lte('started_at', endISO);

    if (error || !sessions) {
      console.error('Error fetching daily metrics:', error);
      return [];
    }

    const dailyData: Record<string, { sessions: number; visitorIds: Set<string>; bounces: number }> = {};

    sessions.forEach((session) => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { sessions: 0, visitorIds: new Set(), bounces: 0 };
      }
      dailyData[date].sessions++;
      dailyData[date].visitorIds.add(session.visitor_id || session.user_id || session.session_id);
      if (session.is_bounce) dailyData[date].bounces++;
    });

    const sortedDates = Object.keys(dailyData).sort();

    return sortedDates.map((date) => {
      const day = dailyData[date];
      let value = 0;
      switch (metric) {
        case 'sessions':
          value = day.sessions;
          break;
        case 'users':
          value = day.visitorIds.size;
          break;
        case 'bounceRate':
          value = day.sessions > 0 ? (day.bounces / day.sessions) * 100 : 0;
          break;
      }
      return { date, value };
    });
  },

  /**
   * Get hourly distribution for today
   */
  async getHourlyDistribution(date: Date = new Date()): Promise<HourlyMetric[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error || !data) {
      console.error('Error fetching hourly data:', error);
      return Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    }

    const hourlyCount: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyCount[i] = 0;
    }

    data.forEach((pv) => {
      const hour = new Date(pv.created_at).getHours();
      hourlyCount[hour]++;
    });

    return Object.entries(hourlyCount).map(([hour, value]) => ({
      hour: parseInt(hour),
      value,
    }));
  },

  /**
   * Get traffic sources breakdown
   * Calculates from analytics_sessions for accurate real-time data
   */
  async getTrafficSources(dateRange: DateRange): Promise<TrafficSource[]> {
    const { startDate, endDate } = dateRange;

    const { data: sessions, error } = await supabase
      .from('analytics_sessions')
      .select('referrer_source, session_id, visitor_id, user_id, page_count, is_bounce, duration_seconds')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error || !sessions) {
      return [];
    }

    const sourceAgg: Record<string, any> = {};

    sessions.forEach((s) => {
      const source = s.referrer_source || 'direct';
      if (!sourceAgg[source]) {
        sourceAgg[source] = {
          sourceType: source,
          sourceName: null,
          sessions: 0,
          visitorIds: new Set(),
          pageViews: 0,
          bounces: 0,
          totalDuration: 0,
        };
      }
      sourceAgg[source].sessions++;
      sourceAgg[source].visitorIds.add(s.visitor_id || s.user_id || s.session_id);
      sourceAgg[source].pageViews += s.page_count || 0;
      if (s.is_bounce) sourceAgg[source].bounces++;
      sourceAgg[source].totalDuration += s.duration_seconds || 0;
    });

    return Object.values(sourceAgg)
      .map((s: any) => ({
        sourceType: s.sourceType,
        sourceName: s.sourceName,
        sessions: s.sessions,
        users: s.visitorIds.size,
        pageViews: s.pageViews,
        bounceRate: s.sessions > 0 ? (s.bounces / s.sessions) * 100 : 0,
        avgSessionDuration: s.sessions > 0 ? s.totalDuration / s.sessions : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  },

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(dateRange: DateRange): Promise<DeviceBreakdown> {
    const { startDate, endDate } = dateRange;

    const { data, error } = await supabase
      .from('analytics_sessions')
      .select('device_type')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error || !data) {
      return { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    }

    const breakdown = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };

    data.forEach((s) => {
      const device = s.device_type || 'unknown';
      if (device in breakdown) {
        breakdown[device as keyof DeviceBreakdown]++;
      } else {
        breakdown.unknown++;
      }
    });

    return breakdown;
  },

  /**
   * Get geographic distribution
   */
  async getGeoDistribution(dateRange: DateRange): Promise<GeoData[]> {
    const { startDate, endDate } = dateRange;

    const { data, error } = await supabase
      .from('analytics_sessions')
      .select('country, session_id, visitor_id, user_id, is_bounce')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .not('country', 'is', null);

    if (error || !data) {
      return [];
    }

    const geoAgg: Record<string, any> = {};

    data.forEach((s) => {
      const country = s.country || 'Unknown';
      if (!geoAgg[country]) {
        geoAgg[country] = {
          country,
          sessions: 0,
          visitorIds: new Set(),
          bounces: 0,
        };
      }
      geoAgg[country].sessions++;
      geoAgg[country].visitorIds.add(s.visitor_id || s.user_id || s.session_id);
      if (s.is_bounce) geoAgg[country].bounces++;
    });

    return Object.values(geoAgg)
      .map((g: any) => ({
        country: g.country,
        sessions: g.sessions,
        users: g.visitorIds.size,
        bounceRate: g.sessions > 0 ? (g.bounces / g.sessions) * 100 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  },

  /**
   * Get top pages by views
   * Calculates from page_views table for accurate real-time data
   */
  async getTopPages(dateRange: DateRange, limit: number = 10): Promise<PageMetrics[]> {
    const { startDate, endDate } = dateRange;

    // Calculate directly from page_views table for accurate real-time data
    const { data, error } = await supabase
      .from('page_views')
      .select('path, title, session_id, time_on_page, scroll_depth, is_entry, is_exit')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !data) {
      return [];
    }

    const pageAgg: Record<string, any> = {};

    data.forEach((pv) => {
      if (!pageAgg[pv.path]) {
        pageAgg[pv.path] = {
          pagePath: pv.path,
          pageTitle: pv.title,
          views: 0,
          sessionIds: new Set(),
          totalTime: 0,
          totalScroll: 0,
          entryCount: 0,
          exitCount: 0,
        };
      }
      pageAgg[pv.path].views++;
      pageAgg[pv.path].sessionIds.add(pv.session_id);
      pageAgg[pv.path].totalTime += pv.time_on_page || 0;
      pageAgg[pv.path].totalScroll += pv.scroll_depth || 0;
      if (pv.is_entry) pageAgg[pv.path].entryCount++;
      if (pv.is_exit) pageAgg[pv.path].exitCount++;
    });

    return Object.values(pageAgg)
      .map((p: any) => ({
        pagePath: p.pagePath,
        pageTitle: p.pageTitle,
        views: p.views,
        uniqueViews: p.sessionIds.size,
        avgTimeOnPage: p.views > 0 ? p.totalTime / p.views : 0,
        avgScrollDepth: p.views > 0 ? p.totalScroll / p.views : 0,
        bounceRate: 0,
        entryCount: p.entryCount,
        exitCount: p.exitCount,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },

  /**
   * Get entry pages (landing pages)
   */
  async getEntryPages(dateRange: DateRange, limit: number = 10): Promise<PageMetrics[]> {
    const pages = await this.getTopPages(dateRange, 100);
    return pages.sort((a, b) => b.entryCount - a.entryCount).slice(0, limit);
  },

  /**
   * Get exit pages
   */
  async getExitPages(dateRange: DateRange, limit: number = 10): Promise<PageMetrics[]> {
    const pages = await this.getTopPages(dateRange, 100);
    return pages.sort((a, b) => b.exitCount - a.exitCount).slice(0, limit);
  },

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit: number = 50): Promise<SessionData[]> {
    const { data, error } = await supabase
      .from('analytics_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: s.duration_seconds || 0,
      pageCount: s.page_count || 0,
      isBounce: s.is_bounce || false,
      entryPage: s.entry_page,
      exitPage: s.exit_page,
      deviceType: s.device_type,
      country: s.country,
      referrerSource: s.referrer_source,
      isNewVisitor: s.is_new_visitor || false,
    }));
  },

  /**
   * Get new vs returning users breakdown
   */
  async getNewVsReturning(dateRange: DateRange): Promise<{ new: number; returning: number }> {
    const summary = await this.getSummary(dateRange);
    return {
      new: summary.newUsers,
      returning: summary.returningUsers,
    };
  },
};

