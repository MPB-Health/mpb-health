import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@mpbhealth/ui';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { CRMProvider } from './contexts/CRMContext';
import '@mpbhealth/ui/theme-tokens.css';
import './index.css';
import '@mpbhealth/ui/login-animations.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
