// ============================================================================
// Integrations Page — Manage third-party integrations
// ============================================================================

import { useState } from 'react';
import {
  Plug,
  Settings,
  Check,
  XCircle,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Clock,
  Zap,
  X,
} from 'lucide-react';
import { useIntegrations } from '../../hooks/useSettings';
import type { IntegrationConfig, CreateIntegrationInput, IntegrationType } from '@mpbhealth/champion-core';

// Icon mapping for providers
const PROVIDER_ICONS: Record<string, string> = {
  salesforce: '🔵',
  hubspot: '🟠',
  sendgrid: '📧',
  mailgun: '📨',
  twilio: '📱',
  google_calendar: '📅',
  outlook: '📮',
  aws_s3: '☁️',
  zapier: '⚡',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getCategoryColor(type: IntegrationType): string {
  switch (type) {
    case 'crm':
      return 'bg-blue-100 text-blue-700';
    case 'email':
      return 'bg-blue-100 text-blue-700';
    case 'sms':
      return 'bg-green-100 text-green-700';
    case 'calendar':
      return 'bg-orange-100 text-orange-700';
    case 'storage':
      return 'bg-gray-100 text-gray-700';
    case 'webhook':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function Integrations() {
  const {
    integrations,
    availableIntegrations,
    configuredProviders,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
  } = useIntegrations();

  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsIntegration, setSettingsIntegration] = useState<IntegrationConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState<Partial<CreateIntegrationInput>>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string, unknown>>({});

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

  const handleAddIntegration = async () => {
    if (!selectedProvider) return;

    const providerInfo = availableIntegrations.find((i) => i.provider === selectedProvider);
    if (!providerInfo) return;

    try {
      setActionLoading('add');
      setAddError(null);

      await createIntegration({
        integration_type: providerInfo.type,
        provider: selectedProvider,
        name: addForm.name || providerInfo.name,
        description: addForm.description,
        config: addForm.config,
        webhook_url: addForm.webhook_url,
      });

      setShowAddModal(false);
      setSelectedProvider(null);
      setAddForm({});
    } catch {
      setAddError('Failed to add integration. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (integration: IntegrationConfig) => {
    try {
      setActionLoading(integration.id);
      await toggleIntegration(integration.id, !integration.is_enabled);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to remove this integration?')) return;

    try {
      setActionLoading(integrationId);
      await deleteIntegration(integrationId);
      setSelectedIntegration(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenSettings = (integration: IntegrationConfig) => {
    setSettingsIntegration(integration);
    setSettingsForm(integration.config || {});
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    if (!settingsIntegration) return;

    try {
      setActionLoading(settingsIntegration.id);
      await updateIntegration(settingsIntegration.id, {
        config: settingsForm,
      });
      setShowSettingsModal(false);
      setSettingsIntegration(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (integration: IntegrationConfig) => {
    try {
      setSyncingId(integration.id);
      // Simulate sync - in a real app this would call a sync endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Sync completed - the integration service would update last_sync_at internally
      // Just re-fetch to reflect any changes
    } finally {
      setSyncingId(null);
    }
  };

  // Group available integrations by type
  const groupedAvailable = availableIntegrations.reduce(
    (acc, integration) => {
      const type = integration.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(integration);
      return acc;
    },
    {} as Record<IntegrationType, typeof availableIntegrations>
  );

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-th-text-primary">Integrations</h1>
          <p className="text-th-text-secondary mt-1">
            Connect your favorite tools and services
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('connected')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'connected'
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <Plug className="w-4 h-4" />
            Connected ({integrations.length})
          </button>

          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <Zap className="w-4 h-4" />
            Available
          </button>
        </div>

        {/* Connected Integrations Tab */}
        {activeTab === 'connected' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`bg-surface-primary rounded-xl border border-th-border-primary p-5 hover:border-th-accent-300 transition-colors cursor-pointer ${
                  selectedIntegration?.id === integration.id ? 'ring-2 ring-th-accent-500' : ''
                }`}
                onClick={() =>
                  setSelectedIntegration(
                    selectedIntegration?.id === integration.id ? null : integration
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{PROVIDER_ICONS[integration.provider] || '🔌'}</div>
                    <div>
                      <p className="font-semibold text-th-text-primary">{integration.name}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getCategoryColor(
                          integration.integration_type
                        )}`}
                      >
                        {integration.integration_type}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {integration.is_connected ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Not connected
                      </span>
                    )}
                  </div>
                </div>

                {integration.description && (
                  <p className="text-sm text-th-text-secondary mt-3">{integration.description}</p>
                )}

                {integration.last_sync_at && (
                  <p className="text-xs text-th-text-muted mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last synced {formatDate(integration.last_sync_at)}
                  </p>
                )}

                {integration.last_error && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {integration.last_error}
                  </p>
                )}

                {/* Expanded Actions */}
                {selectedIntegration?.id === integration.id && (
                  <div className="mt-4 pt-4 border-t border-th-border-primary flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(integration);
                        }}
                        disabled={actionLoading === integration.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          integration.is_enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {integration.is_enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSettings(integration);
                        }}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-tertiary rounded-lg transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSync(integration);
                        }}
                        disabled={syncingId === integration.id}
                        className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-tertiary rounded-lg transition-colors disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(integration.id);
                      }}
                      disabled={actionLoading === integration.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove integration"
                    >
                      {actionLoading === integration.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {integrations.length === 0 && (
              <div className="col-span-2 bg-surface-primary rounded-xl border border-th-border-primary p-12 text-center">
                <Plug className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                <p className="text-th-text-secondary">No integrations connected</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
                >
                  Browse available integrations
                </button>
              </div>
            )}
          </div>
        )}

        {/* Available Integrations Tab */}
        {activeTab === 'available' && (
          <div className="space-y-8">
            {Object.entries(groupedAvailable).map(([type, typeIntegrations]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold text-th-text-primary mb-4 capitalize">
                  {type} Integrations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeIntegrations.map((integration) => {
                    const isConfigured = configuredProviders.has(integration.provider);

                    return (
                      <div
                        key={integration.provider}
                        className={`bg-surface-primary rounded-xl border border-th-border-primary p-5 ${
                          isConfigured ? 'opacity-60' : 'hover:border-th-accent-300 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isConfigured) {
                            setSelectedProvider(integration.provider);
                            setShowAddModal(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{PROVIDER_ICONS[integration.provider] || '🔌'}</div>
                          <div>
                            <p className="font-semibold text-th-text-primary">{integration.name}</p>
                            {isConfigured && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Configured
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-th-text-secondary mb-3">
                          {integration.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {integration.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-0.5 bg-surface-secondary rounded text-xs text-th-text-muted"
                            >
                              {feature.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>

                        {!isConfigured && (
                          <button className="mt-4 w-full py-2 text-sm font-medium text-th-accent-600 hover:bg-th-accent-50 rounded-lg transition-colors">
                            Add Integration
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-th-border-primary">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{PROVIDER_ICONS[selectedProvider] || '🔌'}</div>
                <h2 className="text-lg font-semibold text-th-text-primary">
                  Add {availableIntegrations.find((i) => i.provider === selectedProvider)?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProvider(null);
                  setAddForm({});
                }}
                className="p-1 text-th-text-muted hover:text-th-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={addForm.name || ''}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder={
                    availableIntegrations.find((i) => i.provider === selectedProvider)?.name
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={addForm.description || ''}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Used for..."
                />
              </div>

              <div className="p-4 bg-surface-secondary rounded-lg">
                <p className="text-sm text-th-text-secondary">
                  After adding this integration, you&apos;ll need to complete the OAuth flow or provide
                  API credentials to connect your account.
                </p>
                <a
                  href="/quick-links"
                  className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:text-th-accent-700 mt-2"
                >
                  View setup guide
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-th-border-primary">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProvider(null);
                  setAddForm({});
                }}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntegration}
                disabled={actionLoading === 'add'}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'add' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4" />
                    Add Integration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && settingsIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-th-border-primary">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{PROVIDER_ICONS[settingsIntegration.provider] || '🔌'}</div>
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {settingsIntegration.name} Settings
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsIntegration(null);
                  setSettingsForm({});
                }}
                className="p-1 text-th-text-muted hover:text-th-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={(settingsForm.api_key as string) || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, api_key: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Enter API key..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Webhook URL (optional)
                </label>
                <input
                  type="url"
                  value={(settingsForm.webhook_url as string) || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                <span className="text-sm text-th-text-secondary">Enable Integration</span>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, enabled: !settingsForm.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settingsForm.enabled !== false ? 'bg-th-accent-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settingsForm.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-th-border-primary">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsIntegration(null);
                  setSettingsForm({});
                }}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={actionLoading === settingsIntegration.id}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === settingsIntegration.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
