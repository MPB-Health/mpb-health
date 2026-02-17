import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('Analytics');

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _linkedin_data_partner_ids?: string[];
    lintrk?: (type: string, data: any) => void;
    twq?: (...args: any[]) => void;
    pintrk?: (...args: any[]) => void;
    ttq?: any;
    rdt?: (...args: any[]) => void;
    snaptr?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
    hj?: (...args: any[]) => void;
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

export const initializeAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (GA_MEASUREMENT_ID && !window.gtag) {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        send_page_view: true
      });
    `;
    document.head.appendChild(script2);
  }

  // Facebook Pixel
  if (FB_PIXEL_ID && !window.fbq) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // LinkedIn Insight Tag
  if (LINKEDIN_INSIGHT_TAG) {
    const script = document.createElement('script');
    script.innerHTML = `
      _linkedin_partner_id = "${LINKEDIN_INSIGHT_TAG}";
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `;
    document.head.appendChild(script);

    const script2 = document.createElement('script');
    script2.async = true;
    script2.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(script2);
  }

  // Twitter Pixel
  if (TWITTER_PIXEL_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
      },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
      a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      twq('config','${TWITTER_PIXEL_ID}');
    `;
    document.head.appendChild(script);
  }

  // Pinterest Tag
  if (PINTEREST_TAG_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(e){if(!window.pintrk){window.pintrk = function () {
      window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
        n=window.pintrk;n.queue=[],n.version="3.0";var
        t=document.createElement("script");t.async=!0,t.src=e;var
        r=document.getElementsByTagName("script")[0];
        r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
      pintrk('load', '${PINTEREST_TAG_ID}');
      pintrk('page');
    `;
    document.head.appendChild(script);
  }

  // TikTok Pixel
  if (TIKTOK_PIXEL_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${TIKTOK_PIXEL_ID}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }

  // Reddit Pixel
  if (REDDIT_PIXEL_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
      rdt('init','${REDDIT_PIXEL_ID}');
      rdt('track', 'PageVisit');
    `;
    document.head.appendChild(script);
  }

  // Snapchat Pixel
  if (SNAPCHAT_PIXEL_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
      r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,
      'https://sc-static.net/scevent.min.js');
      snaptr('init', '${SNAPCHAT_PIXEL_ID}', {});
      snaptr('track', 'PAGE_VIEW');
    `;
    document.head.appendChild(script);
  }

  // Microsoft Clarity
  if (CLARITY_PROJECT_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
    `;
    document.head.appendChild(script);
  }

  // Hotjar
  if (HOTJAR_SITE_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:${HOTJAR_VERSION}};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
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