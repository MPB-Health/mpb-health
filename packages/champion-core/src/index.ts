// ============================================================================
// Champion Core — Shared business logic for the Champion Advisor OS
// ============================================================================

// Priority OS
export { PriorityService, priorityService } from './priority/PriorityService';
export type {
  PriorityLane,
  PriorityItem,
  PriorityItemWithDetails,
  LeadSummary,
  ContactSummary,
  ScoringRule,
  ScoringTriggerType,
  AutoRule,
  PowerListItem,
  CreateLaneInput,
  UpdateLaneInput,
  AddToLaneInput,
  MoveItemInput,
  SnoozeItemInput,
  CreateScoringRuleInput,
} from './priority/types';

// Engagement Inbox
export {
  ConversationService,
  conversationService,
  TemplateService,
  templateService,
  SequenceService,
  sequenceService,
} from './engagement';
export type {
  Conversation,
  ConversationWithLead,
  Message,
  MessageStatus,
  MessageTemplate,
  TemplateVariable,
  Sequence,
  SequenceWithSteps,
  SequenceStep,
  SequenceEnrollment,
  SequenceTriggerType,
  SequenceStatus,
  StepActionType,
  StepConditionType,
  EnrollmentStatus,
  InboxSummary,
  SendMessageInput,
  CreateTemplateInput,
  CreateSequenceInput,
  CreateStepInput,
} from './engagement';

// Compliance & AI
export {
  ComplianceService,
  complianceService,
  AIService,
  aiService,
} from './compliance';
export type {
  ComplianceDocument,
  QuizQuestion,
  ComplianceAcknowledgment,
  ComplianceAcknowledgmentWithDocument,
  ComplianceViolation,
  UserComplianceStatus,
  OrgComplianceSummary,
  AISuggestion,
  SuggestionType,
  AIScoringFactor,
  AuditLog,
  AuditLogDetailed,
  CreateDocumentInput,
  CompleteAcknowledgmentInput,
  CreateViolationInput,
  MessageAssistRequest,
  MessageAssistResponse,
} from './compliance';

// Billing & Subscriptions
export {
  BillingService,
  billingService,
  UsageService,
  usageService,
} from './billing';
export type {
  PlanTier,
  BillingCycle,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethodType,
  SubscriptionPlan,
  OrganizationSubscription,
  SubscriptionWithPlan,
  UsageRecord,
  UsageWithLimit,
  Invoice,
  InvoiceLineItem,
  PaymentMethod,
  BillingAddress,
  BillingEvent,
  BillingSummary,
  UsageSummary,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  AddPaymentMethodInput,
  UsageMetric,
} from './billing';

// Settings & Admin
export {
  SettingsService,
  settingsService,
  IntegrationService,
  integrationService,
  AVAILABLE_INTEGRATIONS,
} from './settings';
export type {
  OrganizationSettings,
  BusinessHours,
  BusinessAddress,
  UpdateOrgSettingsInput,
  UserPreferences,
  UpdateUserPreferencesInput,
  NotificationSettings,
  UpdateNotificationSettingsInput,
  IntegrationConfig,
  IntegrationType,
  SyncDirection,
  ApiKey,
  CreateApiKeyInput,
  OrgMember,
  OrganizationInvitation,
  InvitationStatus,
  CreateInvitationInput,
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from './settings';

// Analytics & Reporting
export {
  AnalyticsService,
  analyticsService,
  ReportService,
  reportService,
  REPORT_TEMPLATES,
} from './analytics';
export type {
  MetricType,
  TimeGranularity,
  ReportStatus,
  ReportType,
  WidgetType,
  ChartType,
  MetricSnapshot,
  MetricDataPoint,
  PerformanceGoal,
  CreateGoalInput,
  ReportConfig,
  SavedReport,
  CreateReportInput,
  ReportRecipient,
  ReportSchedule,
  CreateScheduleInput,
  ReportRun,
  WidgetConfig,
  DashboardWidget,
  CreateWidgetInput,
  UpdateWidgetInput,
  LeaderboardEntry,
  LeaderboardUser,
  KPIMetric,
  AnalyticsSummary,
  DateRangeParams,
} from './analytics';

// Activity & Notifications
export {
  ActivityService,
  activityService,
  NotificationService,
  notificationService,
  NotificationEventsService,
  notificationEventsService,
  ACTIVITY_CONFIG,
} from './activity';
export type {
  ActivityType,
  NotificationPriority,
  NotificationChannel,
  NotificationCategory,
  Activity,
  ActivityWithActor,
  LogActivityInput,
  ActivityFeedItem,
  ActivityFeedParams,
  Notification,
  CreateNotificationInput,
  NotificationSummary,
  NotificationPreferencesOverride,
  UpdatePreferencesOverrideInput,
  ActivitySubscription,
  NotificationEvent,
  NotificationEventType,
  NotificationEventsListOptions,
} from './activity';

// Search & Command Palette
export {
  searchService,
  SEARCH_ENTITY_CONFIG,
} from './search';
export type {
  SearchEntityType,
  QuickActionType,
  QuickActionCategory,
  SearchResult,
  SearchResponse,
  RecentSearch,
  SavedSearch,
  SavedSearchInput,
  QuickAction,
  GlobalSearchParams,
  SearchAnalyticsInput,
  CommandPaletteState,
  KeyboardShortcut,
  ShortcutGroup,
} from './search';

// Automation Rules Engine
export {
  AutomationService,
  automationService,
  TRIGGER_CONFIGS,
  ACTION_CONFIGS,
} from './automation';
export type {
  AutomationTriggerType,
  AutomationActionType,
  ConditionOperator,
  GroupOperator,
  ExecutionStatus,
  RunStatus,
  AutomationRule,
  AutomationRuleWithDetails,
  AutomationCondition,
  AutomationAction,
  AutomationTemplate,
  ExecutionLog,
  ExecutionLogWithLead,
  AutomationRun,
  AutomationStats,
  CreateRuleInput,
  UpdateRuleInput,
  CreateConditionInput,
  CreateActionInput,
  CreateTemplateInput as CreateAutomationTemplateInput,
  GetRulesParams,
  GetExecutionHistoryParams,
  GetTemplatesParams,
  TriggerConfig,
  TriggerField,
  ActionConfig,
  ActionField,
} from './automation';

// Achievements & Gamification
export {
  AchievementService,
  achievementService,
  ACHIEVEMENT_DEFINITIONS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByTier,
  getTierColor,
} from './achievements';
export type {
  AchievementCategory,
  AchievementTier,
  AchievementDefinition,
  AchievementRequirement,
  UserAchievement,
  UserAchievementWithDetails,
  AchievementProgress,
} from './achievements';
