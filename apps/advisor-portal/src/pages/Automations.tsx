import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import {
  useAutomationRules,
  useAutomationActions,
  useAutomationStats,
  useAutomationTemplates,
  useAutomationConfig,
} from '../hooks/useAutomation';
import type { AutomationRule, AutomationTemplate } from '@mpbhealth/champion-core';

export default function Automations() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const { rules, loading, refresh } = useAutomationRules();
  const { toggleRule, deleteRule, duplicateRule, createFromTemplate, isSubmitting } = useAutomationActions();
  const { stats } = useAutomationStats();
  const { templates, popularTemplates, categories } = useAutomationTemplates();
  const { getTriggerConfig, getActionConfig } = useAutomationConfig();

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    // Active/inactive filter
    if (activeFilter === 'active' && !rule.is_active) return false;
    if (activeFilter === 'inactive' && rule.is_active) return false;

    // Trigger type filter
    if (triggerFilter !== 'all' && rule.trigger_type !== triggerFilter) return false;

    // Search filter
    if (search && !rule.name.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  const handleToggle = async (rule: AutomationRule) => {
    const success = await toggleRule(rule.id, !rule.is_active);
    if (success) refresh();
  };

  const handleDuplicate = async (ruleId: string) => {
    const newRule = await duplicateRule(ruleId);
    if (newRule) {
      refresh();
      navigate(`/automations/${newRule.id}`);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    const success = await deleteRule(ruleId);
    if (success) refresh();
  };

  const handleUseTemplate = async (template: AutomationTemplate) => {
    const rule = await createFromTemplate(template.id);
    if (rule) {
      setShowTemplates(false);
      navigate(`/automations/${rule.id}`);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Play className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
        <Pause className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  // Get unique trigger types from rules
  const triggerTypes = [...new Set(rules.map((r) => r.trigger_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <GradientHeader
          title="Automations"
          subtitle="Create rules to automate your workflow"
          icon={<Zap className="w-6 h-6" />}
        />
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => navigate('/automations/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Active Rules</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.active_rules}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Play className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Executions Today</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.executions_today}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">This Week</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.executions_this_week}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Success Rate</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.success_rate !== null ? `${stats.success_rate}%` : '-'}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input
            type="text"
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-neutral-700 placeholder-neutral-400"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                activeFilter === status
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Trigger type filter */}
        {triggerTypes.length > 0 && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-700"
            >
              <option value="all">All Triggers</option>
              {triggerTypes.map((type) => {
                const config = getTriggerConfig(type as any);
                return (
                  <option key={type} value={type}>
                    {config?.label || type}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <Zap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 mb-4">
            {search || activeFilter !== 'all' || triggerFilter !== 'all'
              ? 'No automations match your filters'
              : 'No automations yet'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
            >
              Browse Templates
            </button>
            <button
              onClick={() => navigate('/automations/new')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create From Scratch
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => {
            const triggerConfig = getTriggerConfig(rule.trigger_type as any);
            const actionConfig = getActionConfig(rule.action_type as any);

            return (
              <div
                key={rule.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/automations/${rule.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Rule name and status */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-neutral-900">{rule.name}</h3>
                      {getStatusBadge(rule.is_active)}
                    </div>

                    {/* Description */}
                    {rule.description && (
                      <p className="text-sm text-neutral-500 mb-3">{rule.description}</p>
                    )}

                    {/* Trigger -> Action flow */}
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {triggerConfig?.label || rule.trigger_type}
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                      <div className="flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                        <Zap className="w-4 h-4 mr-1.5" />
                        {actionConfig?.label || rule.action_type}
                      </div>
                      {rule.delay_minutes > 0 && (
                        <>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-500">
                            {rule.delay_minutes < 60
                              ? `${rule.delay_minutes}m delay`
                              : `${Math.round(rule.delay_minutes / 60)}h delay`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Stats */}
                    <div className="text-right mr-4">
                      <p className="text-lg font-semibold text-neutral-900">
                        {rule.execution_count}
                      </p>
                      <p className="text-xs text-neutral-500">executions</p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(rule);
                      }}
                      disabled={isSubmitting}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.is_active
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {rule.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    {/* More menu */}
                    <div className="relative group">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 hidden group-hover:block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(rule.id);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rule.id);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {rule.last_executed_at && (
                  <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
                    Last executed {format(new Date(rule.last_executed_at), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Automation Templates</h2>
                  <p className="text-sm text-neutral-500">
                    Start with a pre-built template to save time
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Popular Templates */}
              {popularTemplates.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-500 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Popular Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {popularTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        disabled={isSubmitting}
                        className="text-left p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                      >
                        <h4 className="font-medium text-neutral-900">{template.name}</h4>
                        <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
                        <div className="flex items-center mt-2 text-xs text-neutral-400">
                          <span className="capitalize">{template.category}</span>
                          <span className="mx-2">•</span>
                          <span>{template.use_count} uses</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Templates by Category */}
              {categories.map((category) => {
                const categoryTemplates = templates.filter((t) => t.category === category);
                if (categoryTemplates.length === 0) return null;

                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium text-neutral-500 mb-3 capitalize">
                      {category.replace(/_/g, ' ')}
                    </h3>
                    <div className="space-y-2">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleUseTemplate(template)}
                          disabled={isSubmitting}
                          className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-medium text-neutral-900">{template.name}</h4>
                            <p className="text-sm text-neutral-500">{template.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
