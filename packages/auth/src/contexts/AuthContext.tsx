import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@mpbhealth/database';
import { userRolesService, type UserRole } from '../services/userRolesService';

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
  canAccessAdminPortal: boolean;
  canAccessAdvisorPortal: boolean;
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

  // Fetch roles for the current user
  const fetchRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setUserRoles([]);
      setRolesLoading(false);
      return;
    }

    setRolesLoading(true);
    try {
      const roles = await userRolesService.getUserRoles(userId);
      setUserRoles(roles);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Fetch roles after getting session
      fetchRoles(session?.user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Fetch roles on auth state change
      fetchRoles(session?.user?.id);
    });

    return () => subscription.unsubscribe();
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
  const canAccessAdminPortal = isAdmin;
  const canAccessAdvisorPortal = isAdvisor;

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    userRoles,
    rolesLoading,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isAdvisor,
    canAccessAdminPortal,
    canAccessAdvisorPortal,
    refreshRoles,
    signIn,
    signUp,
    signOut,
  }), [
    user, session, loading, userRoles, rolesLoading, hasRole,
    isSuperAdmin, isAdmin, isAdvisor, canAccessAdminPortal,
    canAccessAdvisorPortal, refreshRoles,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AuthContextType, UserRole };
