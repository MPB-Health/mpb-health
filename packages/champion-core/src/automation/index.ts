// ============================================================================
// Automation Module — Rules Engine for Champion Advisor OS
// ============================================================================

export {
  AutomationService,
  automationService,
  TRIGGER_CONFIGS,
  ACTION_CONFIGS,
} from './AutomationService';

export type {
  // Trigger & Action Types
  AutomationTriggerType,
  AutomationActionType,
  ConditionOperator,
  GroupOperator,
  ExecutionStatus,
  RunStatus,

  // Core Entities
  AutomationRule,
  AutomationRuleWithDetails,
  AutomationCondition,
  AutomationAction,
  AutomationTemplate,
  ExecutionLog,
  ExecutionLogWithLead,
  AutomationRun,

  // Input Types
  CreateRuleInput,
  UpdateRuleInput,
  CreateConditionInput,
  CreateActionInput,
  CreateTemplateInput,

  // Query Params
  GetRulesParams,
  GetExecutionHistoryParams,
  GetTemplatesParams,

  // Statistics
  AutomationStats,

  // Configuration
  TriggerConfig,
  TriggerField,
  ActionConfig,
  ActionField,
} from './types';
