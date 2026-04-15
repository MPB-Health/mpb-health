import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import { isTimeoutError, withTimeout } from '@mpbhealth/utils';
import {
  userService,
  analyticsService,
  enrollmentService,
  type AdminUser,
  type DashboardMetrics,
} from '@mpbhealth/admin-core';

interface AdminContextType {
  // Auth
  user: AdminUser | null;
  loading: boolean;
  error: string | null;

  // Metrics
  metrics: DashboardMetrics | null;
  pendingEnrollments: number;

  // Actions
  refreshUser: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  logout: () => Promise<void>;

  // Permissions
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_USER_FETCH_MS = 20_000;
const ADMIN_METRICS_FETCH_MS = 25_000;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

  const loadUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Server-side validation: getSession() can return stale/expired JWTs from
      // localStorage. Validate with getUser() before making data queries to
      // avoid 401 errors from expired tokens.
      const { data: { user: verified }, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !verified) {
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setLoading(false);
        return;
      }

      let adminUser: AdminUser | null;
      try {
        adminUser = await withTimeout(
          userService.getUser(verified.id),
          ADMIN_USER_FETCH_MS,
          'admin_user_profile'
        );
      } catch (e) {
        if (isTimeoutError(e)) {
          console.error('[AdminContext] User profile fetch timed out');
          setError('Loading your profile timed out. Try refreshing the page.');
        } else {
          throw e;
        }
        setUser(null);
        return;
      }
      setUser(adminUser);
      setError(null);

      if (adminUser) {
        userService.recordLogin(adminUser.id).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      const [dashboardMetrics, enrollmentStats] = await withTimeout(
        Promise.all([
          analyticsService.getDashboardMetrics(),
          enrollmentService.getStats(),
        ]),
        ADMIN_METRICS_FETCH_MS,
        'admin_dashboard_metrics'
      );
      setMetrics(dashboardMetrics);
      setPendingEnrollments(enrollmentStats.pending);
    } catch (err) {
      if (isTimeoutError(err)) {
        console.error('[AdminContext] Metrics fetch timed out');
      } else {
        console.error('Failed to load metrics:', err);
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions.includes(permission);
  }, [user]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Initial load — onAuthStateChange handles INITIAL_SESSION + SIGNED_IN
  // to avoid the race condition of calling loadUser() twice simultaneously.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Safety timeout: if auth hasn't resolved in 8 s, force loading=false
    // so the app never gets permanently stuck on a spinner.
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[AdminContext] Auth timed out after 8 s — treating as unauthenticated');
          return false;
        }
        return prev;
      });
    }, 8_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      refreshMetrics();
    }
  }, [user?.id, refreshMetrics]);

  const metricsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user) return;

    const channel = enrollmentService.subscribeToEnrollments(() => {
      if (metricsDebounceRef.current) clearTimeout(metricsDebounceRef.current);
      metricsDebounceRef.current = setTimeout(() => {
        refreshMetrics();
      }, 2000);
    });

    return () => {
      if (metricsDebounceRef.current) clearTimeout(metricsDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshMetrics]);

  const adminContextValue = useMemo<AdminContextType>(
    () => ({
      user,
      loading,
      error,
      metrics,
      pendingEnrollments,
      refreshUser,
      refreshMetrics,
      logout,
      hasPermission,
      isAdmin,
      isSuperAdmin,
    }),
    [
      user,
      loading,
      error,
      metrics,
      pendingEnrollments,
      refreshUser,
      refreshMetrics,
      logout,
      hasPermission,
      isAdmin,
      isSuperAdmin,
    ]
  );

  return <AdminContext.Provider value={adminContextValue}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
