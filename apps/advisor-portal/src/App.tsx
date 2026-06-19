import React from 'react';
import { isAosPlatformHost } from '@mpbhealth/auth';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { TourProvider } from './contexts/TourContext';
import AosRoutes from './routing/AosRoutes';
import MpbRoutes from './routing/MpbRoutes';

export { prefetchRoute, prefetchRouteByPath } from './routing/lazyPages';

// ── Route-level error boundary ───────────────────────────────────────────────
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  private readonly chunkReloadKey = 'advisor-route-chunk-reload-ts';

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Advisor route error:', error, info.componentStack);

    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('error loading dynamically imported module');

    if (isChunkError) {
      try {
        const last = Number(sessionStorage.getItem(this.chunkReloadKey) || '0');
        if (Date.now() - last > 30000) {
          sessionStorage.setItem(this.chunkReloadKey, String(Date.now()));
          window.location.reload();
        }
      } catch (_) {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const detail =
        this.state.error?.message?.trim() ||
        'The app route table failed to load. Hard-refresh the page or contact support if this persists.';

      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Page failed to load</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>{detail}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              marginRight: '0.5rem',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const useAosRoutes =
  typeof window !== 'undefined' && isAosPlatformHost(window.location.hostname);

export default function App() {
  return (
    <AdvisorProvider>
      <TourProvider>
        <RouteErrorBoundary>
          {useAosRoutes ? <AosRoutes /> : <MpbRoutes />}
        </RouteErrorBoundary>
      </TourProvider>
    </AdvisorProvider>
  );
}
