import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import { useTenantPath } from '@mpbhealth/auth';
import { Loader2 } from 'lucide-react';
import { useConciergeAccess } from '../hooks/useConciergeAccess';

const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Tickets = lazy(() => import('../pages/Tickets'));
const NewTicket = lazy(() => import('../pages/NewTicket'));
const Profile = lazy(() => import('../pages/Profile'));
const ManagementCenter = lazy(() => import('../pages/ManagementCenter'));
const MainLayout = lazy(() => import('../layouts/MainLayout'));
const ConciergeDailyLogsShell = lazy(() => import('../layouts/ConciergeDailyLogsShell'));

export function PageLoader() {
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

export function FullPageLoader() {
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

export function AuthGuard({ children }: { children: ReactNode }) {
  const toPath = useTenantPath();
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
  if (state === 'unauthenticated') return <Navigate to={toPath('/login')} replace />;
  return <>{children}</>;
}

/**
 * Restricts a route to concierge managers (super_admin, admin, or an explicit
 * is_manager grant). Non-managers are redirected to the portal home. This is a
 * UX guard only — RLS and the edge function enforce the real boundary.
 */
export function ManagerGuard({ children }: { children: ReactNode }) {
  const toPath = useTenantPath();
  const { loading, isManager } = useConciergeAccess();
  if (loading) return <FullPageLoader />;
  if (!isManager) return <Navigate to={toPath('/')} replace />;
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const toPath = useTenantPath();
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
  if (state === 'authenticated') return <Navigate to={toPath('/')} replace />;
  return <>{children}</>;
}

export function authRouteElements(nested = false) {
  const p = (segment: string) => (nested ? segment : `/${segment}`);

  return (
    <>
      <Route
        path={p('login')}
        element={
          <GuestGuard>
            <Suspense fallback={<FullPageLoader />}>
              <Login />
            </Suspense>
          </GuestGuard>
        }
      />
      <Route
        path={p('forgot-password')}
        element={
          <Suspense fallback={<FullPageLoader />}>
            <ForgotPassword />
          </Suspense>
        }
      />
      <Route
        path={p('reset-password')}
        element={
          <Suspense fallback={<FullPageLoader />}>
            <ResetPassword />
          </Suspense>
        }
      />
    </>
  );
}

export function appRouteElements() {
  return (
    <>
      <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
      <Route element={<Suspense fallback={<PageLoader />}><ConciergeDailyLogsShell fallback={<PageLoader />} /></Suspense>}>
        <Route path="daily-logs" element={null} />
        <Route path="reports" element={null} />
      </Route>
      <Route path="tickets" element={<Suspense fallback={<PageLoader />}><Tickets /></Suspense>} />
      <Route path="tickets/new" element={<Suspense fallback={<PageLoader />}><NewTicket /></Suspense>} />
      <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
      <Route
        path="management"
        element={
          <Suspense fallback={<PageLoader />}>
            <ManagerGuard>
              <ManagementCenter />
            </ManagerGuard>
          </Suspense>
        }
      />
    </>
  );
}

export { MainLayout, ConciergeDailyLogsShell };
