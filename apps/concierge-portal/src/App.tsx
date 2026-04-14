import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';

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
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (state === 'loading') return <FullPageLoader />;
  if (state === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session ? 'authenticated' : 'unauthenticated');
    });
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
        <Route path="tickets" element={<Suspense fallback={<PageLoader />}><Tickets /></Suspense>} />
        <Route path="tickets/new" element={<Suspense fallback={<PageLoader />}><NewTicket /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
