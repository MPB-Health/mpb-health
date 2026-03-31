/**
 * Supabase Analytics Tracking Service
 * 
 * Lightweight client-side analytics that writes directly to Supabase,
 * enabling real-time data in the admin dashboard.
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================================
// Constants
// ============================================================================

const VISITOR_ID_KEY = 'mpb_visitor_id';
const SESSION_ID_KEY = 'mpb_session_id';
const SESSION_START_KEY = 'mpb_session_start';
const LAST_ACTIVITY_KEY = 'mpb_last_activity';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// ============================================================================
// Types
// ============================================================================

interface _PageViewData {
  path: string;
  title: string;
  referrer?: string;
  isEntry?: boolean;
}

interface _SessionData {
  sessionId: string;
  visitorId: string;
  isNewVisitor: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  country: string;
  referrer: string | null;
  referrerSource: 'direct' | 'organic' | 'referral' | 'social' | 'email' | 'paid' | 'other';
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create visitor ID (persists across sessions)
 */
function getVisitorId(): { id: string; isNew: boolean } {
  if (typeof window === 'undefined') {
    return { id: generateId(), isNew: true };
  }

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  let isNew = false;

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    isNew = true;
  }

  return { id: visitorId, isNew };
}

/**
 * Get or create session ID (expires after inactivity)
 */
function getSessionId(): { id: string; isNewSession: boolean } {
  if (typeof window === 'undefined') {
    return { id: generateId(), isNewSession: true };
  }

  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  const now = Date.now();

  // Check if session has expired
  if (lastActivity && existingSessionId) {
    const timeSinceLastActivity = now - parseInt(lastActivity, 10);
    if (timeSinceLastActivity < SESSION_TIMEOUT) {
      // Session still active
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      return { id: existingSessionId, isNewSession: false };
    }
  }

  // Create new session
  const newSessionId = generateId();
  sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
  sessionStorage.setItem(SESSION_START_KEY, now.toString());
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

  return { id: newSessionId, isNewSession: true };
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get browser name from user agent
 */
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';

  return 'Other';
}

/**
 * Get country from timezone (basic estimation)
 */
function getCountryFromTimezone(): string {
  if (typeof window === 'undefined') return 'Unknown';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to countries
    const tzCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Phoenix': 'US',
      'America/Anchorage': 'US',
      'Pacific/Honolulu': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Hong_Kong': 'HK',
      'Asia/Singapore': 'SG',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
    };

    // Check for US timezones
    if (tz.startsWith('America/') && !['Toronto', 'Vancouver', 'Mexico'].some(c => tz.includes(c))) {
      return 'US';
    }

    return tzCountryMap[tz] || tz.split('/')[0] || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Determine referrer source type
 */
function getReferrerSource(referrer: string | null): 'direct' | 'organic' | 'referral' | 'social' | 'email' | 'paid' | 'other' {
  if (!referrer) return 'direct';

  const ref = referrer.toLowerCase();

  // Social networks
  if (/facebook|fb\.com|instagram|twitter|x\.com|linkedin|pinterest|tiktok|youtube|reddit/i.test(ref)) {
    return 'social';
  }

  // Search engines (organic)
  if (/google|bing|yahoo|duckduckgo|baidu|yandex/i.test(ref)) {
    return 'organic';
  }

  // Email providers
  if (/mail|outlook|gmail|yahoo/i.test(ref)) {
    return 'email';
  }

  // Check for paid (via UTM)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const medium = params.get('utm_medium');
    if (medium && ['cpc', 'ppc', 'paid', 'paidsocial', 'display', 'cpm'].includes(medium.toLowerCase())) {
      return 'paid';
    }
  }

  return 'referral';
}

/**
 * Get UTM parameters from URL
 */
function getUTMParams(): { source: string | null; medium: string | null; campaign: string | null } {
  if (typeof window === 'undefined') {
    return { source: null, medium: null, campaign: null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  };
}

// ============================================================================
// Bot Detection
// ============================================================================

const BOT_PATTERNS = /bot|crawl|spider|slurp|bingpreview|mediapartners|google|baidu|yandex|sogou|facebook|twitter|linkedin|pinterest|whatsapp|telegram|preview|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i;

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return BOT_PATTERNS.test(navigator.userAgent);
}

// ============================================================================
// Main Tracking Service
// ============================================================================

export const supabaseAnalytics = {
  /**
   * Initialize analytics - call once on app load
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined' || !isSupabaseConfigured || isBot()) return;

    // Get or create visitor and session
    const { isNew: isNewVisitor } = getVisitorId();
    const { id: sessionId, isNewSession } = getSessionId();

    // If new session, create session record
    if (isNewSession) {
      await this.startSession(sessionId, isNewVisitor);
    }
  },

  /**
   * Start a new session
   */
  async startSession(sessionId: string, isNewVisitor: boolean): Promise<void> {
    if (typeof window === 'undefined' || !isSupabaseConfigured || isBot()) return;

    const referrer = document.referrer || null;
    const utm = getUTMParams();
    const { id: visitorId } = getVisitorId();

    const sessionData = {
      session_id: sessionId,
      visitor_id: visitorId,
      entry_page: window.location.pathname,
      referrer: referrer,
      referrer_source: getReferrerSource(referrer),
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      device_type: getDeviceType(),
      browser: getBrowser(),
      country: getCountryFromTimezone(),
      is_new_visitor: isNewVisitor,
      started_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('analytics_sessions')
        .insert(sessionData);

      if (error) {
        console.error('[Analytics] Error starting session:', error.message);
      }
    } catch (err) {
      console.error('[Analytics] Failed to start session:', err);
    }
  },

  /**
   * Track a page view
   */
  async trackPageView(path: string, title?: string): Promise<void> {
    if (typeof window === 'undefined' || !isSupabaseConfigured || isBot()) return;

    const { id: sessionId, isNewSession } = getSessionId();
    const { isNew: isNewVisitor } = getVisitorId();

    // If this created a new session, start it first
    if (isNewSession) {
      await this.startSession(sessionId, isNewVisitor);
    }

    const pageViewData = {
      path: path,
      title: title || document.title,
      session_id: sessionId,
      referrer: document.referrer || null,
      device_type: getDeviceType(),
      country: getCountryFromTimezone(),
      user_agent: navigator.userAgent,
      is_entry: isNewSession,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('page_views')
        .insert(pageViewData);

      if (error) {
        console.error('[Analytics] Error tracking page view:', error.message);
      }
    } catch (err) {
      console.error('[Analytics] Failed to track page view:', err);
    }
  },

  /**
   * Track a custom event
   */
  async trackEvent(
    eventType: string,
    eventCategory?: string,
    eventLabel?: string,
    eventValue?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (typeof window === 'undefined' || !isSupabaseConfigured || isBot()) return;

    const { id: sessionId } = getSessionId();

    const eventData = {
      session_id: sessionId,
      event_type: eventType,
      event_category: eventCategory || null,
      event_label: eventLabel || null,
      event_value: eventValue || null,
      page_path: window.location.pathname,
      page_title: document.title,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventData);

      if (error) {
        console.error('[Analytics] Error tracking event:', error.message);
      }
    } catch (err) {
      console.error('[Analytics] Failed to track event:', err);
    }
  },

  /**
   * Update page view with engagement data (time on page, scroll depth)
   */
  async updatePageEngagement(
    path: string,
    timeOnPage: number,
    scrollDepth: number,
    isExit: boolean = false
  ): Promise<void> {
    if (typeof window === 'undefined' || !isSupabaseConfigured || isBot()) return;

    const { id: sessionId } = getSessionId();

    try {
      // Update the most recent page view for this session and path
      const { error } = await supabase
        .from('page_views')
        .update({
          time_on_page: Math.round(timeOnPage),
          scroll_depth: Math.round(scrollDepth),
          is_exit: isExit,
        })
        .eq('session_id', sessionId)
        .eq('path', path)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[Analytics] Error updating engagement:', error.message);
      }
    } catch (err) {
      console.error('[Analytics] Failed to update engagement:', err);
    }
  },

  /**
   * Get current session ID (for external use)
   */
  getSessionId(): string {
    return getSessionId().id;
  },

  /**
   * Get visitor ID (for external use)
   */
  getVisitorId(): string {
    return getVisitorId().id;
  },

  /**
   * Check if this is a new visitor
   */
  isNewVisitor(): boolean {
    return getVisitorId().isNew;
  },
};

export default supabaseAnalytics;

