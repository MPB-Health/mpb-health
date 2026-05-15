import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import ConciergeDailyLogsShell from './layouts/ConciergeDailyLogsShell';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const NewTicket = lazy(() => import('./pages/NewTicket'));
const Profile = lazy(() => import('./pages/Profile'));

// Prefetch common routes when the browser is idle
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('./pages/Dashboard').catch(() => {});
    import('./pages/DailyLogs').catch(() => {});
    import('./pages/Tickets').catch(() => {});
    import('./pages/Profile').catch(() => {});
  });
}

function PageLoader() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-[#4A7C8A]" />
    </div>
  );
}

function FullPageLoader() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
}

/**
 * Magic-link / recovery callbacks land on `/` with auth tokens in the URL hash
 * (e.g. `/#access_token=…&refresh_token=…&type=magiclink`). Supabase's `detectSessionInUrl`
 * processes them asynchronously, so we must hold the guard in `loading` until that finishes
 * — otherwise `getSession()` returns null first and we bounce the user to `/login`.
 */
function hasAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  if (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error_description=')) {
    return true;
  }
  const search = window.location.search || '';
  return /[?&](code|token_hash|token)=/.test(search);
}

function clearAuthCallbackHash(): void {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (window.location.hash) {
    window.history.replaceState(null, '', `${pathname}${search}`);
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;
    const awaitingCallback = hasAuthCallbackInUrl();

    const settle = (next: 'authenticated' | 'unauthenticated') => {
      if (cancelled) return;
      setState(next);
      if (awaitingCallback) clearAuthCallbackHash();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      settle(session ? 'authenticated' : 'unauthenticated');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settle('authenticated');
        return;
      }
      if (!awaitingCallback) {
        settle('unauthenticated');
        return;
      }
      // Hash callback present but session not yet established — give detectSessionInUrl a moment.
      setTimeout(() => {
        if (cancelled) return;
        supabase.auth.getSession().then(({ data: { session: late } }) => {
          settle(late ? 'authenticated' : 'unauthenticated');
        });
      }, 1500);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') return <FullPageLoader />;
  if (state === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;
    const awaitingCallback = hasAuthCallbackInUrl();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState(session ? 'authenticated' : 'unauthenticated');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setState('authenticated');
      } else if (!awaitingCallback) {
        setState('unauthenticated');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') return <FullPageLoader />;
  if (state === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><Suspense fallback={<FullPageLoader />}><Login /></Suspense></GuestGuard>} />
      <Route path="/forgot-password" element={<Suspense fallback={<FullPageLoader />}><ForgotPassword /></Suspense>} />
      <Route path="/reset-password" element={<Suspense fallback={<FullPageLoader />}><ResetPassword /></Suspense>} />

      <Route path="/" element={<AuthGuard><MainLayout /></AuthGuard>}>
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route element={<ConciergeDailyLogsShell fallback={<PageLoader />} />}>
          <Route path="daily-logs" element={null} />
          <Route path="reports" element={null} />
        </Route>
        <Route path="tickets" element={<Suspense fallback={<PageLoader />}><Tickets /></Suspense>} />
        <Route path="tickets/new" element={<Suspense fallback={<PageLoader />}><NewTicket /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
