// ============================================================================
// @mpbhealth/database - Database Client & Types Package
// ============================================================================

// Supabase client
export {
  supabase,
  supabaseUrl,
  getSupabase,
  isSupabaseConfigured,
  checkSupabaseHealth,
  invalidateHealthCheck,
} from './client';

// Types - Database
export type {
  BlogAuthor,
  BlogArticle,
  BlogArticleWithAuthor,
  BlogCategory,
  ResourceType,
  TargetAudience,
  SortOption,
  ResourceTopic,
  Resource,
  ResourceFilters,
  HealthcarePlanCategory,
  PlanCategoryProfile,
  PlanCategoryFeature,
  HealthcarePlanCategoryWithDetails,
  CmsEvent,
  Profile,
  UserSession,
} from './types/database';

// Types - Member
export type {
  Member,
  MemberAddress,
  EnrollmentStatus,
  MemberDependent,
  DependentRelationship,
  MemberDocument,
  MemberNote,
  MemberActivity,
} from './types/member';

// Types - Leads/CRM
export type {
  Lead,
  LeadSource,
  LeadStatus,
  PipelineStage,
  LeadPriority,
  SyncStatus,
  LeadActivity,
  ActivityType,
  LeadTask,
  TaskStatus,
  LeadNote,
  LeadComment,
  LeadAttachment,
  PipelineMetrics,
  LeadFilters,
} from './types/leads';

// Types - Advisor
export type {
  Advisor,
  OnboardingStatus,
  TrainingModule,
  DifficultyLevel,
  TrainingProgress,
  TrainingStatus,
  Certification,
  AdvisorMeeting,
  MeetingType,
  MeetingStatus,
  MeetingAttendee,
  AttendeeRole,
  AttendanceStatus,
  Playbook,
  PlaybookCategory,
  FormSubmission,
  FormSubmissionStatus,
  Bulletin,
  BulletinType,
  BulletinPriority,
  BulletinRead,
  AdvisorStats,
} from './types/advisor';

// Hooks
export {
  useSupabaseQuery,
  usePaginatedQuery,
} from './hooks/useSupabaseQuery';

export {
  useRealtimeSubscription,
  useMultiTableSubscription,
  usePresence,
} from './hooks/useRealtimeSubscription';
