import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary';
import { lazyDefault } from './utils/lazyUtils';
import './index.css';

// Lazy load the App itself for better error isolation
const App = lazyDefault(() => import('./App'));

// Filter out StackBlitz platform errors from console
if (import.meta.env.DEV) {
  import('./lib/imageDebugger');

  // Suppress StackBlitz platform noise
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('ad_conversions') ||
        message.includes('stackblitz.com/api') ||
        message.includes('Tracking has already been taken') ||
        message.includes('/api/project/integrations/supabase')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('[Contextify]') ||
        message.includes('running source code in new context') ||
        message.includes('preloaded using link preload')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Get the root container
const container = document.getElementById('root');

// Validate container exists before mounting
if (!container) {
  console.error('[MPB Health] No #root element found. Skipping React mount.');
} else {
  console.info('[MPB Health] Mounting React app to #root element');

  const root = createRoot(container);

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f3fc] to-white">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-[#0a4c8f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-[#0a4c8f]">Loading...</p>
      </div>
    </div>
  );

  root.render(
    <StrictMode>
      <LazyLoadErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </LazyLoadErrorBoundary>
    </StrictMode>
  );
}
