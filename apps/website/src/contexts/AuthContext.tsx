import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { userRolesService, type UserRole } from '../lib/userRolesService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Role-based access
  userRoles: UserRole[];
  rolesLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAdvisor: boolean;
  isCrmUser: boolean;
  canAccessAdminPortal: boolean;
  canAccessAdvisorPortal: boolean;
  canAccessCrmPortal: boolean;
  refreshRoles: () => Promise<void>;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const initialRolesLoaded = useRef(false);

  // Fetch roles for the current user
  const fetchRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setUserRoles([]);
      setRolesLoading(false);
      initialRolesLoaded.current = false;
      return;
    }

    // Only show loading spinner on initial load, not on token refreshes.
    // Setting rolesLoading=true on refreshes causes ProtectedRoute to unmount
    // the entire page, destroying form state and making pages "close".
    if (!initialRolesLoaded.current) {
      setRolesLoading(true);
    }
    try {
      const roles = await userRolesService.getUserRoles(userId);
      setUserRoles(roles);
      initialRolesLoaded.current = true;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Refresh roles (can be called manually after role changes)
  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      userRolesService.invalidateCache(user.id);
      await fetchRoles(user.id);
    }
  }, [user?.id, fetchRoles]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setRolesLoading(false);
      return;
    }

    // Safety timeout: never stay stuck on a loading spinner.
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[AuthContext] Auth timed out after 8 s — treating as unauthenticated');
          setRolesLoading(false);
          return false;
        }
        return prev;
      });
    }, 8_000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Failed to get session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        fetchRoles(session?.user?.id);
      })
      .catch((error) => {
        console.error('Session retrieval failed:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      fetchRoles(session?.user?.id);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Roles will be fetched automatically via onAuthStateChange
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    setUserRoles([]);
    await supabase.auth.signOut();
  };

  // Role helper functions
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return userRoles.includes(role);
    },
    [userRoles]
  );

  // Computed role properties
  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = userRoles.includes('super_admin') || userRoles.includes('admin');
  const isAdvisor = userRoles.includes('super_admin') || userRoles.includes('advisor');
  const isCrmUser = userRoles.includes('super_admin') || userRoles.includes('crm_user');
  const canAccessAdminPortal = isAdmin;
  const canAccessAdvisorPortal = isAdvisor;
  const canAccessCrmPortal = isCrmUser;

  const value = {
    user,
    session,
    loading,
    userRoles,
    rolesLoading,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isAdvisor,
    isCrmUser,
    canAccessAdminPortal,
    canAccessAdvisorPortal,
    canAccessCrmPortal,
    refreshRoles,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
