// ============================================================================
// Achievement Service — Business logic for gamification achievements
// ============================================================================

import { supabase } from '@mpbhealth/database';
import {
  UserAchievement,
  UserAchievementWithDetails,
  AchievementProgress,
  AchievementDefinition,
  ACHIEVEMENT_DEFINITIONS,
  getAchievementById,
} from './types';

export class AchievementService {
  // ============================================================================
  // User Achievements
  // ============================================================================

  async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id, user_id, achievement_id, earned_at, progress, metadata')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }

    // Map to UserAchievementWithDetails
    return (data || []).map((ua) => ({
      ...ua,
      achievement: getAchievementById(ua.achievement_id)!,
    })).filter((ua) => ua.achievement);
  }

  async awardAchievement(
    userId: string,
    achievementId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<UserAchievement | null> {
    // Check if already earned
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (existing) {
      return null; // Already earned
    }

    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      console.error('Achievement not found:', achievementId);
      return null;
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        progress: achievement.requirement.target,
        metadata,
      })
      .select('id, user_id, achievement_id, earned_at, progress, metadata')
      .single();

    if (error) {
      console.error('Failed to award achievement:', error);
      return null;
    }

    return data as any;
  }

  // ============================================================================
  // Progress Calculation
  // ============================================================================

  async getAchievementProgress(
    userId: string,
    orgId: string
  ): Promise<AchievementProgress[]> {
    // Get user's earned achievements
    const earned = await this.getUserAchievements(userId);
    const earnedIds = new Set(earned.map((e) => e.achievement_id));

    // Get user stats for progress calculation
    const stats = await this.getUserStats(userId, orgId);

    // Calculate progress for each achievement
    return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
      const isEarned = earnedIds.has(achievement.id);
      const earnedAchievement = earned.find((e) => e.achievement_id === achievement.id);
      const progress = this.calculateProgress(achievement, stats);

      return {
        achievement,
        earned: isEarned,
        earned_at: earnedAchievement?.earned_at || null,
        progress: isEarned ? achievement.requirement.target : progress,
        target: achievement.requirement.target,
        percentage: Math.min(100, Math.round((progress / achievement.requirement.target) * 100)),
      };
    });
  }

  private calculateProgress(
    achievement: AchievementDefinition,
    stats: UserStats
  ): number {
    const { metric } = achievement.requirement;

    switch (metric) {
      case 'overall':
        return stats.rank || 999;
      case 'leads_converted':
        return stats.leadsConverted;
      case 'messages_sent':
        return stats.messagesSent;
      case 'tasks_completed':
        return stats.tasksCompleted;
      case 'compliance_score':
        return stats.complianceScore;
      case 'daily_activity':
        return stats.currentStreak;
      case 'fast_responses':
        return stats.fastResponses;
      case 'after_hours_activity':
        return stats.afterHoursActivity;
      case 'improvement':
        return stats.improvementRank || 999;
      default:
        return 0;
    }
  }

  private async getUserStats(userId: string, _orgId: string): Promise<UserStats> {
    // Fetch various stats for the user
    // In a real implementation, this would aggregate from multiple tables

    try {
      // Get lead conversion count
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_advisor_id', userId)
        .eq('status', 'converted');

      // Get messages sent count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('direction', 'outbound');

      // Get tasks completed count
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'completed');

      // Get current streak (simplified - would need proper activity tracking)
      const { data: recentActivity } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      const streak = this.calculateStreak(recentActivity?.map((a) => a.created_at) || []);

      return {
        rank: null, // Would come from leaderboard
        leadsConverted: leadsCount || 0,
        messagesSent: messagesCount || 0,
        tasksCompleted: tasksCount || 0,
        complianceScore: 95, // Would come from compliance service
        currentStreak: streak,
        fastResponses: 0, // Would need response time tracking
        afterHoursActivity: 0, // Would need time-based tracking
        improvementRank: null,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        rank: null,
        leadsConverted: 0,
        messagesSent: 0,
        tasksCompleted: 0,
        complianceScore: 0,
        currentStreak: 0,
        fastResponses: 0,
        afterHoursActivity: 0,
        improvementRank: null,
      };
    }
  }

  private calculateStreak(activityDates: string[]): number {
    if (activityDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = activityDates
      .map((d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .filter((d, i, arr) => arr.indexOf(d) === i) // unique dates
      .sort((a, b) => b - a); // newest first

    const oneDay = 24 * 60 * 60 * 1000;
    let expectedDate = today.getTime();

    for (const date of dates) {
      if (date === expectedDate || date === expectedDate - oneDay) {
        streak++;
        expectedDate = date - oneDay;
      } else if (date < expectedDate - oneDay) {
        break;
      }
    }

    return streak;
  }

  // ============================================================================
  // Achievement Checking
  // ============================================================================

  async checkAndAwardAchievements(userId: string, orgId: string): Promise<UserAchievement[]> {
    const progress = await this.getAchievementProgress(userId, orgId);
    const newAchievements: UserAchievement[] = [];

    for (const p of progress) {
      if (!p.earned && p.percentage >= 100) {
        // Achievement requirement met, award it
        const awarded = await this.awardAchievement(userId, p.achievement.id, {
          progress: p.progress,
          awardedAt: new Date().toISOString(),
        });
        if (awarded) {
          newAchievements.push(awarded);
        }
      }
    }

    return newAchievements;
  }

  // ============================================================================
  // Leaderboard Integration
  // ============================================================================

  async getTotalPoints(userId: string): Promise<number> {
    const achievements = await this.getUserAchievements(userId);
    return achievements.reduce((total, ua) => total + (ua.achievement?.points || 0), 0);
  }

  async getAchievementLeaderboard(
    orgId: string,
    limit: number = 10
  ): Promise<{ userId: string; totalPoints: number; achievementCount: number }[]> {
    // This would be better done with a database function
    const { data, error } = await supabase
      .from('user_achievements')
      .select('user_id')
      .order('earned_at', { ascending: false });

    if (error || !data) return [];

    // Group by user and calculate points
    const userPoints: Record<string, { points: number; count: number }> = {};

    for (const ua of data) {
      const achievement = getAchievementById(ua.user_id);
      if (!userPoints[ua.user_id]) {
        userPoints[ua.user_id] = { points: 0, count: 0 };
      }
      userPoints[ua.user_id].points += achievement?.points || 0;
      userPoints[ua.user_id].count++;
    }

    return Object.entries(userPoints)
      .map(([userId, { points, count }]) => ({
        userId,
        totalPoints: points,
        achievementCount: count,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }
}

// ============================================================================
// Types
// ============================================================================

interface UserStats {
  rank: number | null;
  leadsConverted: number;
  messagesSent: number;
  tasksCompleted: number;
  complianceScore: number;
  currentStreak: number;
  fastResponses: number;
  afterHoursActivity: number;
  improvementRank: number | null;
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const achievementService = new AchievementService();
