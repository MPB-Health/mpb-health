import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Zap,
  Clock,
  ChevronRight,
  ChevronDown,
  Settings,
  AlertCircle,
  CheckCircle,
  History,
} from 'lucide-react';
import {
  useAutomationRule,
  useAutomationActions,
  useExecutionHistory,
  useAutomationConfig,
  useRuleBuilder,
} from '../hooks/useAutomation';
import type {
  AutomationTriggerType,
  AutomationActionType,
  TriggerField,
  ActionField,
} from '@mpbhealth/champion-core';
import { format } from 'date-fns';

export default function AutomationEditor() {
  const { automationId } = useParams<{ automationId: string }>();
  const navigate = useNavigate();
  const isNew = automationId === 'new';

  const { rule, loading, refresh } = useAutomationRule(isNew ? null : automationId || null);
  const { createRule, updateRule, toggleRule, isSubmitting, error } = useAutomationActions();
  const { executions } = useExecutionHistory(
    isNew ? {} : { rule_id: automationId, limit: 10 }
  );
  const {
    triggersByCategory,
    actionsByCategory,
    getTriggerConfig,
    getActionConfig,
  } = useAutomationConfig();

  const builder = useRuleBuilder(rule || undefined);

  const [showTriggerPicker, setShowTriggerPicker] = useState(isNew);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load existing rule into builder
  useEffect(() => {
    if (rule && !isNew) {
      builder.setName(rule.name);
      builder.setDescription(rule.description || '');
      builder.setTrigger(rule.trigger_type as AutomationTriggerType);
      builder.setAction(rule.action_type as AutomationActionType);
      builder.setDelayMinutes(rule.delay_minutes);
      builder.setIsActive(rule.is_active);

      // Load trigger conditions
      Object.entries(rule.trigger_conditions).forEach(([key, value]) => {
        builder.setTriggerCondition(key, value);
      });

      // Load action config
      Object.entries(rule.action_config).forEach(([key, value]) => {
        builder.setActionConfig(key, value);
      });
    }
  }, [rule]);

  const handleSave = async () => {
    const input = builder.toCreateInput();
    if (!input) return;

    if (isNew) {
      const newRule = await createRule(input);
      if (newRule) {
        navigate(`/automations/${newRule.id}`, { replace: true });
      }
    } else if (automationId) {
      const updated = await updateRule(automationId, input);
      if (updated) {
        refresh();
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!automationId || isNew) return;
    const success = await toggleRule(automationId, !builder.state.isActive);
    if (success) {
      builder.setIsActive(!builder.state.isActive);
      refresh();
    }
  };

  const renderFieldInput = (
    field: TriggerField | ActionField,
    value: unknown,
    onChange: (value: unknown) => void
  ) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, opt.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== opt.value));
                    }
                  }}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">{field.label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );
    }
  };

  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isNew && !rule) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 mb-4">Automation not found</p>
        <button
          onClick={() => navigate('/automations')}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          Back to Automations
        </button>
      </div>
    );
  }

  const triggerConfig = builder.state.triggerType
    ? getTriggerConfig(builder.state.triggerType)
    : null;
  const actionConfig = builder.state.actionType
    ? getActionConfig(builder.state.actionType)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/automations')}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <input
              type="text"
              value={builder.state.name}
              onChange={(e) => builder.setName(e.target.value)}
              placeholder="Automation name..."
              className="text-xl font-semibold text-neutral-900 bg-transparent border-none outline-none focus:ring-0 w-full"
            />
            <p className="text-sm text-neutral-500">
              {isNew ? 'Create new automation' : 'Edit automation'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isNew && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
                  showHistory
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>

              <button
                onClick={handleToggleStatus}
                disabled={isSubmitting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  builder.state.isActive
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {builder.state.isActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Activate</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={isSubmitting || !builder.isValid}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={builder.state.description}
              onChange={(e) => builder.setDescription(e.target.value)}
              placeholder="Describe what this automation does..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Trigger */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                When this happens...
              </h3>
              <button
                onClick={() => setShowTriggerPicker(!showTriggerPicker)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {builder.state.triggerType ? 'Change' : 'Select Trigger'}
              </button>
            </div>

            {showTriggerPicker ? (
              <div className="space-y-4">
                {Object.entries(triggersByCategory).map(([category, triggers]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {triggers.map((config) => (
                        <button
                          key={config.type}
                          onClick={() => {
                            builder.setTrigger(config.type);
                            setShowTriggerPicker(false);
                          }}
                          className={`text-left p-3 border rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors ${
                            builder.state.triggerType === config.type
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <p className="font-medium text-neutral-900">{config.label}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {config.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : triggerConfig ? (
              <div>
                <div className="flex items-center px-4 py-3 bg-blue-50 rounded-lg mb-4">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">{triggerConfig.label}</p>
                    <p className="text-sm text-blue-700">{triggerConfig.description}</p>
                  </div>
                </div>

                {triggerConfig.fields.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {triggerConfig.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFieldInput(
                          field,
                          builder.state.triggerConditions[field.key],
                          (value) => builder.setTriggerCondition(field.key, value)
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Select a trigger to continue</p>
            )}
          </div>

          {/* Action */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-600" />
                Do this...
              </h3>
              <button
                onClick={() => setShowActionPicker(!showActionPicker)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {builder.state.actionType ? 'Change' : 'Select Action'}
              </button>
            </div>

            {showActionPicker ? (
              <div className="space-y-4">
                {Object.entries(actionsByCategory).map(([category, actions]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {actions.map((config) => (
                        <button
                          key={config.type}
                          onClick={() => {
                            builder.setAction(config.type);
                            setShowActionPicker(false);
                          }}
                          className={`text-left p-3 border rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors ${
                            builder.state.actionType === config.type
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <p className="font-medium text-neutral-900">{config.label}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {config.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : actionConfig ? (
              <div>
                <div className="flex items-center px-4 py-3 bg-purple-50 rounded-lg mb-4">
                  <Zap className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">{actionConfig.label}</p>
                    <p className="text-sm text-purple-700">{actionConfig.description}</p>
                  </div>
                </div>

                {actionConfig.fields.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {actionConfig.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFieldInput(
                          field,
                          builder.state.actionConfig[field.key],
                          (value) => builder.setActionConfig(field.key, value)
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Select an action to continue</p>
            )}
          </div>

          {/* Delay */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Timing</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={builder.state.delayMinutes === 0}
                  onChange={() => builder.setDelayMinutes(0)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Immediately</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={builder.state.delayMinutes > 0}
                  onChange={() => builder.setDelayMinutes(60)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">After a delay</span>
              </label>
            </div>

            {builder.state.delayMinutes > 0 && (
              <div className="mt-4 flex items-center space-x-3">
                <span className="text-sm text-neutral-500">Wait</span>
                <input
                  type="number"
                  min={1}
                  value={builder.state.delayMinutes}
                  onChange={(e) => builder.setDelayMinutes(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
                <span className="text-sm text-neutral-500">minutes before executing</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase">Status</p>
                <p
                  className={`text-sm font-medium ${
                    builder.state.isActive ? 'text-green-600' : 'text-neutral-500'
                  }`}
                >
                  {builder.state.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">Trigger</p>
                <p className="text-sm font-medium text-neutral-900">
                  {triggerConfig?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">Action</p>
                <p className="text-sm font-medium text-neutral-900">
                  {actionConfig?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">Delay</p>
                <p className="text-sm font-medium text-neutral-900">
                  {builder.state.delayMinutes === 0
                    ? 'Immediate'
                    : `${builder.state.delayMinutes} minutes`}
                </p>
              </div>
              {rule && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase">Executions</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {rule.execution_count}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* History Panel */}
          {showHistory && executions.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Recent Executions</h3>
              <div className="space-y-3">
                {executions.map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-start space-x-3 text-sm"
                  >
                    {exec.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : exec.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900 truncate">
                        {exec.lead_name || 'Unknown lead'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(exec.executed_at), 'MMM d, h:mm a')}
                      </p>
                      {exec.result_message && (
                        <p className="text-xs text-neutral-400 mt-1 truncate">
                          {exec.result_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
