import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallbackUI?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isError130: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  diagnosticInfo: string;
}

/**
 * Enhanced error boundary for catching lazy load and chunk failures.
 * Provides better detection of chunk-related errors and user-friendly recovery options.
 * 
 * Specifically handles:
 * - React Error #130 (Invalid element type - component resolved to number, undefined, etc.)
 * - React Error #306 (Lazy component failed to resolve)
 * - Chunk load failures (stale cache after deployment)
 */
class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      isError130: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      diagnosticInfo: '',
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as any).message || '')
        : '';

    const errorName =
      error && typeof error === 'object' && 'name' in error
        ? String((error as any).name || '')
        : '';

    // Detect React error #130 (invalid element type)
    const isError130 =
      message.includes('Minified React error #130') ||
      message.includes('Element type is invalid') ||
      message.includes('expected a string (for built-in components)') ||
      message.includes('expected string or function but got') ||
      message.includes('got: number') ||
      message.includes('got: undefined') ||
      message.includes('got: object');

    // Build diagnostic info for error #130
    let diagnosticInfo = '';
    if (isError130) {
      // Extract what type was received if available
      const typeMatch = message.match(/got[:\s]+(\w+)/i);
      const receivedType = typeMatch ? typeMatch[1] : 'unknown';
      
      diagnosticInfo = [
        `React Error #130 Detected`,
        `Received type: ${receivedType}`,
        `URL: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
        ``,
        `This error commonly occurs when:`,
        `• A component import resolved to an invalid value (number, undefined, null)`,
        `• Stale cached JavaScript chunks after a deployment`,
        `• Tier/plan configuration has numeric IDs instead of component references`,
        `• Missing or incorrect exports from a module`,
      ].join('\n');

      console.error(
        '[LazyLoadErrorBoundary] 🚨 React Error #130 detected.',
        '\n\n📋 DIAGNOSTIC INFO:',
        '\n- This usually means a component import resolved to an invalid value (number, undefined, etc.).',
        '\n- This is commonly caused by stale cached JavaScript chunks after a deployment.',
        '\n\n🔍 ERROR DETAILS:',
        '\n- Error message:', message,
        '\n- Current URL:', window.location.href,
        '\n- User Agent:', navigator.userAgent,
        '\n\n💡 RECOMMENDED ACTIONS:',
        '\n1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)',
        '\n2. Try incognito/private mode',
        '\n3. Check tier/plan configuration for numeric component values',
        '\n4. Verify all lazy-loaded components have proper default exports'
      );
    }

    // Detect ComponentGuard errors
    const isComponentGuardError = message.includes('[ComponentGuard]');
    if (isComponentGuardError) {
      diagnosticInfo = message;
      console.error('[LazyLoadErrorBoundary] ComponentGuard validation failed:', message);
    }

    // Comprehensive chunk/lazy load error detection
    const isChunkError =
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Failed to fetch') ||
      message.includes('Minified React error #306') ||
      message.includes('lazy import failed') ||
      (message.includes('export') && message.includes('not found')) ||
      message.includes('dynamically imported module') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('stale cache') ||
      message.includes('stale cached chunks') ||
      message.includes('[lazyAuto]') ||
      errorName === 'ChunkLoadError' ||
      isError130 ||
      isComponentGuardError;

    return {
      hasError: true,
      isChunkError,
      isError130,
      diagnosticInfo,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    const isChunkError = this.state.isChunkError;

    if (isChunkError) {
      console.error('[LazyLoadErrorBoundary] Chunk load failed:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        url: window.location.href,
      });
      
      // Auto-recovery: If this is the first chunk error and we haven't tried auto-reload recently
      if (this.state.retryCount === 0 && this.shouldAttemptAutoReload()) {
        console.warn('[LazyLoadErrorBoundary] Attempting automatic recovery...');
        this.markAutoReloadAttempted();
        this.handleClearCacheAndRetry();
        return;
      }
    } else {
      console.error('[LazyLoadErrorBoundary] Component error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }
  
  private shouldAttemptAutoReload(): boolean {
    try {
      const lastAttempt = sessionStorage.getItem('mpb_error_boundary_reload');
      if (lastAttempt) {
        const elapsed = Date.now() - parseInt(lastAttempt, 10);
        // Only allow auto-reload once per 60 seconds
        if (elapsed < 60000) {
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  }
  
  private markAutoReloadAttempted(): void {
    try {
      sessionStorage.setItem('mpb_error_boundary_reload', Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      isChunkError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Hard reload to ensure fresh chunks
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearCacheAndRetry = () => {
    // Clear caches if available
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage/sessionStorage cache markers if any
    try {
      localStorage.removeItem('chunk_version');
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }

    // Force reload bypassing cache
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      const { isChunkError, error, retryCount } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f3fc] to-white p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {isChunkError ? 'Loading Failed' : 'Something Went Wrong'}
            </h1>

            <p className="text-gray-600 mb-6">
              {isChunkError
                ? 'We had trouble loading this page. This usually happens due to a network issue, an outdated cached version, or a recent site update.'
                : 'An unexpected error occurred. Our team has been notified and is working on a fix.'}
            </p>

            {/* Show diagnostic info in production for Error #130 */}
            {this.state.isError130 && this.state.diagnosticInfo && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-left">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  ⚠️ Component Loading Error
                </p>
                <pre className="text-xs text-amber-700 whitespace-pre-wrap">
                  {this.state.diagnosticInfo}
                </pre>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-100 rounded text-left overflow-auto max-h-48">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 w-full"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              {isChunkError && (
                <Button
                  onClick={this.handleClearCacheAndRetry}
                  variant="outline"
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Cache & Retry
                </Button>
              )}

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
            </div>

            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Retry attempt: {retryCount}
              </p>
            )}

            {isChunkError && (
              <div className="mt-6 p-4 bg-blue-50 rounded text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Quick fixes to try:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)</li>
                  <li>Try refreshing the page</li>
                  <li>Use a different browser or incognito mode</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
