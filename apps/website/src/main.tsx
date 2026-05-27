import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary';
import { installAuthRefreshGuard } from '@mpbhealth/database';
import './index.css';
import '@mpbhealth/ui/login-animations.css';
import App from './App';

// Detect dead refresh tokens at the network level and redirect to /login.
// Must run before React renders to catch early Supabase auto-refresh failures.
installAuthRefreshGuard({
  loginPath: '/login',
  excludePaths: ['/login', '/admin/login', '/forgot-password', '/reset-password'],
});

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

  root.render(
    <StrictMode>
      <LazyLoadErrorBoundary>
        <App />
      </LazyLoadErrorBoundary>
    </StrictMode>
  );
}
