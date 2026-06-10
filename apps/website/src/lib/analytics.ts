import { createClientLogger } from '@mpbhealth/utils';
import { supabase } from './supabase';

const log = createClientLogger('Analytics');

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    _linkedin_data_partner_ids?: string[];
    lintrk?: (type: string, data: any) => void;
    twq?: (...args: any[]) => void;
    pintrk?: (...args: any[]) => void;
    ttq?: any;
    rdt?: (...args: any[]) => void;
    snaptr?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
    hj?: (...args: any[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

// Helper function to validate that an ID is not a placeholder value
const isValidAnalyticsId = (id: string | undefined): boolean => {
  if (!id) return false;
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /^your_/i,
    /^xxx+$/i,
    /^placeholder/i,
    /^test_/i,
    /^example/i,
    /^insert.*(id|key|tag)/i,
    /^change.*me/i,
  ];
  return !placeholderPatterns.some(pattern => pattern.test(id));
};

const GA_MEASUREMENT_ID = isValidAnalyticsId(import.meta.env.VITE_GA_MEASUREMENT_ID) ? import.meta.env.VITE_GA_MEASUREMENT_ID : undefined;
const FB_PIXEL_ID = isValidAnalyticsId(import.meta.env.VITE_FB_PIXEL_ID) ? import.meta.env.VITE_FB_PIXEL_ID : undefined;
const LINKEDIN_INSIGHT_TAG = isValidAnalyticsId(import.meta.env.VITE_LINKEDIN_INSIGHT_TAG) ? import.meta.env.VITE_LINKEDIN_INSIGHT_TAG : undefined;
const TWITTER_PIXEL_ID = isValidAnalyticsId(import.meta.env.VITE_TWITTER_PIXEL_ID) ? import.meta.env.VITE_TWITTER_PIXEL_ID : undefined;
const PINTEREST_TAG_ID = isValidAnalyticsId(import.meta.env.VITE_PINTEREST_TAG_ID) ? import.meta.env.VITE_PINTEREST_TAG_ID : undefined;
const TIKTOK_PIXEL_ID = isValidAnalyticsId(import.meta.env.VITE_TIKTOK_PIXEL_ID) ? import.meta.env.VITE_TIKTOK_PIXEL_ID : undefined;
const REDDIT_PIXEL_ID = isValidAnalyticsId(import.meta.env.VITE_REDDIT_PIXEL_ID) ? import.meta.env.VITE_REDDIT_PIXEL_ID : undefined;
const SNAPCHAT_PIXEL_ID = isValidAnalyticsId(import.meta.env.VITE_SNAPCHAT_PIXEL_ID) ? import.meta.env.VITE_SNAPCHAT_PIXEL_ID : undefined;
const CLARITY_PROJECT_ID = isValidAnalyticsId(import.meta.env.VITE_CLARITY_PROJECT_ID) ? import.meta.env.VITE_CLARITY_PROJECT_ID : undefined;
const HOTJAR_SITE_ID = isValidAnalyticsId(import.meta.env.VITE_HOTJAR_SITE_ID) ? import.meta.env.VITE_HOTJAR_SITE_ID : undefined;
const HOTJAR_VERSION = import.meta.env.VITE_HOTJAR_VERSION || '6';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', eventName, {
      ...properties,
      send_to: GA_MEASUREMENT_ID,
    });
  }

  // Facebook Pixel
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('trackCustom', eventName, properties);
  }

  // LinkedIn Insight Tag
  if (window.lintrk && LINKEDIN_INSIGHT_TAG) {
    window.lintrk('track', { conversion_id: eventName });
  }

  // Twitter Pixel
  if (window.twq && TWITTER_PIXEL_ID) {
    window.twq('event', eventName, properties);
  }

  // Pinterest Tag
  if (window.pintrk && PINTEREST_TAG_ID) {
    window.pintrk('track', eventName, properties);
  }

  // TikTok Pixel
  if (window.ttq && TIKTOK_PIXEL_ID) {
    window.ttq.track(eventName, properties);
  }

  // Reddit Pixel
  if (window.rdt && REDDIT_PIXEL_ID) {
    window.rdt('track', eventName, properties);
  }

  // Snapchat Pixel
  if (window.snaptr && SNAPCHAT_PIXEL_ID) {
    window.snaptr('track', eventName, properties);
  }

  // Development logging
  log.info('Track Event:', eventName, properties);
};

export const trackPageView = (path: string) => {
  if (typeof window === 'undefined') return;

  // Google Analytics 4 - Native page view
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }

  // Facebook Pixel - Page view
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }

  trackEvent('page_view', { path });
};

function appendExternalScript(src: string, onLoad?: () => void): HTMLScriptElement {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  if (onLoad) {
    script.addEventListener('load', onLoad, { once: true });
  }
  document.head.appendChild(script);
  return script;
}

function ensureGtag(measurementId: string): void {
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  appendExternalScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, () => {
    window.gtag!('js', new Date());
    window.gtag!('config', measurementId, { send_page_view: true });
  });
}

function ensureFacebookPixel(pixelId: string): void {
  if (window.fbq) return;

  const queue: unknown[][] = [];
  const fbq = function (...args: unknown[]) {
    if ((fbq as { callMethod?: (...a: unknown[]) => void }).callMethod) {
      (fbq as { callMethod: (...a: unknown[]) => void }).callMethod(...args);
    } else {
      queue.push(args);
    }
  } as typeof window.fbq & { queue: unknown[][]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void };

  fbq.queue = queue;
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  appendExternalScript('https://connect.facebook.net/en_US/fbevents.js', () => {
    window.fbq!('init', pixelId);
    window.fbq!('track', 'PageView');
  });
}

function ensureTwitterPixel(pixelId: string): void {
  if (window.twq) return;

  const queue: unknown[][] = [];
  const twq = function (...args: unknown[]) {
    if ((twq as { exe?: (...a: unknown[]) => void }).exe) {
      (twq as { exe: (...a: unknown[]) => void }).exe(...args);
    } else {
      queue.push(args);
    }
  } as typeof window.twq & { queue: unknown[][]; version?: string; exe?: (...a: unknown[]) => void };

  twq.queue = queue;
  twq.version = '1.1';
  window.twq = twq;

  appendExternalScript('https://static.ads-twitter.com/uwt.js', () => {
    window.twq!('config', pixelId);
  });
}

function ensurePinterestTag(tagId: string): void {
  if (window.pintrk) return;

  const queue: unknown[][] = [];
  const pintrk = function (...args: unknown[]) {
    queue.push(Array.prototype.slice.call(args));
  } as typeof window.pintrk & { queue: unknown[][]; version?: string };

  pintrk.queue = queue;
  pintrk.version = '3.0';
  window.pintrk = pintrk;

  appendExternalScript('https://s.pinimg.com/ct/core.js', () => {
    window.pintrk!('load', tagId);
    window.pintrk!('page');
  });
}

function ensureTikTokPixel(pixelId: string): void {
  if (window.ttq) return;

  const ttq: Record<string, unknown> & { _i?: Record<string, unknown[]>; load?: (id: string) => void; page?: () => void } = {};
  const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
  for (const method of methods) {
    ttq[method] = function (...args: unknown[]) {
      (ttq[method] as { q?: unknown[][] }).q = (ttq[method] as { q?: unknown[][] }).q || [];
      (ttq[method] as { q: unknown[][] }).q.push(args);
    };
  }
  ttq.load = (id: string) => {
    appendExternalScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`, () => {
      ttq.page?.();
    });
  };
  window.ttq = ttq;
  ttq.load(pixelId);
}

function ensureRedditPixel(pixelId: string): void {
  if (window.rdt) return;

  const callQueue: unknown[][] = [];
  const rdt = function (...args: unknown[]) {
    if ((rdt as { sendEvent?: (...a: unknown[]) => void }).sendEvent) {
      (rdt as { sendEvent: (...a: unknown[]) => void }).sendEvent(...args);
    } else {
      callQueue.push(args);
    }
  } as typeof window.rdt & { callQueue: unknown[][]; sendEvent?: (...a: unknown[]) => void };

  rdt.callQueue = callQueue;
  window.rdt = rdt;

  appendExternalScript('https://www.redditstatic.com/ads/pixel.js', () => {
    window.rdt!('init', pixelId);
    window.rdt!('track', 'PageVisit');
  });
}

function ensureSnapchatPixel(pixelId: string): void {
  if (window.snaptr) return;

  const queue: unknown[][] = [];
  const snaptr = function (...args: unknown[]) {
    if ((snaptr as { handleRequest?: (...a: unknown[]) => void }).handleRequest) {
      (snaptr as { handleRequest: (...a: unknown[]) => void }).handleRequest(...args);
    } else {
      queue.push(args);
    }
  } as typeof window.snaptr & { queue: unknown[][]; handleRequest?: (...a: unknown[]) => void };

  snaptr.queue = queue;
  window.snaptr = snaptr;

  appendExternalScript('https://sc-static.net/scevent.min.js', () => {
    window.snaptr!('init', pixelId, {});
    window.snaptr!('track', 'PAGE_VIEW');
  });
}

function ensureClarity(projectId: string): void {
  if (window.clarity) return;

  const clarity = function (...args: unknown[]) {
    (clarity as { q?: unknown[][] }).q = (clarity as { q?: unknown[][] }).q || [];
    (clarity as { q: unknown[][] }).q.push(args);
  } as typeof window.clarity & { q?: unknown[][] };

  window.clarity = clarity;
  appendExternalScript(`https://www.clarity.ms/tag/${projectId}?ref=bwt`);
}

function ensureHotjar(siteId: string, version: string): void {
  if (window.hj) return;

  const hj = function (...args: unknown[]) {
    (hj as { q?: unknown[][] }).q = (hj as { q?: unknown[][] }).q || [];
    (hj as { q: unknown[][] }).q.push(args);
  } as typeof window.hj & { q?: unknown[][] };

  window.hj = hj;
  window._hjSettings = { hjid: Number(siteId), hjsv: Number(version) };
  appendExternalScript(`https://static.hotjar.com/c/hotjar-${siteId}.js?sv=${version}`);
}

export const initializeAnalytics = () => {
  if (typeof window === 'undefined') return;

  if (GA_MEASUREMENT_ID) {
    ensureGtag(GA_MEASUREMENT_ID);
  }

  if (FB_PIXEL_ID) {
    ensureFacebookPixel(FB_PIXEL_ID);
  }

  if (LINKEDIN_INSIGHT_TAG) {
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(LINKEDIN_INSIGHT_TAG);
    appendExternalScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }

  if (TWITTER_PIXEL_ID) {
    ensureTwitterPixel(TWITTER_PIXEL_ID);
  }

  if (PINTEREST_TAG_ID) {
    ensurePinterestTag(PINTEREST_TAG_ID);
  }

  if (TIKTOK_PIXEL_ID) {
    ensureTikTokPixel(TIKTOK_PIXEL_ID);
  }

  if (REDDIT_PIXEL_ID) {
    ensureRedditPixel(REDDIT_PIXEL_ID);
  }

  if (SNAPCHAT_PIXEL_ID) {
    ensureSnapchatPixel(SNAPCHAT_PIXEL_ID);
  }

  if (CLARITY_PROJECT_ID) {
    ensureClarity(CLARITY_PROJECT_ID);
  }

  if (HOTJAR_SITE_ID) {
    ensureHotjar(HOTJAR_SITE_ID, HOTJAR_VERSION);
  }
};

/**
 * Loads enabled tracking snippets from the database (configured via the admin
 * panel's Analytics Integration Management) and injects them into the page.
 * Snippets in test mode log to console instead of injecting.
 */
export const loadDatabaseSnippets = async () => {
  if (typeof window === 'undefined') return;

  try {
    const { data: snippets, error } = await supabase
      .from('tracking_snippets')
      .select('id, snippet_name, snippet_type, tracking_id, snippet_code, injection_point, is_enabled, is_test_mode, load_priority, created_at, updated_at')
      .eq('is_enabled', true)
      .order('load_priority', { ascending: false });

    if (error) {
      log.warn('Failed to load tracking snippets:', error.message);
      return;
    }

    if (!snippets || snippets.length === 0) return;

    for (const snippet of snippets) {
      if (snippet.is_test_mode) {
        log.info(`[Test Mode] Snippet "${snippet.snippet_name}" (${snippet.tracking_id || 'no ID'}) — not injected`);
        continue;
      }

      try {
        if (snippet.snippet_code) {
          const target = snippet.injection_point === 'body_end' ? document.body : document.head;
          const container = document.createElement('div');
          container.innerHTML = snippet.snippet_code;

          const scripts = container.querySelectorAll('script');
          const nonScriptContent = snippet.snippet_code.replace(/<script[\s\S]*?<\/script>/gi, '').trim();

          if (nonScriptContent) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = nonScriptContent;
            while (wrapper.firstChild) {
              target.appendChild(wrapper.firstChild);
            }
          }

          for (const oldScript of scripts) {
            if (oldScript.textContent?.trim()) {
              log.warn(
                `Skipping inline script in snippet "${snippet.snippet_name}" — strict CSP requires external script src only`,
              );
              continue;
            }
            if (!oldScript.src) continue;

            const newScript = document.createElement('script');
            for (const attr of oldScript.attributes) {
              newScript.setAttribute(attr.name, attr.value);
            }
            newScript.async = true;
            target.appendChild(newScript);
          }

          log.info(`Injected snippet: ${snippet.snippet_name}`);
        }

        if (snippet.tracking_id && !snippet.snippet_code) {
          const platformType = snippet.snippet_type?.toLowerCase() || '';
          if (platformType.includes('gtag') || platformType.includes('google') || snippet.snippet_name?.toLowerCase().includes('google')) {
            if (!window.gtag) {
              ensureGtag(snippet.tracking_id);
              log.info(`Injected Google Analytics: ${snippet.tracking_id}`);
            }
          }
        }
      } catch (snippetError) {
        log.warn(`Failed to inject snippet "${snippet.snippet_name}":`, snippetError);
      }
    }
  } catch (err) {
    log.warn('Error loading database snippets:', err);
  }
};

export const trackCTAClick = (ctaName: string, location: string) => {
  trackEvent('cta_click', { 
    cta_name: ctaName,
    location: location,
    timestamp: new Date().toISOString()
  });
};

export const trackFormStep = (formName: string, step: number, totalSteps: number) => {
  trackEvent('form_step', {
    form_name: formName,
    step: step,
    total_steps: totalSteps,
    progress: (step / totalSteps) * 100
  });
};

export const trackCalculatorUsage = (householdSize: number, ageRanges: string[], estimatedCost: number) => {
  trackEvent('calculator_usage', {
    household_size: householdSize,
    age_ranges: ageRanges,
    estimated_cost: estimatedCost
  });
};

export enum AnalyticsEvents {
  RATE_CALC_OPEN = 'rate_calculator_opened',
  RATE_CALC_SUBMIT = 'rate_calculator_submitted',
  RATE_CALC_RESULT = 'rate_calculator_result',
  CALCULATE_RATE = 'calculate_rate',
  CONSULTATION_REQUEST = 'consultation_request',
  ENROLL_CLICK = 'enroll_click',
  ONBOARDING_START = 'ob_start',
  ONBOARDING_ANSWER = 'ob_answer',
  ONBOARDING_RECO_SHOWN = 'ob_reco_shown',
  ONBOARDING_CTA_CLICK = 'ob_cta_click',
  BLOG_ARTICLE_VIEW = 'blog_article_view',
  BLOG_ARTICLE_READ = 'blog_article_read',
  BLOG_ARTICLE_SHARE = 'blog_article_share',
  BLOG_CTA_CLICK = 'blog_cta_click',
  BLOG_SCROLL_DEPTH = 'blog_scroll_depth',
  BLOG_TIME_ON_PAGE = 'blog_time_on_page',
  BLOG_CREATED = 'blog_created',
  BLOG_PUBLISHED = 'blog_published',
  BLOG_EDITED = 'blog_edited',
  BLOG_DELETED = 'blog_deleted',
}

interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export function useAnalytics() {
  const track = (event: AnalyticsEvent) => {
    trackEvent(event.event, {
      category: event.category,
      label: event.label,
      value: event.value,
      ...event.custom_parameters,
    });
  };

  return { track };
}

export const trackBlogArticleView = (articleId: string, title: string, category: string) => {
  trackEvent(AnalyticsEvents.BLOG_ARTICLE_VIEW, {
    article_id: articleId,
    article_title: title,
    article_category: category,
    timestamp: new Date().toISOString()
  });
};

export const trackBlogArticleRead = (articleId: string, timeSpent: number, scrollDepth: number) => {
  trackEvent(AnalyticsEvents.BLOG_ARTICLE_READ, {
    article_id: articleId,
    time_spent_seconds: timeSpent,
    scroll_depth_percent: scrollDepth,
    engagement_score: (timeSpent * scrollDepth) / 100,
    timestamp: new Date().toISOString()
  });
};

export const trackBlogShare = (articleId: string, platform: string) => {
  trackEvent(AnalyticsEvents.BLOG_ARTICLE_SHARE, {
    article_id: articleId,
    share_platform: platform,
    timestamp: new Date().toISOString()
  });
};

export const trackBlogScrollDepth = (articleId: string, depth: number) => {
  trackEvent(AnalyticsEvents.BLOG_SCROLL_DEPTH, {
    article_id: articleId,
    scroll_depth: depth,
    timestamp: new Date().toISOString()
  });
};

export const trackBlogCTAClick = (articleId: string, ctaText: string, ctaLocation: string) => {
  trackEvent(AnalyticsEvents.BLOG_CTA_CLICK, {
    article_id: articleId,
    cta_text: ctaText,
    cta_location: ctaLocation,
    timestamp: new Date().toISOString()
  });
};

export const trackBlogAdminAction = (action: 'created' | 'published' | 'edited' | 'deleted', articleId: string, articleTitle: string) => {
  const eventMap = {
    created: AnalyticsEvents.BLOG_CREATED,
    published: AnalyticsEvents.BLOG_PUBLISHED,
    edited: AnalyticsEvents.BLOG_EDITED,
    deleted: AnalyticsEvents.BLOG_DELETED
  };

  trackEvent(eventMap[action], {
    article_id: articleId,
    article_title: articleTitle,
    admin_action: action,
    timestamp: new Date().toISOString()
  });
};