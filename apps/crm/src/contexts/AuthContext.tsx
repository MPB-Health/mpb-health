import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, SUPABASE_AUTH_STORAGE_KEY } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const validatedRef = useRef(false);

  const clearSession = useCallback(() => {
    setSession(null);
    setUser(null);
    try {
      localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      localStorage.removeItem('mpb-auth-token');
    } catch (_) { /* noop */ }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Validate the session server-side with getUser() instead of trusting
    // the cached session from getSession(). getSession() returns stale
    // tokens from localStorage that may have been revoked, causing a
    // cascade of 401s before onAuthStateChange catches up.
    async function init() {
      try {
        const { data: { session: cached } } = await supabase.auth.getSession();

        if (!cached) {
          if (!cancelled) { clearSession(); }
          return;
        }

        // Server-side validation — catches revoked / expired tokens
        const { data: { user: verified }, error: verifyError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (verifyError || !verified) {
          console.warn('[Auth] Stored session failed server validation, signing out:', verifyError?.message);
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          clearSession();
        } else {
          setSession(cached);
          setUser(verified);
        }
      } catch (err) {
        console.error('[Auth] Session init failed:', err);
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) {
          validatedRef.current = true;
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // While init() is running, ignore INITIAL_SESSION with a stale cached
      // session — init validates server-side before trusting it. Once init
      // finishes (validatedRef flips to true), handle all events normally
      // (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc.).
      if (!validatedRef.current && newSession) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Sign out API error (session cleared locally):', e);
    }
    // Safety net: forcibly remove persisted session from storage
    try {
      localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      localStorage.removeItem('mpb-auth-token');
    } catch (_) { /* storage may not be available */ }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
