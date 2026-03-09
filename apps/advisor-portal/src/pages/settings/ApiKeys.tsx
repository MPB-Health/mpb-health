// ============================================================================
// API Keys Page — Manage API keys for integrations
// ============================================================================

import { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useApiKeys } from '../../hooks/useSettings';
import type { ApiKey, CreateApiKeyInput } from '@mpbhealth/champion-core';

const AVAILABLE_SCOPES = [
  { value: 'leads:read', label: 'Read Leads', description: 'View lead information' },
  { value: 'leads:write', label: 'Write Leads', description: 'Create and update leads' },
  { value: 'messages:read', label: 'Read Messages', description: 'View conversation history' },
  { value: 'messages:write', label: 'Send Messages', description: 'Send messages to leads' },
  { value: 'contacts:read', label: 'Read Contacts', description: 'View contact information' },
  { value: 'contacts:write', label: 'Write Contacts', description: 'Create and update contacts' },
  { value: 'analytics:read', label: 'Read Analytics', description: 'Access analytics and reports' },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function maskKey(prefix: string): string {
  return `${prefix}${'•'.repeat(24)}`;
}

export default function ApiKeys() {
  const { apiKeys, loading, error, createApiKey, revokeApiKey, deleteApiKey } = useApiKeys();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateApiKeyInput>({
    name: '',
    description: '',
    scopes: [],
    expires_in_days: undefined,
  });
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreate = async () => {
    if (!createForm.name) {
      setCreateError('Name is required');
      return;
    }
    if (createForm.scopes.length === 0) {
      setCreateError('Select at least one permission scope');
      return;
    }

    try {
      setActionLoading('create');
      setCreateError(null);
      const result = await createApiKey(createForm);
      if (result) {
        setNewKeySecret(result.secret);
        setCreateForm({ name: '', description: '', scopes: [], expires_in_days: undefined });
      }
    } catch {
      setCreateError('Failed to create API key. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyKey = async () => {
    if (newKeySecret) {
      await navigator.clipboard.writeText(newKeySecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      setActionLoading(keyId);
      await revokeApiKey(keyId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this API key?')) return;

    try {
      setActionLoading(keyId);
      await deleteApiKey(keyId);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleScope = (scope: string) => {
    setCreateForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const activeKeys = apiKeys.filter((k) => k.is_active);
  const revokedKeys = apiKeys.filter((k) => !k.is_active);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">API Keys</h1>
            <p className="text-th-text-secondary mt-1">
              Manage API keys for programmatic access to your data
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        {/* Security Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Keep your API keys secure</p>
            <p className="text-sm text-yellow-700 mt-1">
              API keys provide full access to your account based on their permissions. Never share your
              keys publicly or commit them to version control.
            </p>
          </div>
        </div>

        {/* Active Keys */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Active Keys</h2>

          {activeKeys.length > 0 ? (
            <div className="bg-surface-primary rounded-xl border border-th-border-primary overflow-hidden">
              <div className="divide-y divide-th-border-primary">
                {activeKeys.map((key) => (
                  <div key={key.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-th-accent-100 rounded-lg mt-0.5">
                          <Key className="w-5 h-5 text-th-accent-600" />
                        </div>
                        <div>
                          <p className="font-medium text-th-text-primary">{key.name}</p>
                          {key.description && (
                            <p className="text-sm text-th-text-secondary mt-0.5">{key.description}</p>
                          )}
                          <p className="text-sm text-th-text-muted mt-2 font-mono">
                            {maskKey(key.key_prefix)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRevoke(key.id)}
                          disabled={actionLoading === key.id}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {actionLoading === key.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Revoke'
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-th-text-muted">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Created {formatDate(key.created_at)}
                      </span>
                      {key.expires_at && (
                        <span className="text-th-text-muted">
                          Expires {formatDate(key.expires_at)}
                        </span>
                      )}
                      {key.last_used_at && (
                        <span className="text-th-text-muted">
                          Last used {formatDate(key.last_used_at)}
                        </span>
                      )}
                      <span className="text-th-text-muted">{key.use_count} requests</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 bg-surface-secondary rounded text-xs text-th-text-secondary"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-primary rounded-xl border border-th-border-primary p-12 text-center">
              <Key className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
              <p className="text-th-text-secondary">No active API keys</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Create your first API key
              </button>
            </div>
          )}
        </div>

        {/* Revoked Keys */}
        {revokedKeys.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Revoked Keys</h2>
            <div className="bg-surface-primary rounded-xl border border-th-border-primary overflow-hidden opacity-60">
              <div className="divide-y divide-th-border-primary">
                {revokedKeys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Key className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-th-text-secondary line-through">{key.name}</p>
                        <p className="text-sm text-th-text-muted font-mono">
                          {maskKey(key.key_prefix)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(key.id)}
                      disabled={actionLoading === key.id}
                      className="p-2 text-th-text-muted hover:text-red-600 transition-colors"
                    >
                      {actionLoading === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && !newKeySecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-th-border-primary">
              <h2 className="text-lg font-semibold text-th-text-primary">Create API Key</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-th-text-muted hover:text-th-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Key Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="My Integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Used for syncing with external CRM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Expiration (optional)
                </label>
                <select
                  value={createForm.expires_in_days || ''}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      expires_in_days: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  <option value="">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.scopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5 rounded border-th-border-primary text-th-accent-600 focus:ring-th-accent-500"
                      />
                      <div>
                        <p className="font-medium text-th-text-primary text-sm">{scope.label}</p>
                        <p className="text-xs text-th-text-secondary">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-th-border-primary">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading === 'create'}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'create' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Create Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Created Modal */}
      {newKeySecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-th-border-primary">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-th-text-primary">API Key Created</h2>
              </div>
            </div>

            <div className="p-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  Make sure to copy your API key now. You won&apos;t be able to see it again!
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg font-mono text-sm break-all">
                  {showSecret ? newKeySecret : '•'.repeat(48)}
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1.5 hover:bg-surface-tertiary rounded transition-colors flex-shrink-0"
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4 text-th-text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-th-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 hover:bg-surface-tertiary rounded transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-th-text-muted" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-th-border-primary">
              <button
                onClick={() => {
                  setNewKeySecret(null);
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
