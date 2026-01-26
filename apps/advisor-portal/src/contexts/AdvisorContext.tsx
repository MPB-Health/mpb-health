import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@mpbhealth/database';
import {
  profileService,
  trainingService,
  meetingService,
  contentService,
  type AdvisorProfile,
  type TrainingModule,
  type TrainingProgress,
  type AdvisorMeeting,
  type Bulletin,
} from '@mpbhealth/advisor-core';

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

  // Meetings
  upcomingMeetings: AdvisorMeeting[];
  liveMeetings: AdvisorMeeting[];

  // Bulletins
  unreadBulletinCount: number;

  // Actions
  refreshProfile: () => Promise<void>;
  refreshTraining: () => Promise<void>;
  refreshMeetings: () => Promise<void>;
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

  const [upcomingMeetings, setUpcomingMeetings] = useState<AdvisorMeeting[]>([]);
  const [liveMeetings, setLiveMeetings] = useState<AdvisorMeeting[]>([]);
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

  // Load meetings
  const refreshMeetings = async () => {
    if (!profile) return;

    try {
      const [upcoming, live] = await Promise.all([
        meetingService.getUpcomingMeetings(profile.id),
        meetingService.getLiveMeetings(),
      ]);

      setUpcomingMeetings(upcoming);
      setLiveMeetings(live);
    } catch (err) {
      console.error('Failed to load meetings:', err);
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
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Initial load
  useEffect(() => {
    loadProfile();

    // Listen for auth changes
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

  // Load data when profile is available
  useEffect(() => {
    if (profile) {
      refreshTraining();
      refreshMeetings();
      loadBulletinCount();
    }
  }, [profile?.id]);

  // Subscribe to live meetings
  useEffect(() => {
    const channel = meetingService.subscribeLiveMeetings((meetings) => {
      setLiveMeetings(meetings);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        upcomingMeetings,
        liveMeetings,
        unreadBulletinCount,
        refreshProfile,
        refreshTraining,
        refreshMeetings,
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
