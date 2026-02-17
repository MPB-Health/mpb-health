// ============================================================================
// User Preferences Page — Configure personal display and behavior settings
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Palette,
  Moon,
  Sun,
  Layout,
  Keyboard,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useUserPreferences } from '../../hooks/useSettings';
import type { UpdateUserPreferencesInput } from '@mpbhealth/champion-core';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Classic light theme' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
];

const VIEW_OPTIONS = [
  { value: 'cards', label: 'Cards' },
  { value: 'list', label: 'List' },
  { value: 'kanban', label: 'Kanban' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'unread', label: 'Unread First' },
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'lead', label: 'By Lead' },
  { value: 'channel', label: 'By Channel' },
];

export default function UserPreferences() {
  const { preferences, loading, error, saving, updatePreferences } = useUserPreferences();
  const [formData, setFormData] = useState<UpdateUserPreferencesInput>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        theme: preferences.theme,
        sidebar_collapsed: preferences.sidebar_collapsed,
        compact_mode: preferences.compact_mode,
        power_list_view: preferences.power_list_view,
        auto_advance_after_complete: preferences.auto_advance_after_complete,
        inbox_preview_lines: preferences.inbox_preview_lines,
        inbox_group_by: preferences.inbox_group_by,
        inbox_sort_order: preferences.inbox_sort_order,
        keyboard_shortcuts_enabled: preferences.keyboard_shortcuts_enabled,
      });
    }
  }, [preferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setFormError(null);
      await updatePreferences(formData);
      setSuccessMessage('Preferences saved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setFormError('Failed to save preferences. Please try again.');
    }
  };

  const updateField = <K extends keyof UpdateUserPreferencesInput>(
    field: K,
    value: UpdateUserPreferencesInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-th-text-primary">Appearance & Preferences</h1>
          <p className="text-th-text-secondary mt-1">
            Customize your experience and display settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{formError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Theme</h2>
                <p className="text-sm text-th-text-secondary">Choose your preferred color scheme</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.theme === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => updateField('theme', option.value as 'light' | 'dark' | 'system')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-th-accent-600 bg-th-accent-50'
                        : 'border-th-border-primary hover:border-th-accent-300'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-2 ${
                        isSelected ? 'text-th-accent-600' : 'text-th-text-muted'
                      }`}
                    />
                    <p className={`font-medium ${isSelected ? 'text-th-accent-600' : 'text-th-text-primary'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-th-text-muted mt-1">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layout className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Display</h2>
                <p className="text-sm text-th-text-secondary">Customize the interface layout</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-th-text-primary">Compact Mode</p>
                  <p className="text-sm text-th-text-secondary">
                    Reduce padding and spacing for more content
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('compact_mode', !formData.compact_mode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.compact_mode ? 'bg-th-accent-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      formData.compact_mode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between py-3 border-t border-th-border-primary">
                <div>
                  <p className="font-medium text-th-text-primary">Collapsed Sidebar</p>
                  <p className="text-sm text-th-text-secondary">
                    Start with sidebar collapsed by default
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('sidebar_collapsed', !formData.sidebar_collapsed)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.sidebar_collapsed ? 'bg-th-accent-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      formData.sidebar_collapsed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Power List Preferences */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Power List</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                  Default View
                </label>
                <div className="flex gap-2">
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        updateField('power_list_view', option.value as 'cards' | 'list' | 'kanban')
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.power_list_view === option.value
                          ? 'bg-th-accent-600 text-white'
                          : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between py-3 border-t border-th-border-primary">
                <div>
                  <p className="font-medium text-th-text-primary">Auto-Advance</p>
                  <p className="text-sm text-th-text-secondary">
                    Automatically move to next item after completing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField('auto_advance_after_complete', !formData.auto_advance_after_complete)
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.auto_advance_after_complete ? 'bg-th-accent-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      formData.auto_advance_after_complete ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Inbox Preferences */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Inbox</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Preview Lines
                </label>
                <select
                  value={formData.inbox_preview_lines || 2}
                  onChange={(e) => updateField('inbox_preview_lines', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  <option value={1}>1 line</option>
                  <option value={2}>2 lines</option>
                  <option value={3}>3 lines</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Sort Order
                </label>
                <select
                  value={formData.inbox_sort_order || 'newest'}
                  onChange={(e) =>
                    updateField('inbox_sort_order', e.target.value as 'newest' | 'oldest' | 'unread')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Group By
                </label>
                <select
                  value={formData.inbox_group_by || 'none'}
                  onChange={(e) =>
                    updateField('inbox_group_by', e.target.value as 'none' | 'lead' | 'channel')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  {GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Keyboard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Keyboard Shortcuts</h2>
                <p className="text-sm text-th-text-secondary">
                  Enable keyboard shortcuts for faster navigation
                </p>
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() =>
                    updateField('keyboard_shortcuts_enabled', !formData.keyboard_shortcuts_enabled)
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.keyboard_shortcuts_enabled ? 'bg-th-accent-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      formData.keyboard_shortcuts_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {formData.keyboard_shortcuts_enabled && (
              <div className="mt-4 pt-4 border-t border-th-border-primary">
                <p className="text-sm text-th-text-secondary mb-3">Available shortcuts:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                    <span className="text-th-text-secondary">Go to Dashboard</span>
                    <kbd className="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono">G D</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                    <span className="text-th-text-secondary">Go to Inbox</span>
                    <kbd className="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono">G I</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                    <span className="text-th-text-secondary">Power List</span>
                    <kbd className="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono">G P</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                    <span className="text-th-text-secondary">Quick Search</span>
                    <kbd className="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono">⌘ K</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
