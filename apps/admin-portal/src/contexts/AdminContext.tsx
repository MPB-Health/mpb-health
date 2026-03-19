import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

  // Load user
  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const adminUser = await userService.getUser(session.user.id);
      setUser(adminUser);

      // Record login (fire-and-forget — must never block loading state)
      if (adminUser) {
        userService.recordLogin(adminUser.id).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  // Load metrics
  const refreshMetrics = async () => {
    try {
      const [dashboardMetrics, enrollmentStats] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        enrollmentService.getStats(),
      ]);
      setMetrics(dashboardMetrics);
      setPendingEnrollments(enrollmentStats.pending);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  // Refresh user
  const refreshUser = async () => {
    setLoading(true);
    await loadUser();
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Check permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions.includes(permission);
  };

  // Role checks
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

  // Load metrics when user is available
  useEffect(() => {
    if (user) {
      refreshMetrics();
    }
  }, [user?.id]);

  // Subscribe to enrollment updates (debounced to prevent hammering).
  // Guarded on user — subscribing before auth resolves is pointless and can
  // cause requests against an unauthenticated session.
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
  }, [user?.id]);

  return (
    <AdminContext.Provider
      value={{
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
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
