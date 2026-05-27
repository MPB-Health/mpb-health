import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@mpbhealth/ui';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { CRMProvider } from './contexts/CRMContext';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { installAuthRefreshGuard } from '@mpbhealth/database';
import { initBrand } from '@mpbhealth/ui';
import '@mpbhealth/ui/theme-tokens.css';
import './index.css';
import '@mpbhealth/ui/brand/aryx-brand.css';
import '@mpbhealth/ui/login-animations.css';

// Stamp <html class="brand-mpb"> or "brand-aryx" before first render so the
// overlay CSS applies on first paint (no flash of mpb-blue on crm.aryxcloud.com).
initBrand({ mpbLogo: '/assets/MPB-Health-No-background.png' });

// Detect dead refresh tokens at the network level and redirect to /login.
// Must run before React renders to catch early Supabase auto-refresh failures.
installAuthRefreshGuard({ loginPath: '/login' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <OrgProvider>
              <CRMProvider>
                <App />
                <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1E293B',
                    color: '#F8FAFC',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22C55E',
                      secondary: '#F8FAFC',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#F8FAFC',
                    },
                  },
                }}
              />
              </CRMProvider>
            </OrgProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
