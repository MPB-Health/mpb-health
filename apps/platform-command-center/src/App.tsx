import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { accounts, isAccountsConfigured } from './lib/accountsClient';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Organizations = lazy(() => import('./pages/Organizations'));
const OrganizationDetail = lazy(() => import('./pages/OrganizationDetail'));
const AppsPage = lazy(() => import('./pages/AppsPage'));
const LicensesPage = lazy(() => import('./pages/LicensesPage'));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;

    accounts.auth.getUser().then(async ({ data: { user }, error }) => {
      if (cancelled) return;
      if (error || !user) {
        if (error) await accounts.auth.signOut({ scope: 'local' });
        setState('unauthenticated');
      } else {
        setState('authenticated');
      }
    });

    const {
      data: { subscription },
    } = accounts.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;
    accounts.auth.getUser().then(({ data: { user }, error }) => {
      if (!cancelled) setState(!error && user ? 'authenticated' : 'unauthenticated');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (state === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ConfigBanner() {
  if (isAccountsConfigured) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
      Missing <code>VITE_ARYX_ACCOUNTS_ANON_KEY</code>. Copy{' '}
      <code>.env.example</code> to <code>.env.local</code> and set the Accounts anon key.
    </div>
  );
}

export default function App() {
  return (
    <>
      <ConfigBanner />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <Login />
            </GuestGuard>
          }
        />
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="organizations"
            element={
              <Suspense fallback={<PageLoader />}>
                <Organizations />
              </Suspense>
            }
          />
          <Route
            path="organizations/:orgId"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrganizationDetail />
              </Suspense>
            }
          />
          <Route
            path="apps"
            element={
              <Suspense fallback={<PageLoader />}>
                <AppsPage />
              </Suspense>
            }
          />
          <Route
            path="licenses"
            element={
              <Suspense fallback={<PageLoader />}>
                <LicensesPage />
              </Suspense>
            }
          />
          <Route
            path="invitations"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvitationsPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
