import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('ZohoSalesIQ');

export interface ZohoSalesIQError {
  timestamp: string;
  error_type: string;
  error_message: string;
  widget_code: string;
  user_agent: string;
  url: string;
  network_details?: {
    status?: number;
    statusText?: string;
    response?: string;
  };
}

export interface ZohoSalesIQStatus {
  isLoaded: boolean;
  isReady: boolean;
  hasError: boolean;
  errorDetails?: ZohoSalesIQError;
  lastChecked: string;
  isDevelopment?: boolean;
  recommendation?: string;
}

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        widgetcode?: string;
        values?: Record<string, any>;
        ready: (callback: () => void) => void;
        floatbutton?: {
          visible: (visible: 'show' | 'hide') => void;
        };
        chat?: {
          start: () => void;
        };
      };
    };
  }
  
  interface HTMLScriptElement {
    readyState?: string;
  }
}

class ZohoSalesIQManager {
  private widgetCode = 'siq341f0a21deffa52db946003babb9a87b';
  private scriptUrl = 'https://salesiq.zohopublic.com/widget';
  private loadTimeout = 15000;
  private isDevelopmentEnvironment = false;
  private status: ZohoSalesIQStatus = {
    isLoaded: false,
    isReady: false,
    hasError: false,
    lastChecked: new Date().toISOString(),
  };
  private errorCallbacks: Array<(error: ZohoSalesIQError) => void> = [];
  private readyCallbacks: Array<() => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    this.detectEnvironment();
    this.setupWindowObject();
    this.monitorScriptLoad();
    this.setupReadyHandler();
    this.startHealthCheck();
  }

  private detectEnvironment() {
    const hostname = window.location.hostname;
    const matchesLocalHostname =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('local-credentialless.webcontainer') ||
      hostname.includes('.local') ||
      hostname.includes('.test') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.includes('ngrok') ||
      hostname.includes('stackblitz') ||
      hostname.includes('codesandbox');

    this.isDevelopmentEnvironment = import.meta.env.DEV || matchesLocalHostname;

    this.status.isDevelopment = this.isDevelopmentEnvironment;

    if (this.isDevelopmentEnvironment && import.meta.env.DEV) {
      console.warn('[Zoho SalesIQ] Development environment detected. Widget may not initialize due to domain whitelisting.');
      this.status.recommendation = 'Add your development domain to Zoho SalesIQ dashboard whitelist, or test on production domain.';
    }
  }

  private setupWindowObject() {
    if (!window.$zoho) {
      window.$zoho = {};
    }
    if (!window.$zoho.salesiq) {
      window.$zoho.salesiq = {
        widgetcode: this.widgetCode,
        values: {},
        ready: (callback: () => void) => {
          this.readyCallbacks.push(callback);
        },
      };
    } else {
      // Preserve existing widgetcode if already set (from index.html)
      // Only set if undefined to prevent race condition
      if (!window.$zoho.salesiq.widgetcode) {
        window.$zoho.salesiq.widgetcode = this.widgetCode;
      }
      if (!window.$zoho.salesiq.values) {
        window.$zoho.salesiq.values = {};
      }
    }
  }

  private monitorScriptLoad() {
    let attempts = 0;
    const maxAttempts = 10;
    const retryInterval = 1000; // 1 second between retries

    const checkScript = () => {
      const script = document.getElementById('zsiqscript');
      
      if (!script) {
        attempts++;
        
        if (attempts < maxAttempts) {
          // Script might be loaded via requestIdleCallback or setTimeout in index.html
          // Retry after a short delay to handle the race condition
          setTimeout(checkScript, retryInterval);
          return;
        }
        
        // Only log error after all retry attempts exhausted
        this.logError({
          timestamp: new Date().toISOString(),
          error_type: 'SCRIPT_NOT_FOUND',
          error_message: `Zoho SalesIQ script element not found in DOM after ${maxAttempts} attempts (${maxAttempts * retryInterval / 1000}s)`,
          widget_code: this.widgetCode,
          user_agent: navigator.userAgent,
          url: window.location.href,
        });
        return;
      }

      // Script found - attach event listeners
      // Check if script already loaded (it may have loaded before we found it)
      if ((script as HTMLScriptElement).readyState === 'complete' || 
          document.querySelector('script[src*="salesiq.zohopublic.com"]')?.getAttribute('data-status') === 'loaded') {
        this.status.isLoaded = true;
        this.status.lastChecked = new Date().toISOString();
      }

      script.addEventListener('load', () => {
        this.status.isLoaded = true;
        this.status.lastChecked = new Date().toISOString();
      });

      script.addEventListener('error', () => {
        this.logError({
          timestamp: new Date().toISOString(),
          error_type: 'SCRIPT_LOAD_ERROR',
          error_message: 'Failed to load Zoho SalesIQ script',
          widget_code: this.widgetCode,
          user_agent: navigator.userAgent,
          url: window.location.href,
        });
      });
    };

    // Start checking after a short delay to allow deferred script injection
    // The script is loaded via requestIdleCallback or setTimeout(fn, 2000) in index.html
    const startDelay = 500; // Start checking after 500ms
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkScript, startDelay);
      });
    } else {
      setTimeout(checkScript, startDelay);
    }
  }

  private setupReadyHandler() {
    if (window.$zoho?.salesiq) {
      window.$zoho.salesiq.ready = (callback: () => void) => {
        this.status.isReady = true;
        this.status.lastChecked = new Date().toISOString();

        this.readyCallbacks.forEach(cb => {
          try {
            cb();
          } catch (error) {
            console.error('[Zoho SalesIQ] Ready callback error:', error);
          }
        });

        if (callback) {
          try {
            callback();
          } catch (error) {
            console.error('[Zoho SalesIQ] Ready callback error:', error);
          }
        }
      };
    }

    setTimeout(() => {
      if (!this.status.isReady) {
        const errorMessage = this.isDevelopmentEnvironment
          ? `Widget did not become ready within ${this.loadTimeout}ms. CAUSE: Development domain not whitelisted in Zoho SalesIQ dashboard. SOLUTION: Add "${window.location.hostname}" to your Zoho SalesIQ Brand settings, or test on your production domain.`
          : `Widget did not become ready within ${this.loadTimeout}ms. CAUSE: Domain "${window.location.hostname}" may not be whitelisted in Zoho SalesIQ dashboard. SOLUTION: Log into Zoho SalesIQ, go to Settings > Brands, and verify this domain is added to the whitelist.`;

        this.logError({
          timestamp: new Date().toISOString(),
          error_type: 'READY_TIMEOUT',
          error_message: errorMessage,
          widget_code: this.widgetCode,
          user_agent: navigator.userAgent,
          url: window.location.href,
        });
      }
    }, this.loadTimeout);
  }

  private startHealthCheck() {
    // Reduce health check frequency to once every 5 minutes (300000ms)
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);

    // Initial health check after 5 seconds
    setTimeout(() => {
      this.performHealthCheck();
    }, 5000);
  }

  private async performHealthCheck() {
    this.status.lastChecked = new Date().toISOString();

    try {
      const _response = await fetch(this.scriptUrl, {
        method: 'HEAD',
        mode: 'no-cors',
      });

      // Only log in development mode or when status changes
      if (!this.status.isReady) {
        log.info('[Zoho SalesIQ] Health check completed');
      }
    } catch (error) {
      this.logError({
        timestamp: new Date().toISOString(),
        error_type: 'HEALTH_CHECK_FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error during health check',
        widget_code: this.widgetCode,
        user_agent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  private logError(error: ZohoSalesIQError) {
    this.status.hasError = true;
    this.status.errorDetails = error;

    // Only log to console in development mode - silent in production
    if (import.meta.env.DEV) {
      console.debug('[Zoho SalesIQ] Error:', error.error_type, error.error_message);
    }

    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('[Zoho SalesIQ] Error callback threw:', callbackError);
      }
    });

    // Still send errors to Supabase for monitoring (silent, no console output)
    if (!this.isDevelopmentEnvironment) {
      this.sendErrorToSupabase(error).catch((e) => {
        console.error('[Zoho SalesIQ] Unhandled sendErrorToSupabase rejection:', e);
      });
    }
  }

  private async sendErrorToSupabase(error: ZohoSalesIQError) {
    try {
      const { supabase, isSupabaseConfigured } = await import('./supabase');

      if (!isSupabaseConfigured) {
        return;
      }

      await supabase
        .from('zoho_salesiq_errors')
        .insert({
          error_type: error.error_type,
          error_message: error.error_message,
          widget_code: error.widget_code,
          user_agent: error.user_agent,
          url: error.url,
          network_details: error.network_details,
          created_at: error.timestamp,
        });

      // Silent - no console output for database errors
    } catch (error) {
      console.error('[Zoho SalesIQ] Failed to send error to Supabase:', error);
    }
  }

  public getStatus(): ZohoSalesIQStatus {
    return { ...this.status };
  }

  public onError(callback: (error: ZohoSalesIQError) => void) {
    this.errorCallbacks.push(callback);
  }

  public onReady(callback: () => void) {
    if (this.status.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  public async getDiagnostics() {
    const diagnostics = {
      status: this.status,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        hostname: window.location.hostname,
        isDevelopment: this.isDevelopmentEnvironment,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      widget: {
        code: this.widgetCode,
        scriptUrl: this.scriptUrl,
        scriptExists: !!document.getElementById('zsiqscript'),
        $zohoExists: !!window.$zoho,
        salesiqExists: !!window.$zoho?.salesiq,
      },
      csp: this.checkCSP(),
      networkTest: await this.testNetwork(),
    };

    return diagnostics;
  }

  private checkCSP() {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) {
      const content = metaCSP.getAttribute('content') || '';
      return {
        exists: true,
        allowsZohoDomains: content.includes('salesiq.zohopublic.com') && content.includes('salesiq.zoho.com'),
        content: content.substring(0, 200),
      };
    }
    return { exists: false };
  }

  private async testNetwork() {
    try {
      const startTime = performance.now();
      const response = await fetch(this.scriptUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = performance.now();

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        responseTime: Math.round(endTime - startTime),
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async exportDiagnosticsReport() {
    const diagnostics = await this.getDiagnostics();
    const report = JSON.stringify(diagnostics, null, 2);

    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoho-salesiq-diagnostics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return diagnostics;
  }
}

export const zohoSalesIQManager = new ZohoSalesIQManager();

export const useZohoSalesIQ = () => {
  return {
    getStatus: () => zohoSalesIQManager.getStatus(),
    getDiagnostics: () => zohoSalesIQManager.getDiagnostics(),
    exportDiagnostics: () => zohoSalesIQManager.exportDiagnosticsReport(),
    onError: (callback: (error: ZohoSalesIQError) => void) => zohoSalesIQManager.onError(callback),
    onReady: (callback: () => void) => zohoSalesIQManager.onReady(callback),
  };
};
