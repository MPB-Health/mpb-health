import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import {
  createGamificationService,
  XP_VALUES,
  type XPAction,
  type UserXP,
} from '@mpbhealth/crm-core/gamification';
import { useCelebration } from '../components/CelebrationSystem';
import { showAchievementToast } from '../components/AchievementToast';

// ── Types ──────────────────────────────────────────────────────────────────

interface NextLevelProgress {
  nextLevel: number;
  xpNeeded: number;
  xpProgress: number;
  progressPercent: number;
}

interface StreakInfo {
  days: number;
  isActive: boolean;
  color: 'gold' | 'orange' | 'gray';
}

interface DailyCounter {
  current: number;
  target: number;
}

interface DailyProgress {
  calls: DailyCounter;
  emails: DailyCounter;
  tasks: DailyCounter;
}

export interface GamificationState {
  userXP: UserXP | null;
  loading: boolean;
  earnXP: (
    action: XPAction,
    entityType?: string,
    entityId?: string,
    description?: string,
  ) => Promise<void>;
  refreshXP: () => Promise<void>;
  nextLevelProgress: NextLevelProgress;
  streakInfo: StreakInfo;
  dailyProgress: DailyProgress;
  isPerfectDay: boolean;
}

// ── Counter mapping ────────────────────────────────────────────────────────

const ACTION_TO_COUNTER: Partial<
  Record<XPAction, 'calls_today' | 'emails_today' | 'tasks_completed_today' | 'deals_closed_today'>
> = {
  call_logged: 'calls_today',
  email_sent: 'emails_today',
  task_completed: 'tasks_completed_today',
  deal_closed: 'deals_closed_today',
  deal_won: 'deals_closed_today',
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGamification(): GamificationState {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { celebrate } = useCelebration();

  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);

  const streakCheckedRef = useRef(false);
  const wasPerfectDayRef = useRef(false);

  const gamificationService = useMemo(
    () => createGamificationService(supabase),
    [],
  );

  // ── Load XP data ────────────────────────────────────────────────────────

  const loadXP = useCallback(async () => {
    if (!activeOrgId || !user) {
      setUserXP(null);
      setLoading(false);
      return;
    }

    try {
      const data = await gamificationService.getMyXP(activeOrgId);
      setUserXP(data);
    } catch (err) {
      console.error('[useGamification] Failed to load XP:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, user, gamificationService]);

  useEffect(() => {
    streakCheckedRef.current = false;
    setLoading(true);
    loadXP();
  }, [loadXP]);

  // ── Update streak on first load of the day ──────────────────────────────

  useEffect(() => {
    if (!activeOrgId || !user || streakCheckedRef.current) return;

    streakCheckedRef.current = true;

    gamificationService.updateStreak(activeOrgId).then((result) => {
      if (result.streak_extended && result.streak_days >= 3) {
        celebrate('streak', `${result.streak_days}-day streak! Keep it up!`);
      }
      setUserXP((prev) =>
        prev ? { ...prev, streak_days: result.streak_days } : prev,
      );
    }).catch((err) => {
      console.error('[useGamification] Streak update failed:', err);
    });
  }, [activeOrgId, user, gamificationService, celebrate]);

  // ── Computed: next level progress ───────────────────────────────────────

  const nextLevelProgress = useMemo<NextLevelProgress>(() => {
    if (!userXP) {
      return { nextLevel: 2, xpNeeded: 100, xpProgress: 0, progressPercent: 0 };
    }
    return gamificationService.getXPForNextLevel(userXP.total_xp, userXP.level);
  }, [userXP, gamificationService]);

  // ── Computed: streak info ───────────────────────────────────────────────

  const streakInfo = useMemo<StreakInfo>(() => {
    const days = userXP?.streak_days ?? 0;
    const today = new Date().toISOString().split('T')[0];
    const isActive = userXP?.last_active_date === today || days > 0;
    let color: StreakInfo['color'] = 'gray';
    if (days >= 7) color = 'gold';
    else if (days >= 3) color = 'orange';

    return { days, isActive, color };
  }, [userXP]);

  // ── Computed: daily progress ────────────────────────────────────────────

  const dailyProgress = useMemo<DailyProgress>(() => ({
    calls: {
      current: userXP?.calls_today ?? 0,
      target: userXP?.daily_target_calls ?? 10,
    },
    emails: {
      current: userXP?.emails_today ?? 0,
      target: userXP?.daily_target_emails ?? 10,
    },
    tasks: {
      current: userXP?.tasks_completed_today ?? 0,
      target: userXP?.daily_target_tasks ?? 5,
    },
  }), [userXP]);

  // ── Computed: perfect day ───────────────────────────────────────────────

  const isPerfectDay = useMemo(() => {
    const { calls, emails, tasks } = dailyProgress;
    return (
      calls.current >= calls.target &&
      emails.current >= emails.target &&
      tasks.current >= tasks.target
    );
  }, [dailyProgress]);

  // ── earnXP ──────────────────────────────────────────────────────────────

  const earnXP = useCallback(
    async (
      action: XPAction,
      entityType?: string,
      entityId?: string,
      description?: string,
    ) => {
      if (!activeOrgId || !user) return;

      try {
        const result = await gamificationService.awardXP(
          activeOrgId,
          action,
          entityType,
          entityId,
          description,
        );

        if (result.leveled_up) {
          celebrate('achievement', `Level Up! You're now a ${result.level_name}`);
        }

        const counter = ACTION_TO_COUNTER[action];
        if (counter) {
          await gamificationService.incrementDailyCounter(activeOrgId, counter);
        }

        const newAchievements = await gamificationService.checkAchievements(activeOrgId);
        for (const ua of newAchievements) {
          if (ua.achievement) {
            celebrate('achievement', ua.achievement.name);
            showAchievementToast({
              name: ua.achievement.name,
              description: ua.achievement.description,
              icon: ua.achievement.icon,
              xp_reward: ua.achievement.xp_reward,
              rarity: ua.achievement.rarity,
            });
          }
        }

        const freshXP = await gamificationService.getMyXP(activeOrgId);
        if (freshXP) {
          setUserXP(freshXP);
        } else {
          setUserXP((prev) =>
            prev
              ? { ...prev, total_xp: result.total_xp, level: result.level, level_name: result.level_name }
              : prev,
          );
        }

        if (action === 'deal_closed' || action === 'deal_won') {
          const winTitle = action === 'deal_won' ? 'Deal Won!' : 'Deal Closed!';
          await gamificationService.postWin(
            activeOrgId,
            action,
            winTitle,
            description,
            XP_VALUES[action],
            entityType,
            entityId,
          );
        }

        // Perfect-day check: if daily targets are now all met and weren't before
        if (action !== 'perfect_day' && freshXP) {
          const callsMet = (freshXP.calls_today) >= (freshXP.daily_target_calls);
          const emailsMet = (freshXP.emails_today) >= (freshXP.daily_target_emails);
          const tasksMet = (freshXP.tasks_completed_today) >= (freshXP.daily_target_tasks);
          const nowPerfect = callsMet && emailsMet && tasksMet;

          if (nowPerfect && !wasPerfectDayRef.current) {
            wasPerfectDayRef.current = true;
            celebrate('achievement', 'Perfect Day! All daily targets met!');
            await gamificationService.awardXP(
              activeOrgId,
              'perfect_day',
              undefined,
              undefined,
              'All daily targets completed',
            );
            const updatedXP = await gamificationService.getMyXP(activeOrgId);
            if (updatedXP) setUserXP(updatedXP);
          }
        }
      } catch (err) {
        console.error('[useGamification] earnXP failed:', err);
      }
    },
    [activeOrgId, user, gamificationService, celebrate],
  );

  // Reset perfect-day flag when daily progress resets (new day / org switch)
  useEffect(() => {
    wasPerfectDayRef.current = isPerfectDay;
  }, [activeOrgId, isPerfectDay]);

  // ── refreshXP ───────────────────────────────────────────────────────────

  const refreshXP = useCallback(async () => {
    setLoading(true);
    await loadXP();
  }, [loadXP]);

  return {
    userXP,
    loading,
    earnXP,
    refreshXP,
    nextLevelProgress,
    streakInfo,
    dailyProgress,
    isPerfectDay,
  };
}
