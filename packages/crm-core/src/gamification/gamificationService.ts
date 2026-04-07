import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────────────────────

export interface UserXP {
  id: string;
  user_id: string;
  org_id: string;
  total_xp: number;
  level: number;
  level_name: string;
  streak_days: number;
  streak_start: string | null;
  last_active_date: string | null;
  daily_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  calls_today: number;
  emails_today: number;
  tasks_completed_today: number;
  deals_closed_today: number;
  daily_target_calls: number;
  daily_target_emails: number;
  daily_target_tasks: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  criteria_type: string;
  criteria_threshold: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  sort_order: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  notified: boolean;
  achievement?: Achievement;
}

export interface XPEvent {
  id: string;
  user_id: string;
  action: string;
  xp_amount: number;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  total_xp: number;
  period_xp: number;
  level: number;
  level_name: string;
  streak_days: number;
  rank: number;
}

export interface WinFeedItem {
  id: string;
  org_id: string;
  user_id: string;
  win_type: string;
  title: string;
  description: string | null;
  value: number | null;
  entity_type: string | null;
  entity_id: string | null;
  reactions: Record<string, string[]>;
  created_at: string;
  user?: { full_name: string; email: string; avatar_url: string | null };
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  metric: string;
  target: number;
  xp_reward: number;
  period: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  my_progress?: number;
  my_completed?: boolean;
}

export type XPAction =
  | 'call_logged' | 'email_sent' | 'task_completed' | 'deal_closed' | 'deal_won'
  | 'lead_created' | 'note_logged' | 'meeting_scheduled' | 'stage_advanced'
  | 'streak_bonus' | 'achievement_earned' | 'challenge_completed' | 'perfect_day';

// ── Constants ───────────────────────────────────────────────────────────────

export const XP_VALUES: Record<XPAction, number> = {
  call_logged: 10,
  email_sent: 5,
  task_completed: 8,
  deal_closed: 100,
  deal_won: 150,
  lead_created: 5,
  note_logged: 3,
  meeting_scheduled: 15,
  stage_advanced: 12,
  streak_bonus: 25,
  achievement_earned: 0,
  challenge_completed: 0,
  perfect_day: 50,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Rookie', minXP: 0 },
  { level: 3, name: 'Closer', minXP: 400 },
  { level: 5, name: 'Pro', minXP: 2400 },
  { level: 7, name: 'Veteran', minXP: 4800 },
  { level: 10, name: 'Champion', minXP: 9900 },
  { level: 15, name: 'Master', minXP: 22400 },
  { level: 20, name: 'Elite', minXP: 39900 },
  { level: 25, name: 'Legend', minXP: 62400 },
] as const;

// ── Service ─────────────────────────────────────────────────────────────────

export class GamificationService {
  constructor(private supabase: SupabaseClient) {}

  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabase.auth.getUser();
    return data?.user?.id ?? null;
  }

  async getMyXP(orgId: string): Promise<UserXP | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await this.supabase
        .from('crm_user_xp')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (error) {
        console.error('Failed to get user XP:', error);
        return null;
      }

      return data as UserXP | null;
    } catch (err) {
      console.error('Get user XP error:', err);
      return null;
    }
  }

  async awardXP(
    orgId: string,
    action: XPAction,
    entityType?: string,
    entityId?: string,
    description?: string,
  ): Promise<{
    total_xp: number;
    xp_earned: number;
    level: number;
    level_name: string;
    leveled_up: boolean;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('Not authenticated');
      }

      const xpAmount = XP_VALUES[action];

      const { data, error } = await this.supabase.rpc('crm_award_xp', {
        p_user_id: userId,
        p_org_id: orgId,
        p_action: action,
        p_xp_amount: xpAmount,
        p_entity_type: entityType ?? null,
        p_entity_id: entityId ?? null,
        p_description: description ?? null,
      });

      if (error) {
        console.error('Failed to award XP:', error);
        throw new Error(`Award XP failed: ${error.message}`);
      }

      return data as {
        total_xp: number;
        xp_earned: number;
        level: number;
        level_name: string;
        leveled_up: boolean;
      };
    } catch (err) {
      console.error('Award XP error:', err);
      throw err;
    }
  }

  async incrementDailyCounter(
    orgId: string,
    counter: 'calls_today' | 'emails_today' | 'tasks_completed_today' | 'deals_closed_today',
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      const { data: existing } = await this.supabase
        .from('crm_user_xp')
        .select('id, ' + counter)
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (!existing) return;

      const row = existing as unknown as Record<string, unknown>;
      const currentValue = (typeof row[counter] === 'number' ? row[counter] : 0) as number;

      const { error } = await this.supabase
        .from('crm_user_xp')
        .update({ [counter]: currentValue + 1 })
        .eq('id', row.id as string);

      if (error) {
        console.error('Failed to increment daily counter:', error);
      }
    } catch (err) {
      console.error('Increment daily counter error:', err);
    }
  }

  async updateStreak(
    orgId: string,
  ): Promise<{ streak_days: number; streak_extended: boolean }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return { streak_days: 0, streak_extended: false };

      const { data: xpRecord, error } = await this.supabase
        .from('crm_user_xp')
        .select('id, streak_days, streak_start, last_active_date')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (error || !xpRecord) {
        console.error('Failed to get XP record for streak:', error);
        return { streak_days: 0, streak_extended: false };
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActive = xpRecord.last_active_date;

      if (lastActive === today) {
        return { streak_days: xpRecord.streak_days, streak_extended: false };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak: number;
      let streakStart: string;

      if (lastActive === yesterdayStr) {
        newStreak = xpRecord.streak_days + 1;
        streakStart = xpRecord.streak_start ?? today;
      } else {
        newStreak = 1;
        streakStart = today;
      }

      const { error: updateError } = await this.supabase
        .from('crm_user_xp')
        .update({
          streak_days: newStreak,
          streak_start: streakStart,
          last_active_date: today,
        })
        .eq('id', xpRecord.id);

      if (updateError) {
        console.error('Failed to update streak:', updateError);
      }

      return { streak_days: newStreak, streak_extended: newStreak > 1 };
    } catch (err) {
      console.error('Update streak error:', err);
      return { streak_days: 0, streak_extended: false };
    }
  }

  async getLeaderboard(
    orgId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly',
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase.rpc('crm_get_leaderboard', {
        p_org_id: orgId,
        p_period: period,
      });

      if (error) {
        console.error('Failed to get leaderboard:', error);
        return [];
      }

      return (data || []) as LeaderboardEntry[];
    } catch (err) {
      console.error('Get leaderboard error:', err);
      return [];
    }
  }

  async getAchievements(orgId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get achievements:', error);
        return [];
      }

      return (data || []) as Achievement[];
    } catch (err) {
      console.error('Get achievements error:', err);
      return [];
    }
  }

  async getMyAchievements(orgId: string): Promise<UserAchievement[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await this.supabase
        .from('crm_user_achievements')
        .select('*, achievement:crm_achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Failed to get user achievements:', error);
        return [];
      }

      return (data || []) as UserAchievement[];
    } catch (err) {
      console.error('Get user achievements error:', err);
      return [];
    }
  }

  async checkAchievements(orgId: string): Promise<UserAchievement[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const [xpRecord, allAchievements, earnedAchievements, xpEventCounts] =
        await Promise.all([
          this.supabase
            .from('crm_user_xp')
            .select('*')
            .eq('user_id', userId)
            .eq('org_id', orgId)
            .maybeSingle(),
          this.supabase
            .from('crm_achievements')
            .select('*')
            .eq('is_active', true),
          this.supabase
            .from('crm_user_achievements')
            .select('achievement_id')
            .eq('user_id', userId),
          this.supabase
            .from('crm_xp_events')
            .select('action')
            .eq('user_id', userId),
        ]);

      if (xpRecord.error || allAchievements.error || earnedAchievements.error || xpEventCounts.error) {
        console.error('Failed to fetch achievement check data');
        return [];
      }

      const stats = xpRecord.data as UserXP | null;
      if (!stats) return [];

      const earnedIds = new Set(
        (earnedAchievements.data || []).map((e: { achievement_id: string }) => e.achievement_id),
      );

      const actionCounts: Record<string, number> = {};
      for (const event of xpEventCounts.data || []) {
        const a = (event as { action: string }).action;
        actionCounts[a] = (actionCounts[a] || 0) + 1;
      }

      const achievements = (allAchievements.data || []) as Achievement[];
      const newlyEarned: UserAchievement[] = [];

      for (const ach of achievements) {
        if (earnedIds.has(ach.id)) continue;

        let currentValue = 0;

        switch (ach.criteria_type) {
          case 'total_xp':
            currentValue = stats.total_xp;
            break;
          case 'level':
            currentValue = stats.level;
            break;
          case 'streak_days':
            currentValue = stats.streak_days;
            break;
          case 'calls_total':
            currentValue = actionCounts['call_logged'] || 0;
            break;
          case 'emails_total':
            currentValue = actionCounts['email_sent'] || 0;
            break;
          case 'tasks_total':
            currentValue = actionCounts['task_completed'] || 0;
            break;
          case 'deals_closed':
            currentValue = actionCounts['deal_closed'] || 0;
            break;
          case 'deals_won':
            currentValue = actionCounts['deal_won'] || 0;
            break;
          case 'leads_created':
            currentValue = actionCounts['lead_created'] || 0;
            break;
          default:
            currentValue = actionCounts[ach.criteria_type] || 0;
            break;
        }

        if (currentValue >= ach.criteria_threshold) {
          const { data: inserted, error: insertError } = await this.supabase
            .from('crm_user_achievements')
            .insert({
              user_id: userId,
              achievement_id: ach.id,
              earned_at: new Date().toISOString(),
              progress: currentValue,
              notified: false,
            })
            .select('*, achievement:crm_achievements(*)')
            .single();

          if (insertError) {
            console.error(`Failed to insert achievement ${ach.id}:`, insertError);
            continue;
          }

          if (inserted) {
            newlyEarned.push(inserted as UserAchievement);
          }
        }
      }

      return newlyEarned;
    } catch (err) {
      console.error('Check achievements error:', err);
      return [];
    }
  }

  async getXPHistory(orgId: string, limit = 50): Promise<XPEvent[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await this.supabase
        .from('crm_xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get XP history:', error);
        return [];
      }

      return (data || []) as XPEvent[];
    } catch (err) {
      console.error('Get XP history error:', err);
      return [];
    }
  }

  async getWinFeed(orgId: string, limit = 30): Promise<WinFeedItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_win_feed')
        .select('*, user:profiles!crm_win_feed_user_id_fkey(full_name, email, avatar_url)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get win feed:', error);
        return [];
      }

      return (data || []) as WinFeedItem[];
    } catch (err) {
      console.error('Get win feed error:', err);
      return [];
    }
  }

  async postWin(
    orgId: string,
    winType: string,
    title: string,
    description?: string,
    value?: number,
    entityType?: string,
    entityId?: string,
  ): Promise<WinFeedItem | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await this.supabase
        .from('crm_win_feed')
        .insert({
          org_id: orgId,
          user_id: userId,
          win_type: winType,
          title,
          description: description ?? null,
          value: value ?? null,
          entity_type: entityType ?? null,
          entity_id: entityId ?? null,
          reactions: {},
        })
        .select('*, user:profiles!crm_win_feed_user_id_fkey(full_name, email, avatar_url)')
        .single();

      if (error) {
        console.error('Failed to post win:', error);
        return null;
      }

      return data as WinFeedItem;
    } catch (err) {
      console.error('Post win error:', err);
      return null;
    }
  }

  async reactToWin(winId: string, emoji: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      const { data: win, error: fetchError } = await this.supabase
        .from('crm_win_feed')
        .select('reactions')
        .eq('id', winId)
        .single();

      if (fetchError || !win) {
        console.error('Failed to fetch win for reaction:', fetchError);
        return;
      }

      const reactions: Record<string, string[]> = (win.reactions as unknown as Record<string, string[]>) || {};
      const users = reactions[emoji] || [];

      if (users.includes(userId)) {
        reactions[emoji] = users.filter((id) => id !== userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, userId];
      }

      const { error: updateError } = await this.supabase
        .from('crm_win_feed')
        .update({ reactions })
        .eq('id', winId);

      if (updateError) {
        console.error('Failed to update reaction:', updateError);
      }
    } catch (err) {
      console.error('React to win error:', err);
    }
  }

  async getActiveChallenges(orgId: string): Promise<Challenge[]> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('crm_challenges')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });

      if (error) {
        console.error('Failed to get active challenges:', error);
        return [];
      }

      const challenges = (data || []) as Challenge[];

      if (!userId || challenges.length === 0) return challenges;

      const challengeIds = challenges.map((c) => c.id);
      const { data: entries } = await this.supabase
        .from('crm_challenge_entries')
        .select('challenge_id, progress, completed')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      if (entries) {
        const entryMap = new Map(
          (entries as { challenge_id: string; progress: number; completed: boolean }[])
            .map((e) => [e.challenge_id, e]),
        );
        for (const challenge of challenges) {
          const entry = entryMap.get(challenge.id);
          if (entry) {
            challenge.my_progress = entry.progress;
            challenge.my_completed = entry.completed;
          }
        }
      }

      return challenges;
    } catch (err) {
      console.error('Get active challenges error:', err);
      return [];
    }
  }

  async joinChallenge(challengeId: string, orgId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      const { error } = await this.supabase
        .from('crm_challenge_entries')
        .upsert(
          {
            challenge_id: challengeId,
            user_id: userId,
            org_id: orgId,
            progress: 0,
            completed: false,
          },
          { onConflict: 'challenge_id,user_id' },
        );

      if (error) {
        console.error('Failed to join challenge:', error);
      }
    } catch (err) {
      console.error('Join challenge error:', err);
    }
  }

  async updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      const { data: challenge } = await this.supabase
        .from('crm_challenges')
        .select('target, xp_reward')
        .eq('id', challengeId)
        .single();

      const completed = challenge ? progress >= challenge.target : false;

      const { error } = await this.supabase
        .from('crm_challenge_entries')
        .update({ progress, completed })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update challenge progress:', error);
      }
    } catch (err) {
      console.error('Update challenge progress error:', err);
    }
  }

  getXPForNextLevel(
    currentXP: number,
    currentLevel: number,
  ): { nextLevel: number; xpNeeded: number; xpProgress: number; progressPercent: number } {
    const nextLevel = Math.floor(Math.sqrt(currentXP / 100)) + 2;
    const xpForNext = (nextLevel - 1) ** 2 * 100;
    const xpForCurrent = (currentLevel - 1) ** 2 * 100;
    const xpProgress = currentXP - xpForCurrent;
    const xpNeeded = xpForNext - currentXP;
    const range = xpForNext - xpForCurrent;
    const progressPercent = range > 0 ? Math.min(100, Math.round((xpProgress / range) * 100)) : 100;

    return { nextLevel, xpNeeded: Math.max(0, xpNeeded), xpProgress, progressPercent };
  }

  getLevelFromXP(totalXP: number): { level: number; name: string } {
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    let name = 'Rookie';
    for (const threshold of LEVEL_THRESHOLDS) {
      if (level >= threshold.level) {
        name = threshold.name;
      } else {
        break;
      }
    }
    return { level, name };
  }
}

export function createGamificationService(supabase: SupabaseClient): GamificationService {
  return new GamificationService(supabase);
}
