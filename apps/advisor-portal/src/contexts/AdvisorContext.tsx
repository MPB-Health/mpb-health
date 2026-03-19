import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import {
  profileService,
  trainingService,
  contentService,
  type AdvisorProfile,
  type TrainingModule,
  type TrainingProgress,
  type Bulletin,
} from '@mpbhealth/advisor-core';
import { secureAuthService } from '@mpbhealth/auth';
import { clearNavCache } from '../utils/navCache';

interface AdvisorContextType {
  // Profile
  profile: AdvisorProfile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;

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
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [trainingStats, setTrainingStats] = useState({
    totalModules: 0,
    completedModules: 0,
    completionPercentage: 0,
  });

  const [unreadBulletinCount, setUnreadBulletinCount] = useState(0);

  const buildSessionFallbackProfile = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string }): AdvisorProfile => {
    const fullName = String(sessionUser.user_metadata?.full_name || '').trim();
    const firstFromFull = fullName ? fullName.split(' ')[0] : '';
    const lastFromFull = fullName && fullName.includes(' ')
      ? fullName.slice(fullName.indexOf(' ') + 1).trim()
      : '';
    const firstName = String(sessionUser.user_metadata?.first_name || firstFromFull || 'Advisor').trim();
    const lastName = String(sessionUser.user_metadata?.last_name || lastFromFull || '').trim();
    const nowIso = new Date().toISOString();

    return {
      id: sessionUser.id,
      user_id: sessionUser.id,
      org_id: '',
      first_name: firstName,
      last_name: lastName,
      email: sessionUser.email || '',
      phone: null,
      specialization: 'Health Share',
      bio: null,
      avatar_url: null,
      agent_id: null,
      company_name: null,
      must_change_password: false,
      status: 'active',
      onboarding_completed: true,
      onboarding_completed_at: nowIso,
      created_at: sessionUser.created_at || nowIso,
      updated_at: nowIso,
    };
  };

  // Load profile (called when we have session — does not block initial shell)
  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      const advisorProfile = await profileService.getProfile(session.user.id);
      if (advisorProfile) {
        setProfile(advisorProfile);
      } else {
        console.warn('[AdvisorContext] advisor_profiles row missing; using session fallback profile');
        setProfile(buildSessionFallbackProfile(session.user));
      }
    } catch (err) {
      // Ignore AbortError from Web Locks API - these are benign and occur during navigation
      if (err instanceof Error && err.name === 'AbortError') {
        console.debug('[AdvisorContext] Session check aborted (likely due to navigation)');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

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
  }, []);

  // Handle authentication errors by refreshing session
  const handleAuthError = useCallback(async () => {
    try {
      setProfileLoading(true);
      // Try to refresh the session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }

      if (!session?.user) {
        // No valid session, redirect to login
        setProfile(null);
        window.location.href = '/login';
        return;
      }

      // Session refreshed successfully, reload profile
      await loadProfile();
    } catch (err) {
      console.error('Auth error handling failed:', err);
      // Force logout if refresh fails
      setProfile(null);
      window.location.href = '/login';
    } finally {
      setProfileLoading(false);
    }
  }, []);

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
      localStorage.removeItem('mpb-auth-token');
    } catch (_) { /* storage may not be available */ }
    clearNavCache();
    setProfile(null);
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

    // Safety timeout: if onAuthStateChange never fires (edge case with
    // corrupted local storage or stale service-worker token), force the app
    // out of the loading state so the user isn't stuck on an infinite spinner.
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[AdvisorContext] Auth timed out after 8 s — forcing load complete');
          return false;
        }
        return prev;
      });
    }, 8_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && !initialHandled.current)) {
          initialHandled.current = true;
          setLoading(false);
          if (session?.user) {
            loadProfile();
          } else {
            setProfile(null);
          }
        } else if (event === 'SIGNED_IN') {
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed — no need to reload profile
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Load data when profile is available — deferred so the initial render
  // (profile + auth check) completes first before firing secondary requests.
  useEffect(() => {
    if (!profile) return;
    // Use setTimeout(0) to yield to the browser paint before hitting Supabase
    // for non-critical data (training stats, bulletin count).
    const timer = setTimeout(() => {
      refreshTraining();
      loadBulletinCount();
    }, 0);
    return () => clearTimeout(timer);
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
    loading,
    profileLoading,
    error,
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
    loading,
    profileLoading,
    error,
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
