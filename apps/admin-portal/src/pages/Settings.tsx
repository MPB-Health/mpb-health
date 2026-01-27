import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plug,
} from 'lucide-react';
import {
  settingsService,
  type SystemSetting,
  type Integration,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

export default function Settings() {
  const { user } = useAdmin();
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({});
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, integrationsData] = await Promise.all([
          settingsService.getSettingsByCategory(),
          settingsService.getIntegrations(),
        ]);
        setSettings(settingsData);
        setIntegrations(integrationsData);

        // Initialize edited settings
        const edited: Record<string, unknown> = {};
        Object.values(settingsData)
          .flat()
          .forEach((s) => {
            edited[s.key] = s.value;
          });
        setEditedSettings(edited);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedSettings)) {
        await settingsService.updateSetting(key, value, user.id);
      }
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    setTestingIntegration(integrationId);
    try {
      const result = await settingsService.testIntegration(integrationId);
      if (result.success) {
        toast.success(result.message);
        // Refresh integrations
        const updated = await settingsService.getIntegrations();
        setIntegrations(updated);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to test integration');
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleToggleIntegration = async (integration: Integration) => {
    try {
      if (integration.status === 'active') {
        await settingsService.disableIntegration(integration.id);
      } else {
        await settingsService.enableIntegration(integration.id);
      }
      const updated = await settingsService.getIntegrations();
      setIntegrations(updated);
      toast.success(
        integration.status === 'active'
          ? 'Integration disabled'
          : 'Integration enabled'
      );
    } catch (err) {
      toast.error('Failed to update integration');
    }
  };

  const getIntegrationStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-th-text-tertiary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Settings</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Configure system settings and integrations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Settings by category */}
      {Object.entries(settings).map(([category, categorySettings]) => (
        <div
          key={category}
          className="bg-surface-primary rounded-xl border border-th-border p-6"
        >
          <h2 className="text-lg font-semibold text-th-text-primary capitalize mb-6">
            {category} Settings
          </h2>
          <div className="space-y-6">
            {categorySettings.map((setting) => (
              <div key={setting.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-th-text-secondary">
                    {setting.key
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </label>
                  {setting.is_sensitive && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">Sensitive</span>
                  )}
                </div>
                {setting.description && (
                  <p className="text-sm text-th-text-tertiary mb-2">
                    {setting.description}
                  </p>
                )}
                {typeof setting.value === 'boolean' ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedSettings[setting.key] as boolean}
                      onChange={(e) =>
                        setEditedSettings({
                          ...editedSettings,
                          [setting.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                    />
                    <span className="text-sm text-th-text-secondary">
                      {editedSettings[setting.key] ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                ) : (
                  <input
                    type={setting.is_sensitive ? 'password' : 'text'}
                    value={String(editedSettings[setting.key] || '')}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        [setting.key]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Integrations */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Plug className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Integrations</h2>
        </div>
        <div className="space-y-4">
          {integrations.length > 0 ? (
            integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {getIntegrationStatusIcon(integration.status)}
                  <div>
                    <p className="font-medium text-th-text-primary">
                      {integration.name}
                    </p>
                    <p className="text-sm text-th-text-tertiary capitalize">
                      {integration.type}
                      {integration.last_sync_at && (
                        <span className="ml-2">
                          · Last sync:{' '}
                          {new Date(integration.last_sync_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    {integration.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {integration.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestIntegration(integration.id)}
                    disabled={testingIntegration === integration.id}
                    className="flex items-center space-x-1 px-3 py-1.5 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-primary disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        testingIntegration === integration.id ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Test</span>
                  </button>
                  <button
                    onClick={() => handleToggleIntegration(integration)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      integration.status === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {integration.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-th-text-tertiary text-center py-4">
              No integrations configured
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
