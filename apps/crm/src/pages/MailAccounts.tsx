// ============================================================================
// Mail Accounts - Connect & manage M365/Gmail accounts
// Connected Inbox account management page
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail, Plus, RefreshCw, Trash2, Star, Shield, Users, Settings2,
  CheckCircle2, AlertCircle, Clock, XCircle, Wifi, WifiOff,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type { MailAccount, MailProvider } from '@mpbhealth/crm-core';
import toast from 'react-hot-toast';

// Provider brand config
const PROVIDERS: Record<MailProvider, { name: string; icon: string; color: string; bgColor: string }> = {
  microsoft365: {
    name: 'Microsoft 365',
    icon: '🏢',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  gmail: {
    name: 'Gmail',
    icon: '📧',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  imap: {
    name: 'IMAP/SMTP',
    icon: '🔧',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

const SYNC_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  idle: { icon: CheckCircle2, color: 'text-green-500', label: 'Connected' },
  syncing: { icon: RefreshCw, color: 'text-blue-500', label: 'Syncing...' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
  disabled: { icon: XCircle, color: 'text-gray-400', label: 'Disabled' },
};

export default function MailAccounts() {
  const { mailAccountService } = useCRM();
  const { activeOrgId } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<MailProvider | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const data = await mailAccountService.getAccounts(activeOrgId);
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [mailAccountService, activeOrgId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const decoded = JSON.parse(atob(state));
      const { provider, org_id } = decoded;

      setConnecting(provider);
      await mailAccountService.exchangeOAuthCode(code, provider, org_id);
      toast.success(`${PROVIDERS[provider as MailProvider].name} account connected successfully`);
      await loadAccounts();

      // Clean URL params
      setSearchParams({});
    } catch (err) {
      toast.error('Failed to connect account');
      console.error(err);
    } finally {
      setConnecting(null);
    }
  };

  const handleConnect = async (provider: MailProvider) => {
    if (!activeOrgId) return;
    try {
      setConnecting(provider);
      const url = await mailAccountService.getOAuthUrl(provider, activeOrgId);
      window.location.href = url;
    } catch (err) {
      toast.error('Failed to start connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (account: MailAccount) => {
    if (!confirm(`Disconnect ${account.email_address}? Synced messages will be preserved.`)) return;
    try {
      await mailAccountService.disconnectAccount(account.id);
      toast.success('Account disconnected');
      await loadAccounts();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleSetDefault = async (account: MailAccount) => {
    if (!activeOrgId) return;
    try {
      await mailAccountService.setDefaultAccount(account.id, activeOrgId);
      toast.success(`${account.email_address} set as default`);
      await loadAccounts();
    } catch {
      toast.error('Failed to set default');
    }
  };

  const handleSync = async (account: MailAccount) => {
    try {
      await mailAccountService.syncFolders(account.id);
      toast.success('Sync started');
      await loadAccounts();
    } catch {
      toast.error('Sync failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Mail Accounts</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Connect your Microsoft 365 or Gmail accounts for a unified inbox experience
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connect Account
        </button>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Mail className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-2">No accounts connected</h3>
          <p className="text-sm text-th-text-secondary mb-6 max-w-sm mx-auto">
            Connect your email accounts to send and receive emails directly from the CRM
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
          >
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(account => {
            const providerConfig = PROVIDERS[account.provider];
            const statusConfig = SYNC_STATUS_CONFIG[account.sync_status] || SYNC_STATUS_CONFIG.idle;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={account.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${providerConfig.bgColor} flex items-center justify-center text-xl`}>
                      {account.avatar_url && !account.avatar_url.startsWith('data:') ? (
                        <img src={account.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        providerConfig.icon
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-th-text-primary">
                          {account.display_name || account.email_address}
                        </span>
                        {account.is_default && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-th-text-secondary">{account.email_address}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium ${providerConfig.color}`}>
                          {providerConfig.name}
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${account.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                          {statusConfig.label}
                        </span>
                        {account.last_sync_at && (
                          <>
                            <span className="text-neutral-300">|</span>
                            <span className="text-xs text-th-text-tertiary">
                              Last sync: {new Date(account.last_sync_at).toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>
                      {account.sync_error && (
                        <p className="text-xs text-red-500 mt-1">{account.sync_error}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSync(account)}
                      className="p-2 text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 rounded-lg transition-colors"
                      title="Sync now"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {!account.is_default && (
                      <button
                        onClick={() => handleSetDefault(account)}
                        className="p-2 text-th-text-tertiary hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDisconnect(account)}
                      className="p-2 text-th-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sync Settings Bar */}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-6 text-xs text-th-text-tertiary">
                  <div className="flex items-center gap-1.5">
                    {account.auto_sync ? (
                      <Wifi className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    Auto-sync: {account.auto_sync ? `Every ${account.sync_interval_minutes}m` : 'Off'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {account.scopes?.length || 0} permissions
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Connected {new Date(account.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConnectModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-th-text-primary mb-1">Connect Email Account</h2>
            <p className="text-sm text-th-text-secondary mb-6">
              Choose your email provider to get started
            </p>

            <div className="space-y-3">
              {/* Microsoft 365 */}
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  handleConnect('microsoft365');
                }}
                disabled={connecting === 'microsoft365'}
                className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg group-hover:bg-blue-100 transition-colors">
                  🏢
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-th-text-primary">Microsoft 365</div>
                  <div className="text-xs text-th-text-secondary">Outlook, Exchange, Office 365</div>
                </div>
                {connecting === 'microsoft365' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
              </button>

              {/* Gmail */}
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  handleConnect('gmail');
                }}
                disabled={connecting === 'gmail'}
                className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-lg group-hover:bg-red-100 transition-colors">
                  📧
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-th-text-primary">Gmail</div>
                  <div className="text-xs text-th-text-secondary">Google Workspace, Gmail</div>
                </div>
                {connecting === 'gmail' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                )}
              </button>

              {/* IMAP (coming soon) */}
              <div className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg">
                  🔧
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-th-text-primary">IMAP / SMTP</div>
                  <div className="text-xs text-th-text-secondary">Custom mail servers</div>
                </div>
                <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
