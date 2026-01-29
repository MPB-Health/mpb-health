// ============================================================================
// Automation Hooks — React hooks for automation rules engine
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  automationService,
  AutomationRule,
  AutomationRuleWithDetails,
  AutomationTemplate,
  AutomationStats,
  ExecutionLogWithLead,
  AutomationTriggerType,
  AutomationActionType,
  CreateRuleInput,
  UpdateRuleInput,
  CreateConditionInput,
  CreateActionInput,
  GetRulesParams,
  GetExecutionHistoryParams,
  TRIGGER_CONFIGS,
  ACTION_CONFIGS,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// Automation Rules Hook
// ============================================================================

export function useAutomationRules(params: GetRulesParams = {}) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await automationService.getRules(orgId, params);
      setRules(data);
      setError(null);
    } catch (err) {
      console.error('[useAutomationRules] Failed to fetch:', err);
      setError('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  }, [orgId, params.trigger_type, params.is_active, params.limit, params.offset]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const activeRules = useMemo(
    () => rules.filter((r) => r.is_active),
    [rules]
  );

  const inactiveRules = useMemo(
    () => rules.filter((r) => !r.is_active),
    [rules]
  );

  return {
    rules,
    activeRules,
    inactiveRules,
    loading,
    error,
    refresh: fetchRules,
  };
}

// ============================================================================
// Single Rule Hook
// ============================================================================

export function useAutomationRule(ruleId: string | null) {
  const [rule, setRule] = useState<AutomationRuleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRule = useCallback(async () => {
    if (!ruleId) {
      setRule(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await automationService.getRuleWithDetails(ruleId);
      setRule(data);
      setError(null);
    } catch (err) {
      console.error('[useAutomationRule] Failed to fetch:', err);
      setError('Failed to load automation rule');
    } finally {
      setLoading(false);
    }
  }, [ruleId]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  return {
    rule,
    loading,
    error,
    refresh: fetchRule,
  };
}

// ============================================================================
// Automation Actions Hook
// ============================================================================

export function useAutomationActions() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new rule
  const createRule = useCallback(
    async (input: CreateRuleInput): Promise<AutomationRule | null> => {
      if (!orgId) {
        setError('No organization found');
        return null;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        const rule = await automationService.createRule(orgId, input);
        return rule;
      } catch (err) {
        console.error('[useAutomationActions] Failed to create:', err);
        setError('Failed to create automation rule');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [orgId]
  );

  // Update a rule
  const updateRule = useCallback(
    async (ruleId: string, input: UpdateRuleInput): Promise<AutomationRule | null> => {
      try {
        setIsSubmitting(true);
        setError(null);
        const rule = await automationService.updateRule(ruleId, input);
        return rule;
      } catch (err) {
        console.error('[useAutomationActions] Failed to update:', err);
        setError('Failed to update automation rule');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // Toggle rule active status
  const toggleRule = useCallback(async (ruleId: string, isActive: boolean): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.toggleRule(ruleId, isActive);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to toggle:', err);
      setError('Failed to toggle automation rule');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Delete a rule
  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.deleteRule(ruleId);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to delete:', err);
      setError('Failed to delete automation rule');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Duplicate a rule
  const duplicateRule = useCallback(
    async (ruleId: string): Promise<AutomationRule | null> => {
      if (!orgId) {
        setError('No organization found');
        return null;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        const rule = await automationService.duplicateRule(orgId, ruleId);
        return rule;
      } catch (err) {
        console.error('[useAutomationActions] Failed to duplicate:', err);
        setError('Failed to duplicate automation rule');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [orgId]
  );

  // Create rule from template
  const createFromTemplate = useCallback(
    async (templateId: string, overrides?: Partial<CreateRuleInput>): Promise<AutomationRule | null> => {
      if (!orgId) {
        setError('No organization found');
        return null;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        const rule = await automationService.createFromTemplate(orgId, templateId, overrides);
        return rule;
      } catch (err) {
        console.error('[useAutomationActions] Failed to create from template:', err);
        setError('Failed to create automation from template');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [orgId]
  );

  // Add condition
  const addCondition = useCallback(async (input: CreateConditionInput): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.addCondition(input);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to add condition:', err);
      setError('Failed to add condition');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Delete condition
  const deleteCondition = useCallback(async (conditionId: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.deleteCondition(conditionId);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to delete condition:', err);
      setError('Failed to delete condition');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Add action
  const addAction = useCallback(async (input: CreateActionInput): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.addAction(input);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to add action:', err);
      setError('Failed to add action');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Delete action
  const deleteAction = useCallback(async (actionId: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await automationService.deleteAction(actionId);
      return true;
    } catch (err) {
      console.error('[useAutomationActions] Failed to delete action:', err);
      setError('Failed to delete action');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Reorder actions
  const reorderActions = useCallback(
    async (ruleId: string, actionIds: string[]): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);
        await automationService.reorderActions(ruleId, actionIds);
        return true;
      } catch (err) {
        console.error('[useAutomationActions] Failed to reorder actions:', err);
        setError('Failed to reorder actions');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    error,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
    duplicateRule,
    createFromTemplate,
    addCondition,
    deleteCondition,
    addAction,
    deleteAction,
    reorderActions,
    clearError: () => setError(null),
  };
}

// ============================================================================
// Automation Templates Hook
// ============================================================================

export function useAutomationTemplates(options: {
  category?: string;
  popularOnly?: boolean;
} = {}) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        automationService.getTemplates({
          category: options.category,
          is_popular: options.popularOnly,
        }),
        automationService.getTemplateCategories(),
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      console.error('[useAutomationTemplates] Failed to fetch:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [options.category, options.popularOnly]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, AutomationTemplate[]> = {};
    for (const template of templates) {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    }
    return grouped;
  }, [templates]);

  const popularTemplates = useMemo(
    () => templates.filter((t) => t.is_popular),
    [templates]
  );

  return {
    templates,
    templatesByCategory,
    popularTemplates,
    categories,
    loading,
    error,
    refresh: fetchTemplates,
  };
}

// ============================================================================
// Execution History Hook
// ============================================================================

export function useExecutionHistory(params: GetExecutionHistoryParams = {}) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [executions, setExecutions] = useState<ExecutionLogWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchExecutions = useCallback(
    async (offset: number = 0) => {
      if (!orgId) return;

      try {
        if (offset === 0) setLoading(true);
        const data = await automationService.getExecutionHistory(orgId, {
          ...params,
          offset,
        });

        if (offset === 0) {
          setExecutions(data);
        } else {
          setExecutions((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === (params.limit || 50));
        setError(null);
      } catch (err) {
        console.error('[useExecutionHistory] Failed to fetch:', err);
        setError('Failed to load execution history');
      } finally {
        setLoading(false);
      }
    },
    [orgId, params.rule_id, params.lead_id, params.status, params.limit]
  );

  useEffect(() => {
    fetchExecutions(0);
  }, [fetchExecutions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchExecutions(executions.length);
    }
  }, [loading, hasMore, executions.length, fetchExecutions]);

  // Group by status
  const executionsByStatus = useMemo(() => {
    const grouped = {
      success: executions.filter((e) => e.status === 'success'),
      failed: executions.filter((e) => e.status === 'failed'),
      skipped: executions.filter((e) => e.status === 'skipped'),
    };
    return grouped;
  }, [executions]);

  return {
    executions,
    executionsByStatus,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchExecutions(0),
  };
}

// ============================================================================
// Automation Statistics Hook
// ============================================================================

export function useAutomationStats() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await automationService.getStats(orgId);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('[useAutomationStats] Failed to fetch:', err);
      setError('Failed to load automation statistics');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

// ============================================================================
// Trigger & Action Configs Hook
// ============================================================================

export function useAutomationConfig() {
  const getTriggerConfig = useCallback((type: AutomationTriggerType) => {
    return TRIGGER_CONFIGS[type];
  }, []);

  const getActionConfig = useCallback((type: AutomationActionType) => {
    return ACTION_CONFIGS[type];
  }, []);

  const triggersByCategory = useMemo(() => {
    return automationService.getTriggersByCategory();
  }, []);

  const actionsByCategory = useMemo(() => {
    return automationService.getActionsByCategory();
  }, []);

  const allTriggerTypes = useMemo(() => {
    return automationService.getTriggerTypes();
  }, []);

  const allActionTypes = useMemo(() => {
    return automationService.getActionTypes();
  }, []);

  return {
    getTriggerConfig,
    getActionConfig,
    triggersByCategory,
    actionsByCategory,
    allTriggerTypes,
    allActionTypes,
    TRIGGER_CONFIGS,
    ACTION_CONFIGS,
  };
}

// ============================================================================
// Rule Builder State Hook
// ============================================================================

export interface RuleBuilderState {
  name: string;
  description: string;
  triggerType: AutomationTriggerType | null;
  triggerConditions: Record<string, unknown>;
  actionType: AutomationActionType | null;
  actionConfig: Record<string, unknown>;
  delayMinutes: number;
  isActive: boolean;
}

const initialBuilderState: RuleBuilderState = {
  name: '',
  description: '',
  triggerType: null,
  triggerConditions: {},
  actionType: null,
  actionConfig: {},
  delayMinutes: 0,
  isActive: true,
};

export function useRuleBuilder(initialRule?: AutomationRule) {
  const [state, setState] = useState<RuleBuilderState>(() => {
    if (initialRule) {
      return {
        name: initialRule.name,
        description: initialRule.description || '',
        triggerType: initialRule.trigger_type as AutomationTriggerType,
        triggerConditions: initialRule.trigger_conditions,
        actionType: initialRule.action_type as AutomationActionType,
        actionConfig: initialRule.action_config,
        delayMinutes: initialRule.delay_minutes,
        isActive: initialRule.is_active,
      };
    }
    return initialBuilderState;
  });

  const [currentStep, setCurrentStep] = useState<'trigger' | 'action' | 'configure' | 'review'>(
    'trigger'
  );

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setTrigger = useCallback((type: AutomationTriggerType) => {
    setState((prev) => ({
      ...prev,
      triggerType: type,
      triggerConditions: {},
    }));
  }, []);

  const setTriggerCondition = useCallback((key: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      triggerConditions: { ...prev.triggerConditions, [key]: value },
    }));
  }, []);

  const setAction = useCallback((type: AutomationActionType) => {
    setState((prev) => ({
      ...prev,
      actionType: type,
      actionConfig: {},
    }));
  }, []);

  const setActionConfig = useCallback((key: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      actionConfig: { ...prev.actionConfig, [key]: value },
    }));
  }, []);

  const setDelayMinutes = useCallback((minutes: number) => {
    setState((prev) => ({ ...prev, delayMinutes: minutes }));
  }, []);

  const setIsActive = useCallback((isActive: boolean) => {
    setState((prev) => ({ ...prev, isActive }));
  }, []);

  const reset = useCallback(() => {
    setState(initialBuilderState);
    setCurrentStep('trigger');
  }, []);

  const loadFromTemplate = useCallback((template: AutomationTemplate) => {
    setState({
      name: template.name,
      description: template.description || '',
      triggerType: template.trigger_type as AutomationTriggerType,
      triggerConditions: template.trigger_conditions,
      actionType: template.action_type as AutomationActionType,
      actionConfig: template.action_config,
      delayMinutes: template.delay_minutes,
      isActive: false,
    });
    setCurrentStep('configure');
  }, []);

  const toCreateInput = useCallback((): CreateRuleInput | null => {
    if (!state.name || !state.triggerType || !state.actionType) {
      return null;
    }

    return {
      name: state.name,
      description: state.description || undefined,
      trigger_type: state.triggerType,
      trigger_conditions: state.triggerConditions,
      action_type: state.actionType,
      action_config: state.actionConfig,
      delay_minutes: state.delayMinutes,
      is_active: state.isActive,
    };
  }, [state]);

  const isValid = useMemo(() => {
    return !!(state.name && state.triggerType && state.actionType);
  }, [state.name, state.triggerType, state.actionType]);

  const canProceed = useCallback((step: typeof currentStep): boolean => {
    switch (step) {
      case 'trigger':
        return !!state.triggerType;
      case 'action':
        return !!state.actionType;
      case 'configure':
        return !!state.name;
      case 'review':
        return isValid;
      default:
        return false;
    }
  }, [state, isValid]);

  return {
    state,
    currentStep,
    setCurrentStep,
    setName,
    setDescription,
    setTrigger,
    setTriggerCondition,
    setAction,
    setActionConfig,
    setDelayMinutes,
    setIsActive,
    reset,
    loadFromTemplate,
    toCreateInput,
    isValid,
    canProceed,
  };
}
