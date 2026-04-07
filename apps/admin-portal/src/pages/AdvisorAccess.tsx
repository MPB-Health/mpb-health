import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Search,
  KeyRound,
  Mail,
  RotateCcw,
  UserPlus,
  Eye,
  Copy,
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  LogIn,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  userService,
  type AdvisorProfileSummary,
  type CrossPortalUser,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';
import AddAdvisorModal from '../components/AddAdvisorModal';

type SortField = 'name' | 'email' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  inactive: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 14; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export default function AdvisorAccess() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();

  const [advisors, setAdvisors] = useState<AdvisorProfileSummary[]>([]);
  const [authMap, setAuthMap] = useState<Map<string, CrossPortalUser>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Inline password set
  const [passwordTarget, setPasswordTarget] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);

  // Resend invite
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [resendPassword, setResendPassword] = useState('');
  const [resending, setResending] = useState(false);

  // Sending reset
  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  // Impersonation
  const [impersonateTarget, setImpersonateTarget] = useState<AdvisorProfileSummary | null>(null);
  const [impersonateMode, setImpersonateMode] = useState<'magiclink' | 'temp_password'>('magiclink');
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateTempPw, setImpersonateTempPw] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, crossData] = await Promise.all([
        userService.getAdvisorProfiles(debouncedSearch || undefined),
        userService.getCrossPortalUsers({ role: 'advisor' }),
      ]);
      setAdvisors(profileData);
      const map = new Map<string, CrossPortalUser>();
      for (const u of crossData) {
        map.set(u.id, u);
      }
      setAuthMap(map);
    } catch (err) {
      console.error('Failed to load advisor data:', err);
      toast.error('Failed to load advisors');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats
  const totalAdvisors = advisors.length;
  const activeAdvisors = advisors.filter((a) => a.status === 'active').length;
  const neverLoggedIn = advisors.filter((a) => {
    const auth = authMap.get(a.id);
    return !auth?.last_sign_in_at;
  }).length;
  const suspendedAdvisors = advisors.filter((a) => a.status === 'suspended').length;

  // Filter + sort
  const filtered = advisors
    .filter((a) => !statusFilter || a.status === statusFilter)
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '');
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />
    );
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleSendReset = async (advisor: AdvisorProfileSummary) => {
    if (!advisor.email) return;
    setSendingResetFor(advisor.id);
    try {
      await userService.sendPasswordReset(advisor.email);
      toast.success(`Password reset email sent to ${advisor.email}`);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setSendingResetFor(null);
    }
  };

  const handleSetPassword = async (advisorId: string) => {
    if (!tempPassword || tempPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSettingPassword(true);
    try {
      // advisorId is the auth user id (advisor_profiles.id = auth.users.id)
      await userService.setUserPassword(advisorId, tempPassword);
      toast.success('Password set successfully');
      setPasswordTarget(null);
      setTempPassword('');
    } catch {
      toast.error('Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  const handleResendInvite = async (advisorId: string) => {
    if (!resendPassword) {
      toast.error('Enter a temporary password to include in the invite');
      return;
    }
    setResending(true);
    try {
      const result = await userService.resendAdvisorInvite(advisorId, resendPassword);
      if (result?.success) {
        const summary = result as { summary?: { sent?: number } };
        if (summary.summary?.sent && summary.summary.sent > 0) {
          toast.success('Welcome email resent');
        } else {
          toast.error('Invite was not sent. Check advisor status.');
        }
      } else {
        toast.error((result as { error?: string })?.error || 'Failed to send invite');
      }
      setResendingFor(null);
      setResendPassword('');
    } catch {
      toast.error('Failed to resend invite');
    } finally {
      setResending(false);
    }
  };

  const handleToggleStatus = async (advisor: AdvisorProfileSummary) => {
    const newStatus = advisor.status === 'active' ? 'suspended' : 'active';
    try {
      await userService.updateAdvisorProfileStatus(advisor.id, newStatus);
      setAdvisors((prev) =>
        prev.map((a) => (a.id === advisor.id ? { ...a, status: newStatus } : a))
      );
      toast.success(`Advisor ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleImpersonate = async () => {
    if (!impersonateTarget) return;
    setImpersonating(true);
    setImpersonateTempPw('');
    try {
      const result = await userService.impersonateAdvisor(impersonateTarget.id, impersonateMode);
      if (impersonateMode === 'magiclink' && result.url) {
        window.open(result.url, '_blank');
        toast.success(`Opening advisor portal as ${impersonateTarget.first_name} ${impersonateTarget.last_name}`);
        setImpersonateTarget(null);
      } else if (impersonateMode === 'temp_password' && result.temp_password) {
        setImpersonateTempPw(result.temp_password);
        toast.success('Temporary password set');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impersonation failed');
    } finally {
      setImpersonating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-100 dark:bg-teal-900/30">
            <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Advisor Access</h1>
            <p className="text-th-text-tertiary text-sm mt-0.5">
              Help advisors log in, reset passwords, and manage access
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          New Advisor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`bg-surface-primary rounded-xl border p-4 text-left transition-colors ${!statusFilter ? 'border-th-accent-500 ring-1 ring-th-accent-500' : 'border-th-border hover:border-th-accent-300'}`}
        >
          <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">{totalAdvisors}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`bg-surface-primary rounded-xl border p-4 text-left transition-colors ${statusFilter === 'active' ? 'border-green-500 ring-1 ring-green-500' : 'border-th-border hover:border-green-300'}`}
        >
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Active</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">{activeAdvisors}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className="bg-surface-primary rounded-xl border border-th-border p-4 text-left hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Never Logged In</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">{neverLoggedIn}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('suspended')}
          className={`bg-surface-primary rounded-xl border p-4 text-left transition-colors ${statusFilter === 'suspended' ? 'border-red-500 ring-1 ring-red-500' : 'border-th-border hover:border-red-300'}`}
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <UserX className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Suspended</span>
          </div>
          <p className="text-2xl font-bold text-th-text-primary">{suspendedAdvisors}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name, email, or agent ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary"
        />
        {statusFilter && (
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 text-xs bg-surface-tertiary rounded-full text-th-text-secondary hover:text-th-text-primary"
          >
            {statusFilter} <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">
              {debouncedSearch ? 'No advisors match your search' : 'No advisors found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    Advisor <SortIcon field="name" />
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary cursor-pointer select-none"
                    onClick={() => handleSort('email')}
                  >
                    Email <SortIcon field="email" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Agent ID
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {filtered.map((advisor) => {
                  const auth = authMap.get(advisor.id);
                  const lastLogin = auth?.last_sign_in_at;
                  const isExpanded = passwordTarget === advisor.id || resendingFor === advisor.id;

                  return (
                    <tr key={advisor.id} className="group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-surface-tertiary rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-th-text-secondary">
                              {(advisor.first_name?.[0] || '').toUpperCase()}
                              {(advisor.last_name?.[0] || '').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/users/${advisor.id}`)}
                              className="font-medium text-th-text-primary hover:text-th-accent-600 truncate block text-left"
                            >
                              {advisor.first_name} {advisor.last_name}
                            </button>
                            {advisor.company_name && (
                              <p className="text-xs text-th-text-tertiary truncate">{advisor.company_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-th-text-secondary truncate max-w-[200px]">{advisor.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(advisor.email)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-th-text-tertiary hover:text-th-text-secondary rounded transition-opacity"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-th-text-secondary font-mono">
                          {advisor.agent_id || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize font-medium ${STATUS_COLORS[advisor.status] || STATUS_COLORS.inactive}`}>
                          {advisor.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${lastLogin ? 'text-th-text-secondary' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
                          {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Send password reset email */}
                          <button
                            type="button"
                            onClick={() => handleSendReset(advisor)}
                            disabled={sendingResetFor === advisor.id}
                            title="Send password reset email"
                            className="p-1.5 text-th-text-tertiary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {sendingResetFor === advisor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>

                          {/* Set password directly */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (passwordTarget === advisor.id) {
                                  setPasswordTarget(null);
                                  setTempPassword('');
                                } else {
                                  setPasswordTarget(advisor.id);
                                  setResendingFor(null);
                                  setTempPassword(generateTempPassword());
                                }
                              }}
                              title="Set temporary password"
                              className={`p-1.5 rounded-lg transition-colors ${
                                passwordTarget === advisor.id
                                  ? 'text-th-accent-600 bg-th-accent-50 dark:bg-th-accent-900/20'
                                  : 'text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20'
                              }`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {/* Resend invite */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (resendingFor === advisor.id) {
                                  setResendingFor(null);
                                  setResendPassword('');
                                } else {
                                  setResendingFor(advisor.id);
                                  setPasswordTarget(null);
                                  setResendPassword(generateTempPassword());
                                }
                              }}
                              title="Resend welcome email"
                              className={`p-1.5 rounded-lg transition-colors ${
                                resendingFor === advisor.id
                                  ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                  : 'text-th-text-tertiary hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle status */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(advisor)}
                              title={advisor.status === 'active' ? 'Suspend advisor' : 'Activate advisor'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                advisor.status === 'active'
                                  ? 'text-th-text-tertiary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  : 'text-th-text-tertiary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                            >
                              {advisor.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Login as advisor */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setImpersonateTarget(advisor);
                                setImpersonateMode('magiclink');
                                setImpersonateTempPw('');
                              }}
                              title="Login as this advisor"
                              className="p-1.5 text-th-text-tertiary hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                          )}

                          {/* View full profile */}
                          <button
                            type="button"
                            onClick={() => navigate(`/users/${advisor.id}`)}
                            title="View full profile"
                            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Inline: Set Password */}
                        {isExpanded && passwordTarget === advisor.id && (
                          <div className="mt-2 p-3 bg-surface-secondary rounded-lg border border-th-border space-y-2">
                            <p className="text-xs font-medium text-th-text-secondary">Set Temporary Password</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg font-mono text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(tempPassword)}
                                title="Copy password"
                                className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSetPassword(advisor.id)}
                                disabled={settingPassword}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent-600 text-white text-xs rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
                              >
                                {settingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                                {settingPassword ? 'Setting...' : 'Set Password'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPasswordTarget(null); setTempPassword(''); }}
                                className="px-3 py-1.5 text-xs border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline: Resend Invite */}
                        {isExpanded && resendingFor === advisor.id && (
                          <div className="mt-2 p-3 bg-surface-secondary rounded-lg border border-th-border space-y-2">
                            <p className="text-xs font-medium text-th-text-secondary">Resend Welcome Email</p>
                            <p className="text-xs text-th-text-tertiary">
                              This will also set the password below for the advisor.
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={resendPassword}
                                onChange={(e) => setResendPassword(e.target.value)}
                                placeholder="Temp password to include"
                                className="flex-1 px-2.5 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg font-mono text-th-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(resendPassword)}
                                title="Copy password"
                                className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleResendInvite(advisor.id)}
                                disabled={resending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                              >
                                {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                {resending ? 'Sending...' : 'Send Invite'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setResendingFor(null); setResendPassword(''); }}
                                className="px-3 py-1.5 text-xs border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddAdvisorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadData();
        }}
      />

      {/* Impersonation confirmation dialog */}
      {impersonateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setImpersonateTarget(null); setImpersonateTempPw(''); }}
          />
          <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-th-text-primary">Login as Advisor</h3>
                  <p className="text-sm text-th-text-tertiary">Impersonate this advisor account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setImpersonateTarget(null); setImpersonateTempPw(''); }}
                aria-label="Close dialog"
                className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-surface-secondary rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-th-text-primary">
                {impersonateTarget.first_name} {impersonateTarget.last_name}
              </p>
              <p className="text-sm text-th-text-tertiary">{impersonateTarget.email}</p>
              {impersonateTarget.agent_id && (
                <p className="text-xs text-th-text-tertiary font-mono">Agent: {impersonateTarget.agent_id}</p>
              )}
            </div>

            {!impersonateTempPw && (
              <>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-2">Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImpersonateMode('magiclink')}
                      className={`px-3 py-2.5 text-sm rounded-lg border transition-colors text-left ${
                        impersonateMode === 'magiclink'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                          : 'border-th-border text-th-text-secondary hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-4 h-4" />
                        <span className="font-medium">Magic Link</span>
                      </div>
                      <p className="text-xs opacity-70">Opens portal in a new tab</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImpersonateMode('temp_password')}
                      className={`px-3 py-2.5 text-sm rounded-lg border transition-colors text-left ${
                        impersonateMode === 'temp_password'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                          : 'border-th-border text-th-text-secondary hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="w-4 h-4" />
                        <span className="font-medium">Temp Password</span>
                      </div>
                      <p className="text-xs opacity-70">Sets a temporary password</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    This action will be logged. {impersonateMode === 'temp_password' ? 'Remember to reset the password after testing.' : 'A session will be created for this advisor.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setImpersonateTarget(null); setImpersonateTempPw(''); }}
                    className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImpersonate}
                    disabled={impersonating}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {impersonating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    {impersonating ? 'Processing...' : impersonateMode === 'magiclink' ? 'Open Portal' : 'Set Password'}
                  </button>
                </div>
              </>
            )}

            {impersonateTempPw && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1.5">
                    Temporary Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={impersonateTempPw}
                      aria-label="Temporary password"
                      className="flex-1 px-3 py-2 text-sm font-mono bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(impersonateTempPw)}
                      title="Copy password"
                      className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Use this to sign in at the advisor portal. Remember to reset the advisor's password after testing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setImpersonateTarget(null); setImpersonateTempPw(''); }}
                  className="w-full px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
