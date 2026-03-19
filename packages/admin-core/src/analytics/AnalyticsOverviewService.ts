import { supabase } from '@mpbhealth/database';

export interface TrafficDay {
  date: string;
  page_views: number;
  sessions: number;
  unique_visitors: number;
}

export interface AnalyticsOverviewStats {
  totalPageViews: number;
  totalSessions: number;
  avgDailyVisitors: number;
  trafficByDay: TrafficDay[];
  leadStats: { total: number; today: number; this_month: number };
}

export class AnalyticsOverviewService {
  async getOverview(days = 30): Promise<AnalyticsOverviewStats> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const [summaryResult, leadsResult] = await Promise.allSettled([
      supabase
        .from('daily_analytics_summary')
        .select('date, page_views, sessions, unique_visitors')
        .gte('date', sinceStr)
        .order('date', { ascending: true }),
      supabase
        .from('zoho_lead_submissions')
        .select('created_at'),
    ]);

    const rows: TrafficDay[] =
      summaryResult.status === 'fulfilled' && !summaryResult.value.error
        ? ((summaryResult.value.data || []) as TrafficDay[])
        : [];

    const leadsData =
      leadsResult.status === 'fulfilled' && !leadsResult.value.error
        ? leadsResult.value.data || []
        : [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    return {
      totalPageViews: rows.reduce((s, r) => s + (r.page_views || 0), 0),
      totalSessions: rows.reduce((s, r) => s + (r.sessions || 0), 0),
      avgDailyVisitors:
        rows.length > 0
          ? Math.round(rows.reduce((s, r) => s + (r.unique_visitors || 0), 0) / rows.length)
          : 0,
      trafficByDay: rows,
      leadStats: {
        total: leadsData.length,
        today: leadsData.filter((r) => r.created_at >= todayStart).length,
        this_month: leadsData.filter((r) => r.created_at >= monthStart).length,
      },
    };
  }
}

export const analyticsOverviewService = new AnalyticsOverviewService();
