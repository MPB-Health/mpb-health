// ============================================================================
// Achievement Types — Type definitions for gamification achievements
// ============================================================================

export type AchievementCategory =
  | 'performance'
  | 'streak'
  | 'milestone'
  | 'compliance'
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'rank' | 'percentage' | 'duration';
  metric: string;
  target: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  metadata: Record<string, unknown>;
}

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: AchievementDefinition;
}

export interface AchievementProgress {
  achievement: AchievementDefinition;
  earned: boolean;
  earned_at: string | null;
  progress: number;
  target: number;
  percentage: number;
}

// ============================================================================
// Achievement Definitions
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Performance Achievements
  {
    id: 'first_place',
    name: 'First Place',
    description: 'Rank #1 on the leaderboard for a month',
    icon: 'trophy',
    category: 'performance',
    tier: 'gold',
    points: 500,
    requirement: { type: 'rank', metric: 'overall', target: 1, period: 'monthly' },
  },
  {
    id: 'top_three',
    name: 'Podium Finish',
    description: 'Rank in the top 3 on any metric',
    icon: 'medal',
    category: 'performance',
    tier: 'silver',
    points: 250,
    requirement: { type: 'rank', metric: 'overall', target: 3, period: 'monthly' },
  },
  {
    id: 'top_ten',
    name: 'Top Performer',
    description: 'Rank in the top 10 on any metric',
    icon: 'star',
    category: 'performance',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'rank', metric: 'overall', target: 10, period: 'monthly' },
  },

  // Streak Achievements
  {
    id: 'on_fire_7',
    name: 'On Fire',
    description: 'Maintain a 7-day activity streak',
    icon: 'flame',
    category: 'streak',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'streak', metric: 'daily_activity', target: 7 },
  },
  {
    id: 'on_fire_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day activity streak',
    icon: 'flame',
    category: 'streak',
    tier: 'silver',
    points: 300,
    requirement: { type: 'streak', metric: 'daily_activity', target: 30 },
  },
  {
    id: 'on_fire_90',
    name: 'Legendary',
    description: 'Maintain a 90-day activity streak',
    icon: 'flame',
    category: 'streak',
    tier: 'gold',
    points: 1000,
    requirement: { type: 'streak', metric: 'daily_activity', target: 90 },
  },

  // Milestone Achievements
  {
    id: 'leads_10',
    name: 'Getting Started',
    description: 'Convert 10 leads',
    icon: 'trending-up',
    category: 'milestone',
    tier: 'bronze',
    points: 50,
    requirement: { type: 'count', metric: 'leads_converted', target: 10, period: 'all_time' },
  },
  {
    id: 'leads_50',
    name: 'Lead Machine',
    description: 'Convert 50 leads',
    icon: 'trending-up',
    category: 'milestone',
    tier: 'silver',
    points: 200,
    requirement: { type: 'count', metric: 'leads_converted', target: 50, period: 'all_time' },
  },
  {
    id: 'leads_100',
    name: 'Lead Master',
    description: 'Convert 100 leads',
    icon: 'trending-up',
    category: 'milestone',
    tier: 'gold',
    points: 500,
    requirement: { type: 'count', metric: 'leads_converted', target: 100, period: 'all_time' },
  },
  {
    id: 'messages_100',
    name: 'Communicator',
    description: 'Send 100 messages',
    icon: 'message-square',
    category: 'milestone',
    tier: 'bronze',
    points: 50,
    requirement: { type: 'count', metric: 'messages_sent', target: 100, period: 'all_time' },
  },
  {
    id: 'messages_500',
    name: 'Chatterbox',
    description: 'Send 500 messages',
    icon: 'message-square',
    category: 'milestone',
    tier: 'silver',
    points: 200,
    requirement: { type: 'count', metric: 'messages_sent', target: 500, period: 'all_time' },
  },
  {
    id: 'tasks_50',
    name: 'Task Master',
    description: 'Complete 50 tasks',
    icon: 'check-circle',
    category: 'milestone',
    tier: 'bronze',
    points: 75,
    requirement: { type: 'count', metric: 'tasks_completed', target: 50, period: 'all_time' },
  },

  // Compliance Achievements
  {
    id: 'compliant_week',
    name: 'Compliant',
    description: 'Maintain 100% compliance for a week',
    icon: 'shield',
    category: 'compliance',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'percentage', metric: 'compliance_score', target: 100, period: 'weekly' },
  },
  {
    id: 'compliant_month',
    name: 'Compliance Champion',
    description: 'Maintain 100% compliance for a month',
    icon: 'shield-check',
    category: 'compliance',
    tier: 'silver',
    points: 300,
    requirement: { type: 'percentage', metric: 'compliance_score', target: 100, period: 'monthly' },
  },
  {
    id: 'compliant_quarter',
    name: 'Compliance Legend',
    description: 'Maintain 100% compliance for a quarter',
    icon: 'shield-check',
    category: 'compliance',
    tier: 'gold',
    points: 750,
    requirement: { type: 'percentage', metric: 'compliance_score', target: 100 },
  },

  // Special Achievements
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Most improved performance in a month',
    icon: 'star',
    category: 'special',
    tier: 'silver',
    points: 250,
    requirement: { type: 'rank', metric: 'improvement', target: 1, period: 'monthly' },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Respond to leads within 5 minutes (10 times)',
    icon: 'clock',
    category: 'special',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'count', metric: 'fast_responses', target: 10 },
  },
  {
    id: 'night_owl',
    name: 'Dedicated',
    description: 'Log activity after hours (5 times)',
    icon: 'moon',
    category: 'special',
    tier: 'bronze',
    points: 50,
    requirement: { type: 'count', metric: 'after_hours_activity', target: 5 },
  },
];

// Get achievement by ID
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

// Get achievements by tier
export function getAchievementsByTier(tier: AchievementTier): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.tier === tier);
}

// Get tier color
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return 'text-amber-600 bg-amber-100';
    case 'silver':
      return 'text-gray-500 bg-gray-100';
    case 'gold':
      return 'text-yellow-600 bg-yellow-100';
    case 'platinum':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-500 bg-gray-100';
  }
}
