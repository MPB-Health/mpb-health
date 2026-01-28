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
