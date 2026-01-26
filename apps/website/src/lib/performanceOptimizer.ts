export const criticalCSS = `
/* Critical styles for above-the-fold content */
body { margin: 0; font-family: 'Source Sans 3', sans-serif; }
.header { position: sticky; top: 0; z-index: 50; }
.hero { min-height: 60vh; }
.btn-primary { background: linear-gradient(to right, #2563eb, #0891b2); }
`;

export const injectCriticalCSS = (): void => {
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
};

export const prefetchRoute = (url: string): void => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};

export const preconnect = (url: string): void => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

export const deferNonCriticalCSS = (): void => {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const linkEl = link as HTMLLinkElement;
    if (!linkEl.href.includes('critical')) {
      linkEl.media = 'print';
      linkEl.onload = () => { linkEl.media = 'all'; };
    }
  });
};

export const measurePerformance = (): PerformanceMetrics => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
  };
};

interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

export const reportWebVitals = (onPerfEntry?: (metric: any) => void): void => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export const optimizeQueryPerformance = async <T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  ttl: number = 300000
): Promise<T> => {
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < ttl) {
      return JSON.parse(cached);
    }
  }

  const result = await queryFn();
  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

  return result;
};
