import { supabase } from './supabase';

// ============================================================================
// Session Tracking Service
// Manages user sessions and tracks engagement metrics
// ============================================================================

interface SessionData {
  sessionId: string;
  startedAt: Date;
  userId?: string;
  entryPage: string;
  deviceType: string;
  browser: string;
  os: string;
  country: string | null;
  referrer: string | null;
  referrerSource: string;
  isNewVisitor: boolean;
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

interface PageEngagement {
  path: string;
  title: string;
  startTime: number;
  scrollDepth: number;
  timeOnPage: number;
}

let currentSession: SessionData | null = null;
let currentPageEngagement: PageEngagement | null = null;
let scrollObserver: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;
let isSessionInitialized = false;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create session ID from storage
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Check if this is a new visitor
 */
const checkIsNewVisitor = (): boolean => {
  const hasVisited = localStorage.getItem('analytics_has_visited');
  if (!hasVisited) {
    localStorage.setItem('analytics_has_visited', 'true');
    localStorage.setItem('analytics_first_visit', new Date().toISOString());
    return true;
  }
  return false;
};

/**
 * Detect device type from user agent
 */
const detectDeviceType = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

/**
 * Detect browser from user agent
 */
const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'IE';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  
  return 'Unknown';
};

/**
 * Detect OS from user agent
 */
const detectOS = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  
  return 'Unknown';
};

/**
 * Get country from timezone
 */
const getCountryFromTimezone = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'Europe/London': 'UK',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Singapore': 'SG',
      'Australia/Sydney': 'AU',
    };
    
    return timezoneCountryMap[timezone] || null;
  } catch {
    return null;
  }
};

/**
 * Determine traffic source from referrer
 */
const getReferrerSource = (referrer: string | null): string => {
  if (!referrer) return 'direct';
  
  try {
    const url = new URL(referrer);
    const domain = url.hostname.toLowerCase();
    
    // Social media
    if (domain.includes('facebook') || domain.includes('fb.com')) return 'social';
    if (domain.includes('twitter') || domain.includes('t.co')) return 'social';
    if (domain.includes('linkedin')) return 'social';
    if (domain.includes('instagram')) return 'social';
    if (domain.includes('tiktok')) return 'social';
    if (domain.includes('pinterest')) return 'social';
    if (domain.includes('reddit')) return 'social';
    
    // Search engines
    if (domain.includes('google')) return 'organic';
    if (domain.includes('bing')) return 'organic';
    if (domain.includes('yahoo')) return 'organic';
    if (domain.includes('duckduckgo')) return 'organic';
    
    // Email
    if (domain.includes('mail') || domain.includes('outlook') || domain.includes('gmail')) {
      return 'email';
    }
    
    return 'referral';
  } catch {
    return 'referral';
  }
};

/**
 * Parse UTM parameters from URL
 */
const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
};

// ============================================================================
// Session Management
// ============================================================================

/**
 * Initialize a new session
 */
export const initializeSession = async (): Promise<void> => {
  if (isSessionInitialized) return;
  isSessionInitialized = true;

  const sessionId = getSessionId();
  const isNewVisitor = checkIsNewVisitor();
  const referrer = document.referrer || null;
  const utmParams = getUtmParams();
  
  // Check if UTM params indicate paid traffic
  let referrerSource = getReferrerSource(referrer);
  if (utmParams.medium === 'cpc' || utmParams.medium === 'paid') {
    referrerSource = 'paid';
  } else if (utmParams.medium === 'email') {
    referrerSource = 'email';
  } else if (utmParams.source) {
    // UTM source overrides detected source
    if (['google', 'bing', 'yahoo'].includes(utmParams.source.toLowerCase())) {
      referrerSource = utmParams.medium === 'cpc' ? 'paid' : 'organic';
    }
  }

  currentSession = {
    sessionId,
    startedAt: new Date(),
    entryPage: window.location.pathname,
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    country: getCountryFromTimezone(),
    referrer,
    referrerSource,
    isNewVisitor,
    utmParams,
  };

  // Create session in database
  try {
    const { error } = await supabase.from('analytics_sessions').insert({
      session_id: sessionId,
      user_id: null, // Will be updated if user logs in
      started_at: currentSession.startedAt.toISOString(),
      entry_page: currentSession.entryPage,
      device_type: currentSession.deviceType,
      browser: currentSession.browser,
      os: currentSession.os,
      country: currentSession.country,
      referrer: currentSession.referrer,
      referrer_source: currentSession.referrerSource,
      is_new_visitor: currentSession.isNewVisitor,
      utm_source: utmParams.source,
      utm_medium: utmParams.medium,
      utm_campaign: utmParams.campaign,
      utm_term: utmParams.term,
      utm_content: utmParams.content,
      is_bounce: true,
      page_count: 1,
    });

    if (error) {
      console.warn('Failed to create session:', error);
    }
  } catch (err) {
    console.warn('Error creating session:', err);
  }

  // Setup page unload handler
  setupUnloadHandler();
};

/**
 * Update session with user ID when user logs in
 */
export const updateSessionUserId = async (userId: string): Promise<void> => {
  if (!currentSession) return;

  try {
    await supabase
      .from('analytics_sessions')
      .update({ user_id: userId })
      .eq('session_id', currentSession.sessionId);
  } catch (err) {
    console.warn('Error updating session user ID:', err);
  }
};

// ============================================================================
// Page Engagement Tracking
// ============================================================================

/**
 * Start tracking engagement for a page
 */
export const startPageEngagement = (path: string, title: string): void => {
  // End previous page engagement if exists
  if (currentPageEngagement) {
    endPageEngagement();
  }

  currentPageEngagement = {
    path,
    title,
    startTime: Date.now(),
    scrollDepth: 0,
    timeOnPage: 0,
  };

  // Setup scroll tracking
  setupScrollTracking();
};

/**
 * End tracking for current page and save metrics
 */
export const endPageEngagement = async (): Promise<void> => {
  if (!currentPageEngagement || !currentSession) return;

  const timeOnPage = Math.floor((Date.now() - currentPageEngagement.startTime) / 1000);

  // Update page view with engagement metrics
  try {
    await supabase
      .from('page_views')
      .update({
        time_on_page: timeOnPage,
        scroll_depth: currentPageEngagement.scrollDepth,
        is_exit: true,
      })
      .eq('session_id', currentSession.sessionId)
      .eq('path', currentPageEngagement.path)
      .order('created_at', { ascending: false })
      .limit(1);
  } catch (err) {
    console.warn('Error updating page engagement:', err);
  }

  // Cleanup
  cleanupScrollTracking();
  currentPageEngagement = null;
};

/**
 * Setup scroll depth tracking
 */
const setupScrollTracking = (): void => {
  cleanupScrollTracking();

  const handleScroll = () => {
    if (!currentPageEngagement) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      currentPageEngagement.scrollDepth = 100;
      return;
    }

    const scrolled = window.scrollY;
    const depth = Math.min(100, Math.round((scrolled / scrollHeight) * 100));
    
    if (depth > currentPageEngagement.scrollDepth) {
      currentPageEngagement.scrollDepth = depth;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  scrollObserver = () => window.removeEventListener('scroll', handleScroll);

  // Initial scroll position
  handleScroll();
};

/**
 * Cleanup scroll tracking
 */
const cleanupScrollTracking = (): void => {
  if (scrollObserver) {
    scrollObserver();
    scrollObserver = null;
  }
};

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Track a custom event
 */
export const trackEvent = async (
  eventType: string,
  eventData: {
    category?: string;
    label?: string;
    value?: number;
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> => {
  if (!currentSession) return;

  try {
    await supabase.from('analytics_events').insert({
      session_id: currentSession.sessionId,
      user_id: null, // Will be set if user is logged in
      event_type: eventType,
      event_category: eventData.category,
      event_label: eventData.label,
      event_value: eventData.value,
      page_path: window.location.pathname,
      page_title: document.title,
      element_id: eventData.elementId,
      element_class: eventData.elementClass,
      element_text: eventData.elementText,
      metadata: eventData.metadata || {},
    });
  } catch (err) {
    console.warn('Error tracking event:', err);
  }
};

/**
 * Track a click event
 */
export const trackClick = (
  elementId?: string,
  elementText?: string,
  category?: string
): void => {
  trackEvent('click', {
    elementId,
    elementText,
    category,
  });
};

/**
 * Track form events
 */
export const trackFormStart = (formId: string, formName?: string): void => {
  trackEvent('form_start', {
    elementId: formId,
    label: formName,
  });
};

export const trackFormSubmit = (formId: string, formName?: string): void => {
  trackEvent('form_submit', {
    elementId: formId,
    label: formName,
  });
};

export const trackFormAbandon = (formId: string, formName?: string): void => {
  trackEvent('form_abandon', {
    elementId: formId,
    label: formName,
  });
};

/**
 * Track CTA clicks
 */
export const trackCTAClick = (ctaText: string, ctaLocation?: string): void => {
  trackEvent('cta_click', {
    elementText: ctaText,
    category: ctaLocation,
  });
};

// ============================================================================
// Cleanup & Unload
// ============================================================================

/**
 * Setup page unload handler to save final metrics
 */
const setupUnloadHandler = (): void => {
  const handleUnload = () => {
    if (currentPageEngagement && currentSession) {
      // Use sendBeacon for reliable data sending on unload
      const timeOnPage = Math.floor((Date.now() - currentPageEngagement.startTime) / 1000);
      
      // Note: sendBeacon with Supabase requires a custom endpoint
      // For now, we'll use a sync approach as fallback
      navigator.sendBeacon(
        '/api/analytics/page-exit',
        JSON.stringify({
          sessionId: currentSession.sessionId,
          path: currentPageEngagement.path,
          timeOnPage,
          scrollDepth: currentPageEngagement.scrollDepth,
        })
      );
    }
  };

  // Handle visibility change (tab switching, minimizing)
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      endPageEngagement();
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  document.addEventListener('visibilitychange', visibilityHandler);
};

/**
 * Get current session ID
 */
export const getCurrentSessionId = (): string | null => {
  return currentSession?.sessionId || null;
};

/**
 * Get current session data
 */
export const getCurrentSession = (): SessionData | null => {
  return currentSession;
};

