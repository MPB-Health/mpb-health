import React from 'react';
import ReactDOM, { type Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, initBrand } from '@mpbhealth/ui';
import App from './App';
import { QueryStaleRecovery } from './components/QueryStaleRecovery';
import { getAdvisorQueryClient } from './query/advisorQueryClient';
import { setupServiceWorker } from './registerServiceWorker';
import { installAuthRefreshGuard } from './utils/installAuthRefreshGuard';
import './index.css';
import '@mpbhealth/ui/brand/aryx-brand.css';
import '@mpbhealth/ui/login-animations.css';

declare global {
  interface Window {
    __advisorSwReloadListener?: boolean;
  }
}

const queryClient = getAdvisorQueryClient();

// Stamp <html class="brand-mpb"> or "brand-aryx" before first render so the
// overlay CSS applies on first paint (no flash of mpb-blue on advisor.aryxcloud.com).
initBrand({ mpbLogo: '/assets/MPB-Health-No-background.png' });

installAuthRefreshGuard();
setupServiceWorker();

const SW_RELOAD_GUARD_KEY = 'advisor-sw-reload-ts';
/**
 * Refuse SW reloads in the first few seconds of boot — a reload that lands during
 * `INITIAL_SESSION` / profile hydration leaves the next page in a partially-loaded
 * state until the next manual refresh.
 */
const SW_RELOAD_BOOT_GUARD_MS = 6_000;
const __advisorBootAt = performance.now();

if ('serviceWorker' in navigator && !window.__advisorSwReloadListener) {
  window.__advisorSwReloadListener = true;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'RELOAD_PAGE') return;

    // Ignore reload requests that arrive while the shell is still booting.
    if (performance.now() - __advisorBootAt < SW_RELOAD_BOOT_GUARD_MS) {
      console.log('[PWA] Ignoring service worker reload during boot');
      return;
    }

    try {
      const last = Number(sessionStorage.getItem(SW_RELOAD_GUARD_KEY) || '0');
      if (Date.now() - last < 10000) return;
      sessionStorage.setItem(SW_RELOAD_GUARD_KEY, String(Date.now()));
    } catch (_) {
      // Ignore sessionStorage errors and continue with reload.
    }

    console.log('[PWA] Service worker requested reload:', event.data);
    window.location.reload();
  });
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Advisor Portal Error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ color: '#dc2626' }}>Something went wrong</h1>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Advisor Portal: #root element not found');
}

type RootContainer = HTMLElement & { __advisorReactRoot?: Root };

const container = rootEl as RootContainer;
const root = container.__advisorReactRoot ?? ReactDOM.createRoot(container);
container.__advisorReactRoot = root;

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <QueryStaleRecovery />
        <ThemeProvider>
          {/* Omit v7_startTransition: it desynced lazy route Outlet from the URL. */}
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '0.5rem',
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
