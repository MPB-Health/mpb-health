/**
 * Page Tracking Hook
 * 
 * Automatically tracks page views and engagement metrics
 * when React Router routes change.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabaseAnalytics } from '../lib/supabaseAnalytics';

interface UsePageTrackingOptions {
  /** Whether tracking is enabled (default: true) */
  enabled?: boolean;
  /** Paths to exclude from tracking (e.g., ['/admin']) */
  excludePaths?: string[];
  /** Minimum time on page (ms) before tracking engagement (default: 1000) */
  minEngagementTime?: number;
}

/**
 * Hook to automatically track page views and engagement
 * 
 * @example
 * ```tsx
 * function App() {
 *   usePageTracking();
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function usePageTracking(options: UsePageTrackingOptions = {}): void {
  const {
    enabled = true,
    excludePaths = [],
    minEngagementTime = 1000,
  } = options;

  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const lastPathRef = useRef<string>('');
  const isInitialMount = useRef<boolean>(true);

  // Track scroll depth
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollPercent > maxScrollRef.current) {
      maxScrollRef.current = scrollPercent;
    }
  }, []);

  // Track engagement before leaving page
  const trackEngagement = useCallback(async (path: string, isExit: boolean = false) => {
    const timeOnPage = (Date.now() - startTimeRef.current) / 1000; // Convert to seconds

    // Only track if user spent meaningful time on page
    if (timeOnPage >= minEngagementTime / 1000) {
      await supabaseAnalytics.updatePageEngagement(
        path,
        timeOnPage,
        maxScrollRef.current,
        isExit
      );
    }
  }, [minEngagementTime]);

  // Initialize analytics on mount
  useEffect(() => {
    if (!enabled) return;

    supabaseAnalytics.init().catch(console.error);
  }, [enabled]);

  // Track page views on route change
  useEffect(() => {
    if (!enabled) return;

    const currentPath = location.pathname;

    // Check if path should be excluded
    if (excludePaths.some(excluded => currentPath.startsWith(excluded))) {
      return;
    }

    // Track engagement for previous page (if not initial mount)
    if (!isInitialMount.current && lastPathRef.current) {
      trackEngagement(lastPathRef.current, false);
    }

    // Reset engagement tracking for new page
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    lastPathRef.current = currentPath;

    // Track the new page view
    supabaseAnalytics.trackPageView(currentPath, document.title).catch(console.error);

    isInitialMount.current = false;
  }, [location.pathname, enabled, excludePaths, trackEngagement]);

  // Set up scroll tracking
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleScroll]);

  // Track engagement on page unload
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      const currentPath = location.pathname;
      
      // Use sendBeacon for reliable tracking on page exit
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000;
      
      if (timeOnPage >= minEngagementTime / 1000) {
        // Note: We can't use async here, so we'll track what we can
        // The session update trigger in Supabase will handle session-level tracking
        trackEngagement(currentPath, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackEngagement(location.pathname, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, location.pathname, minEngagementTime, trackEngagement]);
}

/**
 * Hook to track custom events
 * 
 * @example
 * ```tsx
 * function Button() {
 *   const { trackEvent } = useEventTracking();
 *   
 *   return (
 *     <button onClick={() => trackEvent('click', 'CTA', 'Get Quote')}>
 *       Get Quote
 *     </button>
 *   );
 * }
 * ```
 */
export function useEventTracking() {
  const trackEvent = useCallback(
    async (
      eventType: string,
      eventCategory?: string,
      eventLabel?: string,
      eventValue?: number,
      metadata?: Record<string, any>
    ) => {
      await supabaseAnalytics.trackEvent(
        eventType,
        eventCategory,
        eventLabel,
        eventValue,
        metadata
      );
    },
    []
  );

  const trackClick = useCallback(
    async (elementName: string, location?: string) => {
      await supabaseAnalytics.trackEvent('click', 'UI', elementName, undefined, { location });
    },
    []
  );

  const trackCTAClick = useCallback(
    async (ctaName: string, ctaLocation: string) => {
      await supabaseAnalytics.trackEvent('cta_click', 'Conversion', ctaName, undefined, {
        cta_location: ctaLocation,
      });
    },
    []
  );

  const trackFormSubmit = useCallback(
    async (formName: string, success: boolean = true) => {
      await supabaseAnalytics.trackEvent(
        success ? 'form_submit' : 'form_abandon',
        'Form',
        formName
      );
    },
    []
  );

  return {
    trackEvent,
    trackClick,
    trackCTAClick,
    trackFormSubmit,
  };
}

export default usePageTracking;

