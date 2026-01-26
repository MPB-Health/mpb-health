import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@mpbhealth/database';
import { secureAuthService } from '../services/secureAuthService';

interface UseSessionOptions {
  /** Check for session timeout based on user role */
  checkTimeout?: boolean;
  /** User role for timeout calculation */
  role?: string;
  /** Interval in ms to check session status (default: 60000) */
  checkInterval?: number;
}

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
  isExpired: boolean;
  refreshSession: () => Promise<void>;
  extendSession: () => Promise<void>;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    checkTimeout = false,
    role = 'member',
    checkInterval = 60000
  } = options;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsExpired(!currentSession);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsExpired(true);
    }
  }, []);

  const extendSession = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (newSession) {
        setSession(newSession);
        await secureAuthService.updateSessionActivity(
          session.user.id,
          newSession.access_token
        );
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }, [session?.user?.id]);

  // Initial session fetch
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setIsExpired(!currentSession);
      } catch (error) {
        console.error('Error getting session:', error);
        setIsExpired(true);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsExpired(!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session timeout checking
  useEffect(() => {
    if (!checkTimeout || !session?.user?.id) return;

    const checkSessionTimeout = async () => {
      const expired = await secureAuthService.checkSessionTimeout(session.user.id, role);
      if (expired) {
        setIsExpired(true);
        setSession(null);
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Set up interval
    const interval = setInterval(checkSessionTimeout, checkInterval);

    return () => clearInterval(interval);
  }, [checkTimeout, session?.user?.id, role, checkInterval]);

  return {
    session,
    loading,
    isExpired,
    refreshSession,
    extendSession,
  };
}
