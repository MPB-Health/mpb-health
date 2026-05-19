import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_AUTH_STORAGE_KEY,
  refreshSessionOnce,
  getCachedSession,
  invalidateCachedSession,
  isSessionDead,
} from '@mpbhealth/database';
import {
  profileService,
  trainingService,
  contentService,
  isAdvisorExemptFromTrainingGate,
  type AdvisorProfile,
  type TrainingModule,
  type TrainingProgress,
  type Bulletin,
} from '@mpbhealth/advisor-core';
import { ADVISOR_TRAINING_GATE_CUTOFF_MS } from '../config/advisorTrainingGate';
import { secureAuthService } from '@mpbhealth/auth';
import { clearNavCache } from '../utils/navCache';
import { startEdgeFunctionWarmup, stopEdgeFunctionWarmup } from '../utils/edgeFunctionWarmup';
/**
 * Centralized session reads use `getCachedSession` from @mpbhealth/database, which has its own
 * 8s hard deadline + 1.5s in‑memory cache + concurrent-coalescing. The local helper just wraps
 * a `forceRefresh` toggle for sites that explicitly need to bypass the cache (tab wake, post-refresh).
 */
async function readSession(opts: { forceRefresh?: boolean } = {}) {
  return getCachedSession(opts);
}

interface AdvisorContextType {
  // Profile
  profile: AdvisorProfile | null;
  /** Supabase auth.users.created_at — used with training gate cutoff when profile row is new or missing. */
  sessionUserCreatedAt: string | undefined;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  hasSession: boolean;

  // Training
  trainingModules: TrainingModule[];
  trainingProgress: TrainingProgress[];
  trainingStats: {
    totalModules: number;
    completedModules: number;
    completionPercentage: number;
  };

  // Bulletins
  unreadBulletinCount: number;

  // Actions
  refreshProfile: () => Promise<void>;
  refreshTraining: () => Promise<void>;
  logout: () => Promise<void>;
  handleAuthError: () => Promise<void>;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const loadProfileGenRef = useRef(0);
  const profileRef = useRef<AdvisorProfile | null>(null);
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [sessionUserCreatedAt, setSessionUserCreatedAt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [trainingStats, setTrainingStats] = useState({
    totalModules: 0,
    completedModules: 0,
    completionPercentage: 0,
  });

  const [unreadBulletinCount, setUnreadBulletinCount] = useState(0);

  profileRef.current = profile;

  const buildSessionFallbackProfile = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string }): AdvisorProfile => {
    const fullName = String(sessionUser.user_metadata?.full_name || '').trim();
    const firstFromFull = fullName ? fullName.split(' ')[0] : '';
    const lastFromFull = fullName && fullName.includes(' ')
      ? fullName.slice(fullName.indexOf(' ') + 1).trim()
      : '';
    const firstName = String(sessionUser.user_metadata?.first_name || firstFromFull || 'Advisor').trim();
    const lastName = String(sessionUser.user_metadata?.last_name || lastFromFull || '').trim();
    const nowIso = new Date().toISOString();
    const grandfatherTraining = isAdvisorExemptFromTrainingGate(
      { training_completed: false, created_at: null },
      ADVISOR_TRAINING_GATE_CUTOFF_MS,
      sessionUser.created_at
    );

    return {
      id: sessionUser.id,
      user_id: sessionUser.id,
      org_id: '',
      first_name: firstName,
      last_name: lastName,
      email: sessionUser.email || '',
      phone: null,
      specialization: 'Health Share',
      avatar_url: null,
      agent_id: null,
      company_name: null,
      must_change_password: false,
      status: 'active',
      training_completed: grandfatherTraining,
      training_completed_at: grandfatherTraining ? (sessionUser.created_at || nowIso) : null,
      onboarding_completed: true,
      onboarding_completed_at: nowIso,
      created_at: sessionUser.created_at || nowIso,
      updated_at: nowIso,
    };
  };

  // Single-flight wrapper. Coalesces concurrent `loadProfile()` calls so
  // INITIAL_SESSION + visibility-recovery + auth-listener slow-path can't each
  // spawn parallel SELECTs that contend on the same Supabase Web Lock and
  // each blow PROFILE_DEADLINE_MS. The wrapper is set/cleared in the inner
  // body's finally, so it never leaks across calls.
  const _inflightLoadRef = useRef<Promise<void> | null>(null);

  const loadProfileInner = useCallback(async () => {
    const gen = ++loadProfileGenRef.current;
    /**
     * Body deadline. Session reads are bounded separately by `getCachedSession` (8s).
     * The advisor_profiles SELECT (+ optional self-heal upsert) typically finishes in
     * <1s; an 8s ceiling gives slow networks room while keeping us comfortably under
     * the spinner-stuck detector (10s) so a hung run is caught before the spinner
     * timer fires a second redundant warning.
     */
    const PROFILE_DEADLINE_MS = 8_000;
    /**
     * We deliberately do NOT pre-emptively call `refreshSessionOnce()` here.
     * `supabase.auth` already auto-refreshes the JWT before `INITIAL_SESSION` /
     * `SIGNED_IN` fires (its autoRefreshToken default), and a hard `refresh_token`
     * failure is latched globally by `installAuthRefreshGuard` (which sets
     * `markSessionDead` and triggers the redirect). Adding another awaited
     * refresh here just serialised 8s of avoidable latency at boot AND raced the
     * `_acquireLock` taken by the supabase client's internal auto-refresh, which
     * is what was producing the "Profile load timed out" warning.
     */
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t0 = now();
    let tAfterSession = t0;
    setProfileLoading(true);
    setError(null);
    try {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;
      try {
        const sessionRes = await readSession();
        session = sessionRes.data.session;
      } catch (e) {
        if (e instanceof Error && e.message === 'GET_SESSION_TIMEOUT') {
          if (gen !== loadProfileGenRef.current) return;
          console.debug('[AdvisorContext] getSession slow — trying refreshSessionOnce');
          const { error: refreshErr } = await refreshSessionOnce();
          if (refreshErr) {
            console.warn('[AdvisorContext] Session refresh after slow getSession failed:', refreshErr);
            setError('Could not verify your session. Check your connection or refresh the page.');
            return;
          }
          try {
            const sessionRes = await readSession({ forceRefresh: true });
            session = sessionRes.data.session;
          } catch {
            setError('Could not verify your session. Check your connection or refresh the page.');
            return;
          }
        } else {
          throw e;
        }
      }
      tAfterSession = now();
      if (gen !== loadProfileGenRef.current) return;

      if (isSessionDead()) return;

      if (!session?.user) {
        setProfile(null);
        setSessionUserCreatedAt(undefined);
        return;
      }

      setSessionUserCreatedAt(session.user.created_at);

      const runBody = async () => {
        const advisorProfile = await profileService.getProfile(session.user.id);
        if (gen !== loadProfileGenRef.current) return;

        if (advisorProfile) {
          setProfile(advisorProfile);
          return;
        }

        console.warn('[AdvisorContext] advisor_profiles row missing; attempting self-heal upsert');
        const fallback = buildSessionFallbackProfile(session.user);
        setProfile(fallback);

        const healExempt = isAdvisorExemptFromTrainingGate(
          { training_completed: false, created_at: null },
          ADVISOR_TRAINING_GATE_CUTOFF_MS,
          session.user.created_at
        );

        try {
          const healed = await profileService.ensureProfile({
            id: session.user.id,
            email: session.user.email || '',
            first_name: fallback.first_name,
            last_name: fallback.last_name,
            user_id: session.user.id,
            training_completed: healExempt,
            training_completed_at: healExempt ? new Date().toISOString() : null,
          });
          if (gen !== loadProfileGenRef.current) return;
          if (healed) {
            console.info('[AdvisorContext] Self-healed advisor_profiles row created');
            setProfile(healed);
          }
        } catch (healErr) {
          console.warn('[AdvisorContext] Self-heal upsert failed (non-blocking):', healErr);
        }
      };

      await Promise.race([
        runBody(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('PROFILE_LOAD_TIMEOUT')), PROFILE_DEADLINE_MS);
        }),
      ]);
      const tEnd = now();
      // Diagnostic: surface where the time went so future regressions are obvious
      // in the console. Stays under DEBUG threshold so it won't flood production
      // unless someone is actively investigating.
      console.debug('[AdvisorContext] loadProfile timing', {
        sessionMs: Math.round(tAfterSession - t0),
        bodyMs: Math.round(tEnd - tAfterSession),
        totalMs: Math.round(tEnd - t0),
      });
    } catch (err) {
      const tEnd = now();
      if (err instanceof Error && err.message === 'PROFILE_LOAD_TIMEOUT') {
        if (gen === loadProfileGenRef.current) {
          console.warn('[AdvisorContext] Profile load timed out — using session fallback', {
            sessionMs: Math.round(tAfterSession - t0),
            bodyMs: Math.round(tEnd - tAfterSession),
          });
          try {
            const sessionRes = await readSession();
            const s2 = sessionRes.data.session;
            if (s2?.user) {
              setProfile((prev) => prev ?? buildSessionFallbackProfile(s2.user));
              setError(
                'Your profile took too long to load. Check your connection or use Refresh — you can keep working with limited data.'
              );
            } else {
              setError('Session unavailable while loading profile.');
            }
          } catch {
            setError('Session unavailable while loading profile.');
          }
        }
        return;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        console.debug('[AdvisorContext] Session check aborted (likely due to navigation)');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      if (gen === loadProfileGenRef.current) {
        setProfileLoading(false);
      }
    }
  }, []);

  const loadProfile = useCallback(async () => {
    if (_inflightLoadRef.current) {
      return _inflightLoadRef.current;
    }
    const p = (async () => {
      try {
        await loadProfileInner();
      } finally {
        _inflightLoadRef.current = null;
      }
    })();
    _inflightLoadRef.current = p;
    return p;
  }, [loadProfileInner]);

  // Load training data
  const refreshTraining = useCallback(async () => {
    if (!profile) return;

    try {
      const [modules, progress, stats] = await Promise.all([
        trainingService.getModules(),
        trainingService.getAdvisorProgress(profile.id),
        trainingService.getTrainingStats(profile.id),
      ]);

      setTrainingModules(modules);
      setTrainingProgress(progress);
      setTrainingStats({
        totalModules: stats.totalModules,
        completedModules: stats.completedModules,
        completionPercentage: stats.completionPercentage,
      });
    } catch (err) {
      console.error('Failed to load training data:', err);
    }
  }, [profile]);

  // Load bulletin count
  const loadBulletinCount = async () => {
    if (!profile) return;

    try {
      const count = await contentService.getUnreadBulletinCount(profile.id);
      setUnreadBulletinCount(count);
    } catch (err) {
      console.error('Failed to load bulletin count:', err);
    }
  };

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    await loadProfile();
  }, [loadProfile]);

  // Handle authentication errors by refreshing session
  const handleAuthError = useCallback(async () => {
    try {
      setProfileLoading(true);
      const { data, error } = await refreshSessionOnce();
      if (error) {
        throw error;
      }

      const session = data?.session;
      if (!session?.user) {
        setProfile(null);
        setSessionUserCreatedAt(undefined);
        window.location.href = '/login';
        return;
      }

      await loadProfile();
    } catch (err) {
      if (err instanceof Error && err.message === 'REFRESH_SESSION_TIMEOUT') {
        console.warn('[AdvisorContext] Session refresh timed out — retrying profile with existing cookies');
        try {
          await loadProfile();
          return;
        } catch (inner) {
          console.error('Auth error handling failed after refresh timeout:', inner);
        }
      } else {
        console.error('Auth error handling failed:', err);
      }
      setProfile(null);
      setSessionUserCreatedAt(undefined);
      window.location.href = '/login';
    } finally {
      setProfileLoading(false);
    }
  }, [loadProfile]);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Use secure logout service for proper session cleanup and security logging
      if (profile?.user_id) {
        await secureAuthService.secureLogout(profile.user_id);
      } else {
        // Fallback to basic logout if profile is not available
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (e) {
      console.warn('Sign out API error (session cleared locally):', e);
    }
    // Safety net: forcibly remove persisted session from storage
    try {
      localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      localStorage.removeItem('mpb-auth-token');
    } catch (_) { /* storage may not be available */ }
    clearNavCache();
    setProfile(null);
    setSessionUserCreatedAt(undefined);
    // Redirect to login page within the advisor portal
    window.location.href = '/login';
  }, [profile?.user_id]);

  // Track whether the initial session has been handled to prevent duplicate loads.
  const initialHandled = useRef(false);

  // Single auth listener — handles initial session + subsequent changes.
  // Key: set loading=false as soon as we get INITIAL_SESSION so shell can render.
  // Profile loads in background — shell shows immediately with skeleton user section.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Safety timeout: if onAuthStateChange never fires (corrupted local storage,
    // stale service-worker token), force the app out of the loading state.
    // 5s is enough — getCachedSession itself is hard-capped at 8s.
    const timeout = setTimeout(() => {
      void (async () => {
        if (initialHandled.current) return;
        console.warn('[AdvisorContext] Auth listener slow (>5s) — recovering via getCachedSession()');
        try {
          const { data: { session } } = await readSession({ forceRefresh: true });
          setHasSession(!!session);
          initialHandled.current = true;
          if (session?.user) {
            await loadProfile();
          } else {
            setProfile(null);
            setSessionUserCreatedAt(undefined);
          }
        } catch (err) {
          console.warn('[AdvisorContext] Session recovery failed:', err);
          setHasSession(false);
          setProfile(null);
          setSessionUserCreatedAt(undefined);
        } finally {
          setLoading(false);
        }
      })();
    }, 5_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setHasSession(!!session);

        if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && !initialHandled.current)) {
          initialHandled.current = true;
          setLoading(false);
          if (session?.user) {
            loadProfile();
          } else {
            setProfile(null);
            setSessionUserCreatedAt(undefined);
          }
        } else if (event === 'SIGNED_IN') {
          // Supabase occasionally re-fires SIGNED_IN after TOKEN_REFRESHED or
          // when storage syncs across tabs — skip the reload if the user id is
          // unchanged. Two back-to-back SIGNED_INs for the same user was the
          // direct cause of the duplicate "Profile load timed out" pair in the
          // console (each one paid the full 8s+8s waterfall).
          const incomingUserId = session?.user?.id ?? null;
          const currentUserId = profileRef.current?.user_id ?? profileRef.current?.id ?? null;
          if (incomingUserId && currentUserId === incomingUserId) {
            return;
          }
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setSessionUserCreatedAt(undefined);
          setProfileLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed — no need to reload profile
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Last resort if `loadProfile` hangs in an edge we did not anticipate — never
   * leave shell stuck on skeleton. The threshold sits above the loadProfile
   * inner budget (session 8s + body 8s = 16s worst case before the inner
   * timeouts fire and reject) so this only triggers when the inner timeouts
   * also failed to surface — i.e. a true hang in user code, not a slow path
   * that's still about to complete.
   */
  useEffect(() => {
    if (!profileLoading) return;
    const t = globalThis.setTimeout(() => {
      if (profileRef.current) {
        console.warn(
          '[AdvisorContext] profileLoading hung past threshold — clearing spinner (profile already hydrated)',
        );
        setProfileLoading(false);
        return;
      }
      console.warn('[AdvisorContext] profileLoading stuck past threshold — forcing shell to recover');
      setProfileLoading(false);
      setError(
        (prev) =>
          prev ??
          'Your account took too long to load. Use Refresh, or sign out and back in if this continues.',
      );
    }, 20_000);
    return () => globalThis.clearTimeout(t);
  }, [profileLoading]);

  // After tab sleep / bfcache / background, Supabase + in-flight profile loads can stall.
  // Re-hydrate the auth shell only (queries are handled by QueryStaleRecovery / focusManager).
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let debounce: ReturnType<typeof setTimeout> | undefined;

    const recover = () => {
      void (async () => {
        try {
          // Bust the 1.5s session cache so we re-read what auth storage holds *now*.
          invalidateCachedSession();
          const { data: { session } } = await readSession({ forceRefresh: true });
          if (!session?.user) return;
          setHasSession(true);
          // Re-load only when signed in but profile never hydrated (stalled auth / tab discard).
          if (!profileRef.current) {
            await loadProfile();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg === 'GET_SESSION_TIMEOUT' && profileRef.current) {
            console.debug('[AdvisorContext] Tab visibility recovery: getSession slow (profile already loaded)');
            return;
          }
          console.warn('[AdvisorContext] Tab visibility recovery failed:', err);
        }
      })();
    };

    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(recover, 280);
    };

    const onPageShow = (e: PageTransitionEvent) => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(recover, e.persisted ? 0 : 280);
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      window.clearTimeout(debounce);
    };
  }, [loadProfile]);

  // Load data when profile is available — deferred so the initial render
  // (profile + auth check) completes first before firing secondary requests.
  useEffect(() => {
    if (!profile) return;
    // Use setTimeout(0) to yield to the browser paint before hitting Supabase
    // for non-critical data (training stats, bulletin count).
    const timer = setTimeout(() => {
      refreshTraining();
      loadBulletinCount();
      startEdgeFunctionWarmup();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopEdgeFunctionWarmup();
    };
  }, [profile?.id]);

  // Subscribe to bulletins — skip when must_change_password to avoid WebSocket
  // "closed before connection established" during redirect to /change-password.
  useEffect(() => {
    if (!profile || profile.must_change_password) return;

    const channel = contentService.subscribeToBulletins(() => {
      loadBulletinCount();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.must_change_password]);

  const value = useMemo<AdvisorContextType>(() => ({
    profile,
    sessionUserCreatedAt,
    loading,
    profileLoading,
    error,
    hasSession,
    trainingModules,
    trainingProgress,
    trainingStats,
    unreadBulletinCount,
    refreshProfile,
    refreshTraining,
    logout,
    handleAuthError,
  }), [
    profile,
    sessionUserCreatedAt,
    loading,
    profileLoading,
    error,
    hasSession,
    trainingModules,
    trainingProgress,
    trainingStats,
    unreadBulletinCount,
    refreshProfile,
    refreshTraining,
    logout,
    handleAuthError,
  ]);

  return (
    <AdvisorContext.Provider value={value}>
      {children}
    </AdvisorContext.Provider>
  );
}

export function useAdvisor() {
  const context = useContext(AdvisorContext);
  if (context === undefined) {
    throw new Error('useAdvisor must be used within an AdvisorProvider');
  }
  return context;
}
