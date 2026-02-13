// Plans Core — Unified plan management package
// Shared across Website, CRM, and Admin Portal

export { createPlanService } from './planService';
export type { PlanServiceInstance } from './planService';

export { createPlanPricingService } from './planPricingService';
export type { PlanPricingServiceInstance } from './planPricingService';

export { createPlanFeatureService } from './planFeatureService';
export type { PlanFeatureServiceInstance } from './planFeatureService';

export { createPlanRateEngine } from './planRateEngine';
export type { PlanRateEngineInstance } from './planRateEngine';

// Re-export all types
export type {
  Plan,
  PlanFeature,
  PlanPricing,
  PlanSharingDetails,
  PlanWithFeatures,
  PlanWithPricing,
  PlanWithDetails,
  PlanCreateInput,
  PlanUpdateInput,
  PlanFeatureCreateInput,
  PlanPricingCreateInput,
  PlanSharingDetailsInput,
  PlanFilters,
  RateEstimateInput,
  RateEstimate,
  AllPlansEstimate,
  ServiceResult,
  MemberType,
  PlanType,
} from './planTypes';

export {
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  PLAN_TYPES,
  PLAN_TYPE_LABELS,
  IUA_OPTIONS,
  AGE_BANDS,
} from './planTypes';
