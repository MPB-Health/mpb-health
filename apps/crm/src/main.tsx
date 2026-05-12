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
import { applyBrandClass } from './lib/brand';
import '@mpbhealth/ui/theme-tokens.css';
import './index.css';
import './styles/aryx-brand.css';
import '@mpbhealth/ui/login-animations.css';

// Set <html class="brand-mpb"> or "brand-aryx" before first render so the
// overlay CSS in aryx-brand.css applies on first paint (no flash of mpb-blue
// when visiting crm.aryxcloud.com). Hostname check lives in src/lib/brand.ts.
applyBrandClass();

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
