import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  TestTube,
  X,
  Send,
  Search,
} from 'lucide-react';
import {
  smsAccountService,
  type SmsAccount,
  type SmsProvider,
  type SmsLogEntry,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const PROVIDERS: { value: SmsProvider; label: string }[] = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'vonage', label: 'Vonage (Nexmo)' },
  { value: 'plivo', label: 'Plivo' },
];

interface FormData {
  name: string;
  provider: SmsProvider;
  phone_numbers: string;
  account_sid: string;
  auth_token: string;
  monthly_limit: number;
}

const DEFAULT_FORM: FormData = {
  name: '',
  provider: 'twilio',
  phone_numbers: '',
  account_sid: '',
  auth_token: '',
  monthly_limit: 1000,
};

export default function SmsAccounts() {
  const { user } = useAdmin();
  const [accounts, setAccounts] = useState<SmsAccount[]>([]);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [editing, setEditing] = useState<SmsAccount | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState('');

  const loadAccounts = async () => {
    if (!user?.org_id) return;
    try {
      const data = await smsAccountService.list(user.org_id);
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toast.error('Failed to load SMS accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!user?.org_id) return;
    try {
      const result = await smsAccountService.getSmsLog(user.org_id, { search: logSearch || undefined });
      setLogs(result.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  useEffect(() => {
    if (user?.org_id) loadAccounts();
  }, [user?.org_id]);

  useEffect(() => {
    if (showLogs) loadLogs();
  }, [showLogs, logSearch]);

  const openModal = (account?: SmsAccount) => {
    if (account) {
      setEditing(account);
      setForm({
        name: account.name,
        provider: account.provider,
        phone_numbers: account.phone_numbers.join(', '),
        account_sid: '',
        auth_token: '',
        monthly_limit: account.monthly_limit || 1000,
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.org_id) return;

    setSaving(true);
    try {
      const config: Record<string, unknown> = {};
      if (form.account_sid) config.account_sid = form.account_sid;
      if (form.auth_token) config.auth_token = form.auth_token;
      const phoneNumbers = form.phone_numbers.split(',').map((p) => p.trim()).filter(Boolean);

      if (editing) {
        await smsAccountService.update(editing.id, {
          name: form.name,
          provider: form.provider,
          phone_numbers: phoneNumbers,
          config: Object.keys(config).length > 0 ? config : undefined,
          monthly_limit: form.monthly_limit,
        }, user.id);
        toast.success('Account updated');
      } else {
        await smsAccountService.create({
          name: form.name,
          provider: form.provider,
          phone_numbers: phoneNumbers,
          config,
          monthly_limit: form.monthly_limit,
        }, user.org_id, user.id);
        toast.success('Account created');
      }
      closeModal();
      loadAccounts();
    } catch (err) {
      console.error('Failed to save account:', err);
      toast.error('Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this SMS account?')) return;

    try {
      await smsAccountService.delete(id, user.id);
      toast.success('Account deleted');
      loadAccounts();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user?.org_id) return;

    try {
      await smsAccountService.setDefault(id, user.org_id, user.id);
      toast.success('Default account updated');
      loadAccounts();
    } catch (err) {
      toast.error('Failed to set default');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await smsAccountService.testConnection(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      loadAccounts();
    } catch (err) {
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const totalSent = accounts.reduce((sum, a) => sum + a.current_month_sent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">SMS Accounts</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage SMS provider integrations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 px-4 py-2 border border-th-border text-th-text-secondary rounded-lg font-medium hover:bg-surface-secondary transition-colors"
          >
            <Send className="w-5 h-5" />
            View Logs
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Accounts</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{accounts.length}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {accounts.filter((a) => a.is_active).length}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Messages This Month</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalSent}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Limit</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">
            {accounts.reduce((sum, a) => sum + (a.monthly_limit || 0), 0) || 'N/A'}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No SMS accounts configured</p>
            <p className="text-sm text-th-text-tertiary mt-1">Add an account to start sending messages</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-th-text-primary">{account.name}</h3>
                        {account.is_default && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-th-text-tertiary capitalize">
                        {account.provider} - {account.phone_numbers.join(', ')}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-th-text-tertiary">
                        {account.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                        <span>
                          {account.current_month_sent} / {account.monthly_limit || 'unlimited'} this month
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(account.id)}
                      disabled={testing === account.id}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
                      title="Test Connection"
                    >
                      <TestTube className={`w-4 h-4 text-blue-600 ${testing === account.id ? 'animate-pulse' : ''}`} />
                    </button>
                    {!account.is_default && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                        title="Set as Default"
                      >
                        <Star className="w-4 h-4 text-yellow-600" />
                      </button>
                    )}
                    <button
                      onClick={() => openModal(account)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-th-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editing ? 'Edit Account' : 'Add Account'}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="sms-name" className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  id="sms-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="sms-provider" className="block text-sm font-medium text-th-text-secondary mb-1">Provider</label>
                <select
                  id="sms-provider"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as SmsProvider })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Phone Numbers *</label>
                <input
                  type="text"
                  value={form.phone_numbers}
                  onChange={(e) => setForm({ ...form, phone_numbers: e.target.value })}
                  placeholder="+1234567890, +0987654321"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
                <p className="text-xs text-th-text-tertiary mt-1">Separate multiple numbers with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Account SID {!editing && '*'}
                </label>
                <input
                  type="password"
                  value={form.account_sid}
                  onChange={(e) => setForm({ ...form, account_sid: e.target.value })}
                  placeholder={editing ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Auth Token {!editing && '*'}
                </label>
                <input
                  type="password"
                  value={form.auth_token}
                  onChange={(e) => setForm({ ...form, auth_token: e.target.value })}
                  placeholder={editing ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Monthly Limit</label>
                <input
                  type="number"
                  value={form.monthly_limit}
                  onChange={(e) => setForm({ ...form, monthly_limit: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">SMS Logs</h2>
              <button onClick={() => setShowLogs(false)} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-th-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  aria-label="Search SMS logs"
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search by phone number..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
                  <p className="text-th-text-secondary">No messages found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-surface-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">To</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Message</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border-subtle">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-secondary/50">
                        <td className="px-4 py-3 text-sm text-th-text-primary">{log.to_number}</td>
                        <td className="px-4 py-3 text-sm text-th-text-secondary max-w-xs truncate">{log.body}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-th-text-tertiary">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
