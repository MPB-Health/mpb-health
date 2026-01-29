// ============================================================================
// Achievements Module — Gamification achievements for Champion Advisor OS
// ============================================================================

export { AchievementService, achievementService } from './AchievementService';

export {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByTier,
  getTierColor,
} from './types';

export type {
  AchievementCategory,
  AchievementTier,
  AchievementDefinition,
  AchievementRequirement,
  UserAchievement,
  UserAchievementWithDetails,
  AchievementProgress,
} from './types';
