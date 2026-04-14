// ============================================================================
// Error Boundary Components
// Provides graceful error handling at different levels of the app
// ============================================================================

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'route' | 'widget';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================================
// Route-level Error Boundary
// Used to wrap individual routes/pages - nav stays intact
// ============================================================================

export class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[RouteErrorBoundary] Error caught:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <RouteErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Widget-level Error Boundary
// Used for dashboard widgets - keeps other widgets working
// ============================================================================

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetName?: string;
  onError?: (error: Error) => void;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(`[WidgetErrorBoundary] ${this.props.widgetName || 'Widget'} error:`, error);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          error={this.state.error}
          widgetName={this.props.widgetName}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Route Error Fallback UI
// ============================================================================

interface RouteErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
}

function RouteErrorFallback({ error, errorInfo, onRetry, onGoHome }: RouteErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-th-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-th-text-secondary">
            This page encountered an error. Don&apos;t worry, your data is safe.
          </p>
        </div>

        {/* Error Details (collapsible) */}
        {error && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-text-primary mx-auto"
            >
              <Bug className="w-4 h-4" />
              <span>Technical details</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showDetails && (
              <div className="mt-3 p-4 bg-surface-tertiary rounded-lg text-sm font-mono overflow-auto max-h-48">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
                  {error.name}: {error.message}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-th-text-secondary text-xs whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-tertiary text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Widget Error Fallback UI
// ============================================================================

interface WidgetErrorFallbackProps {
  error: Error | null;
  widgetName?: string;
  onRetry: () => void;
}

function WidgetErrorFallback({ error, widgetName, onRetry }: WidgetErrorFallbackProps) {
  return (
    <div className="p-4 text-center">
      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-th-text-primary mb-1">
        {widgetName ? `${widgetName} failed to load` : 'Widget error'}
      </p>
      <p className="text-xs text-th-text-secondary mb-3">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={onRetry}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

// ============================================================================
// App-level Error Boundary
// Last resort - catches errors that escape route boundaries
// ============================================================================

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Critical error:', error, errorInfo);
    // Error reporting (e.g. Sentry) can be wired here when configured
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-th-text-primary mb-2">
              Application Error
            </h1>
            <p className="text-th-text-secondary mb-6">
              The application encountered a critical error. Please refresh the page to continue.
            </p>
            <button
              onClick={this.handleRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-th-accent-primary text-white rounded-lg hover:bg-th-accent-hover transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
            {this.state.error && (
              <div className="mt-6 p-4 bg-surface-tertiary rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
