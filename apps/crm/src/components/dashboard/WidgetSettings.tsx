// ============================================================================
// Widget Settings Modal
// Configure widget-specific settings
// ============================================================================

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../Modal';
import { useDashboardStore } from '../../contexts/DashboardContext';
import { getWidgetConfig } from './widgets/widgetRegistry';
import type { WidgetInstance } from '@mpbhealth/crm-core/dashboard';
import type { ConfigField } from './types';

// ============================================================================
// Types
// ============================================================================

interface WidgetSettingsProps {
  widget: WidgetInstance;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Widget Settings Component
// ============================================================================

export function WidgetSettings({ widget, isOpen, onClose }: WidgetSettingsProps) {
  const { updateWidgetConfig, updateWidgetSize } = useDashboardStore();
  const widgetConfig = getWidgetConfig(widget.widgetId);

  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(widget.config);
  const [localSize, setLocalSize] = useState(widget.size);

  // Reset local state when widget changes
  useEffect(() => {
    setLocalConfig(widget.config);
    setLocalSize(widget.size);
  }, [widget]);

  if (!widgetConfig) {
    return null;
  }

  const handleFieldChange = (key: string, value: unknown) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateWidgetConfig(widget.instanceId, localConfig);
    if (localSize !== widget.size) {
      updateWidgetSize(widget.instanceId, localSize);
    }
    onClose();
  };

  const handleReset = () => {
    // Reset to default values from config schema
    const defaults: Record<string, unknown> = {};
    widgetConfig.configSchema?.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    });
    setLocalConfig(defaults);
  };

  const Icon = widgetConfig.icon;

  return (
    <Modal open={isOpen}
        title="Widget Settings" onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Icon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{widgetConfig.title} Settings</h2>
              <p className="text-sm text-gray-500">{widgetConfig.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Size Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Widget Size
          </label>
          <div className="flex gap-2">
            {widgetConfig.allowedSizes.map((size) => (
              <button
                key={size}
                onClick={() => setLocalSize(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  localSize === size
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Config Fields */}
        {widgetConfig.configSchema && widgetConfig.configSchema.fields.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configuration
            </h3>
            {widgetConfig.configSchema.fields.map((field) => (
              <ConfigFieldInput
                key={field.key}
                field={field}
                value={localConfig[field.key] ?? field.defaultValue}
                onChange={(value) => handleFieldChange(field.key, value)}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Config Field Input Component
// ============================================================================

interface ConfigFieldInputProps {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ConfigFieldInput({ field, value, onChange }: ConfigFieldInputProps) {
  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {field.label}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:border-gray-600"
          />
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {field.label}
          </label>
          <input
            type="number"
            value={(value as number) || 0}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:border-gray-600"
          />
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {field.label}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:border-gray-600"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.key}
            checked={(value as boolean) || false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
          />
          <label
            htmlFor={field.key}
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500">{field.description}</p>
          )}
        </div>
      );

    case 'color':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {field.label}
          </label>
          <input
            type="color"
            value={(value as string) || '#8B5CF6'}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default WidgetSettings;
