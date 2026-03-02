import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface AdvisorContextType {
  // Profile
  profile: AdvisorProfile | null;
  loading: boolean;
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
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [trainingStats, setTrainingStats] = useState({
    totalModules: 0,
    completedModules: 0,
    completionPercentage: 0,
  });

  const [unreadBulletinCount, setUnreadBulletinCount] = useState(0);

  // Load profile
  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const advisorProfile = await profileService.getProfile(session.user.id);
      setProfile(advisorProfile);
    } catch (err) {
      // Ignore AbortError from Web Locks API - these are benign and occur during navigation
      if (err instanceof Error && err.name === 'AbortError') {
        console.debug('[AdvisorContext] Session check aborted (likely due to navigation)');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Load training data
  const refreshTraining = async () => {
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
  };

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
  const refreshProfile = async () => {
    setLoading(true);
    await loadProfile();
  };

  // Logout
  const logout = async () => {
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
    setProfile(null);
    // Redirect to login page within the advisor portal
    window.location.href = '/login';
  };

  // Initial load
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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

  // Subscribe to bulletins
  useEffect(() => {
    if (!profile) return;

    const channel = contentService.subscribeToBulletins(() => {
      loadBulletinCount();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return (
    <AdvisorContext.Provider
      value={{
        profile,
        loading,
        error,
        trainingModules,
        trainingProgress,
        trainingStats,
        unreadBulletinCount,
        refreshProfile,
        refreshTraining,
        logout,
      }}
    >
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
