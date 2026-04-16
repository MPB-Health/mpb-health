import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export interface PageView {
  id: string;
  path: string;
  title: string | null;
  session_id: string;
  user_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown' | null;
  created_at: string;
}

export interface ActiveSession {
  session_id: string;
  last_activity: string;
  page_count: number;
  device_type: string | null;
  country: string | null;
}

export interface RealTimeStats {
  activeVisitors: number;
  pageViewsLast5Min: number;
  topPagesNow: Array<{ path: string; title: string | null; count: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number; unknown: number };
  recentPageViews: PageView[];
}

let realtimeChannel: RealtimeChannel | null = null;

/**
 * Subscribe to real-time page view updates
 */
export const subscribeToPageViews = (
  onNewPageView: (pageView: PageView) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured) return null;

  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }

  realtimeChannel = supabase
    .channel('page_views_realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'page_views',
      },
      (payload: RealtimePostgresInsertPayload<PageView>) => {
        onNewPageView(payload.new);
      }
    )
    .subscribe();

  return realtimeChannel;
};

/**
 * Unsubscribe from real-time updates
 */
export const unsubscribeFromPageViews = (): void => {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
};

/**
 * Get active visitors count (unique sessions in last 5 minutes)
 */
export const getActiveVisitors = async (): Promise<number> => {
  if (!isSupabaseConfigured) return 0;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('page_views')
    .select('session_id')
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Error fetching active visitors:', error);
    return 0;
  }

  const uniqueSessions = new Set(data?.map((d) => d.session_id) || []);
  return uniqueSessions.size;
};

/**
 * Get page views in the last N minutes
 */
export const getRecentPageViews = async (minutes: number = 5): Promise<PageView[]> => {
  if (!isSupabaseConfigured) return [];

  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('page_views')
    .select('id, path, title, session_id, user_id, user_agent, referrer, country, device_type, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching recent page views:', error);
    return [];
  }

  return data || [];
};

/**
 * Get top pages being viewed right now
 */
export const getTopPagesNow = async (
  limit: number = 10
): Promise<Array<{ path: string; title: string | null; count: number }>> => {
  if (!isSupabaseConfigured) return [];

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('page_views')
    .select('path, title')
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Error fetching top pages:', error);
    return [];
  }

  // Group by path and count
  const pathCounts: Record<string, { title: string | null; count: number }> = {};
  
  data?.forEach((pv) => {
    if (!pathCounts[pv.path]) {
      pathCounts[pv.path] = { title: pv.title, count: 0 };
    }
    pathCounts[pv.path].count++;
  });

  return Object.entries(pathCounts)
    .map(([path, { title, count }]) => ({ path, title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Get device breakdown for active sessions
 */
export const getDeviceBreakdown = async (): Promise<{
  desktop: number;
  mobile: number;
  tablet: number;
  unknown: number;
}> => {
  if (!isSupabaseConfigured) return { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('page_views')
    .select('session_id, device_type')
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Error fetching device breakdown:', error);
    return { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  }

  // Get unique sessions and their device types
  const sessionDevices: Record<string, string> = {};
  data?.forEach((pv) => {
    if (!sessionDevices[pv.session_id]) {
      sessionDevices[pv.session_id] = pv.device_type || 'unknown';
    }
  });

  const breakdown = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  Object.values(sessionDevices).forEach((device) => {
    if (device in breakdown) {
      breakdown[device as keyof typeof breakdown]++;
    } else {
      breakdown.unknown++;
    }
  });

  return breakdown;
};

/**
 * Get comprehensive real-time stats
 */
export const getRealTimeStats = async (): Promise<RealTimeStats> => {
  const [activeVisitors, recentPageViews, topPagesNow, deviceBreakdown] = await Promise.all([
    getActiveVisitors(),
    getRecentPageViews(5),
    getTopPagesNow(10),
    getDeviceBreakdown(),
  ]);

  return {
    activeVisitors,
    pageViewsLast5Min: recentPageViews.length,
    topPagesNow,
    deviceBreakdown,
    recentPageViews: recentPageViews.slice(0, 20), // Last 20 for the feed
  };
};

/**
 * Get page views for today with hourly breakdown
 */
export const getTodayHourlyBreakdown = async (): Promise<
  Array<{ hour: number; count: number }>
> => {
  if (!isSupabaseConfigured) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('page_views')
    .select('created_at')
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('Error fetching hourly breakdown:', error);
    return [];
  }

  // Group by hour
  const hourlyCount: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourlyCount[i] = 0;
  }

  data?.forEach((pv) => {
    const hour = new Date(pv.created_at).getHours();
    hourlyCount[hour]++;
  });

  return Object.entries(hourlyCount).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }));
};

/**
 * Get geographic distribution of active visitors
 */
export const getGeographicDistribution = async (): Promise<
  Array<{ country: string; count: number }>
> => {
  if (!isSupabaseConfigured) return [];

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('page_views')
    .select('session_id, country')
    .gte('created_at', fiveMinutesAgo)
    .not('country', 'is', null);

  if (error) {
    console.error('Error fetching geographic distribution:', error);
    return [];
  }

  // Get unique sessions and their countries
  const sessionCountries: Record<string, string> = {};
  data?.forEach((pv) => {
    if (!sessionCountries[pv.session_id] && pv.country) {
      sessionCountries[pv.session_id] = pv.country;
    }
  });

  const countryCounts: Record<string, number> = {};
  Object.values(sessionCountries).forEach((country) => {
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });

  return Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
};

