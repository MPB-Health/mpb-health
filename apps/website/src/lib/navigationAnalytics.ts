import { supabase, isSupabaseConfigured } from './supabase';

export interface NavigationClickEvent {
  navigation_item_id: string;
  label: string;
  href: string;
  action: 'click' | 'hover' | 'search' | 'keyboard';
  user_id?: string;
  session_id: string;
  user_agent: string;
  referrer: string | null;
  timestamp?: string;
}

export interface NavigationSearchEvent {
  query: string;
  results_count: number;
  selected_result?: string;
  user_id?: string;
  session_id: string;
  timestamp?: string;
}

let sessionId: string | null = null;

const getSessionId = (): string => {
  if (sessionId) return sessionId;

  let stored = sessionStorage.getItem('nav_session_id');
  if (!stored) {
    stored = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('nav_session_id', stored);
  }
  sessionId = stored;
  return stored;
};

/**
 * Detect device type from user agent
 */
const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' | 'unknown' => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Check for tablets first (they often have 'mobile' in UA too)
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  // Check for mobile devices
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini|opera mobi|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  // Desktop if not mobile/tablet
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }
  
  return 'unknown';
};

/**
 * Get country from timezone (approximate location)
 * Maps common timezones to countries
 */
const getCountryFromTimezone = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map of timezone prefixes/patterns to country codes
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Phoenix': 'US',
      'America/Anchorage': 'US',
      'Pacific/Honolulu': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'America/Mexico_City': 'MX',
      'Europe/London': 'UK',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Vienna': 'AT',
      'Europe/Warsaw': 'PL',
      'Europe/Prague': 'CZ',
      'Europe/Zurich': 'CH',
      'Europe/Stockholm': 'SE',
      'Europe/Oslo': 'NO',
      'Europe/Copenhagen': 'DK',
      'Europe/Helsinki': 'FI',
      'Europe/Dublin': 'IE',
      'Europe/Lisbon': 'PT',
      'Europe/Athens': 'GR',
      'Europe/Moscow': 'RU',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Hong_Kong': 'HK',
      'Asia/Singapore': 'SG',
      'Asia/Kolkata': 'IN',
      'Asia/Dubai': 'AE',
      'Asia/Bangkok': 'TH',
      'Asia/Jakarta': 'ID',
      'Asia/Manila': 'PH',
      'Asia/Kuala_Lumpur': 'MY',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Australia/Brisbane': 'AU',
      'Australia/Perth': 'AU',
      'Pacific/Auckland': 'NZ',
      'America/Sao_Paulo': 'BR',
      'America/Buenos_Aires': 'AR',
      'America/Santiago': 'CL',
      'America/Bogota': 'CO',
      'America/Lima': 'PE',
      'Africa/Johannesburg': 'ZA',
      'Africa/Cairo': 'EG',
      'Africa/Lagos': 'NG',
    };
    
    // Direct match
    if (timezoneCountryMap[timezone]) {
      return timezoneCountryMap[timezone];
    }
    
    // Try prefix matching for US timezones
    if (timezone.startsWith('America/') && 
        ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver', 
         'America/Phoenix', 'America/Indiana', 'America/Detroit', 'America/Boise'].some(tz => timezone.startsWith(tz.slice(0, 14)))) {
      return 'US';
    }
    
    // Extract region from timezone
    const parts = timezone.split('/');
    if (parts.length > 0) {
      const region = parts[0];
      if (region === 'Europe') return 'EU';
      if (region === 'Asia') return 'APAC';
      if (region === 'America') return 'AMER';
      if (region === 'Africa') return 'AF';
      if (region === 'Australia' || region === 'Pacific') return 'AU/NZ';
    }
    
    return null;
  } catch {
    return null;
  }
};

export const trackNavigationClick = async (
  navigationItemId: string,
  label: string,
  href: string,
  action: 'click' | 'hover' | 'keyboard' = 'click',
  userId?: string
): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const event: NavigationClickEvent = {
      navigation_item_id: navigationItemId,
      label,
      href,
      action,
      user_id: userId,
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    };

    const { error } = await supabase.from('navigation_analytics').insert(event);

    if (error) {
      console.warn('Failed to track navigation click:', error);
    }
  } catch (err) {
    console.warn('Error tracking navigation click:', err);
  }
};

export const trackNavigationSearch = async (
  query: string,
  resultsCount: number,
  selectedResult?: string,
  userId?: string
): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const event: NavigationSearchEvent = {
      query,
      results_count: resultsCount,
      selected_result: selectedResult,
      user_id: userId,
      session_id: getSessionId(),
    };

    const { error } = await supabase.from('navigation_search_analytics').insert(event);

    if (error) {
      console.warn('Failed to track navigation search:', error);
    }
  } catch (err) {
    console.warn('Error tracking navigation search:', err);
  }
};

export const trackPageView = async (
  path: string,
  title: string,
  userId?: string
): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const deviceType = getDeviceType();
    const country = getCountryFromTimezone();

    const { error } = await supabase.from('page_views').insert({
      path,
      title,
      user_id: userId,
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      device_type: deviceType,
      country: country,
    });

    if (error) {
      console.warn('Failed to track page view:', error);
    }
  } catch (err) {
    console.warn('Error tracking page view:', err);
  }
};

export const getNavigationAnalytics = async (
  startDate: Date,
  endDate: Date
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('navigation_analytics')
      .select('id, navigation_item_id, label, href, action, user_id, session_id, user_agent, referrer, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch navigation analytics:', error);
      return [];
    }

    return (data || []) as any;
  } catch (err) {
    console.error('Error fetching navigation analytics:', err);
    return [];
  }
};

export const getTopNavigationItems = async (
  limit: number = 10
): Promise<Array<{ item_id: string; label: string; count: number }>> => {
  try {
    const { data, error } = await supabase
      .from('navigation_analytics')
      .select('navigation_item_id, label')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Failed to fetch top navigation items:', error);
      return [];
    }

    const counts = (data || []).reduce((acc: any, item: any) => {
      const key = item.navigation_item_id;
      if (!acc[key]) {
        acc[key] = { item_id: key, label: item.label, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {});

    return (Object.values(counts) as Array<{ item_id: string; label: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (err) {
    console.error('Error fetching top navigation items:', err);
    return [];
  }
};

export const getSearchAnalytics = async (
  startDate: Date,
  endDate: Date
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('navigation_search_analytics')
      .select('id, query, results_count, selected_result, user_id, session_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch search analytics:', error);
      return [];
    }

    return (data || []) as any;
  } catch (err) {
    console.error('Error fetching search analytics:', err);
    return [];
  }
};

export const getTopSearchQueries = async (
  limit: number = 10
): Promise<Array<{ query: string; count: number; avg_results: number }>> => {
  try {
    const { data, error } = await supabase
      .from('navigation_search_analytics')
      .select('query, results_count')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Failed to fetch top search queries:', error);
      return [];
    }

    const queries = (data || []).reduce((acc: any, item: any) => {
      const key = item.query.toLowerCase();
      if (!acc[key]) {
        acc[key] = { query: item.query, count: 0, total_results: 0 };
      }
      acc[key].count++;
      acc[key].total_results += item.results_count;
      return acc;
    }, {});

    return Object.values(queries)
      .map((q: any) => ({
        query: q.query,
        count: q.count,
        avg_results: Math.round(q.total_results / q.count),
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit);
  } catch (err) {
    console.error('Error fetching top search queries:', err);
    return [];
  }
};
