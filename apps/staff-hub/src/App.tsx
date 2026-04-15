import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import { Loader2 } from 'lucide-react';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notes = lazy(() => import('./pages/Notes'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;

    // getUser() validates the JWT server-side, preventing 401 errors from
    // stale tokens that getSession() would silently return from localStorage.
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (cancelled) return;
      if (error || !user) {
        if (error) await supabase.auth.signOut({ scope: 'local' });
        setState('unauthenticated');
      } else {
        setState('authenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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

    // Use getUser() for consistency — getSession() can falsely report an
    // active session from a stale JWT, causing a redirect bounce.
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!cancelled) setState(!error && user ? 'authenticated' : 'unauthenticated');
    });

    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (state === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
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
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="notes" element={<Suspense fallback={<PageLoader />}><Notes /></Suspense>} />
        <Route path="tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
