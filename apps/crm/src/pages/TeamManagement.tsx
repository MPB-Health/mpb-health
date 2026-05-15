// ============================================================================
// Team Management Page
// Org member management, invitations, and role-based permission configuration
// ============================================================================

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Mail,
  MoreVertical,
  Crown,
  ShieldCheck,
  UserCog,
  Eye,
  Trash2,
  RefreshCw,
  Ban,
  CheckCircle,
  X,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  orgService,
  ORG_ROLE_LABELS,
  ORG_ROLE_HIERARCHY,
  type OrgRole,
  type OrgMembership,
  permissionService,
  type Permission,
} from '@mpbhealth/auth';
import CreateUserModal from '../components/CreateUserModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberWithProfile extends OrgMembership {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
}

interface Invite {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  status: string;
  invited_by: string | null;
  token: string;
  created_at: string;
  expires_at: string | null;
}

interface RolePermission {
  id: string;
  org_id: string;
  role: OrgRole;
  permission_id: string;
  permission: { key: string } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'invitations', label: 'Invitations', icon: Mail },
  { key: 'permissions', label: 'Roles & Permissions', icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const ALL_ROLES: OrgRole[] = ['owner', 'admin', 'manager', 'advisor'];

const ROLE_ICONS: Record<OrgRole, React.ComponentType<{ className?: string }>> = {
  owner: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  advisor: Eye,
};

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  advisor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const TAB_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function displayName(p: MemberWithProfile['profile']) {
  if (!p) return 'Unknown';
  if (p.display_name) return p.display_name;
  const parts = [p.first_name, p.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : p.email ?? 'Unknown';
}

function avatarInitial(p: MemberWithProfile['profile']) {
  if (!p) return '?';
  if (p.first_name) return p.first_name.charAt(0).toUpperCase();
  if (p.display_name) return p.display_name.charAt(0).toUpperCase();
  if (p.email) return p.email.charAt(0).toUpperCase();
  return '?';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Confirmation Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-surface-primary rounded-xl border border-th-border shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              destructive
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-th-accent-100 text-th-accent-600'
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-th-text-primary">{title}</h3>
            <p className="text-sm text-th-text-secondary mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary bg-surface-secondary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-th-accent-600 text-white hover:bg-th-accent-700'
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: OrgRole }) {
  const Icon = ROLE_ICONS[role];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        ROLE_COLORS[role]
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {ORG_ROLE_LABELS[role]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isActive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {isActive ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Actions Dropdown
// ---------------------------------------------------------------------------

function ActionsDropdown({
  member,
  currentUserId,
  currentRole,
  canManage,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
}: {
  member: MemberWithProfile;
  currentUserId: string | undefined;
  currentRole: OrgRole | null;
  canManage: boolean;
  onChangeRole: (member: MemberWithProfile, role: OrgRole) => void;
  onSuspend: (member: MemberWithProfile) => void;
  onReactivate: (member: MemberWithProfile) => void;
  onRemove: (member: MemberWithProfile) => void;
}) {
  const [open, setOpen] = useState(false);

  const isSelf = member.user_id === currentUserId;
  const isHigherOrEqual =
    currentRole && ORG_ROLE_HIERARCHY[member.role] <= ORG_ROLE_HIERARCHY[currentRole];

  if (!canManage || isSelf || isHigherOrEqual) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Member actions"
        className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary hover:text-th-text-primary transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-surface-primary rounded-xl border border-th-border shadow-lg py-1">
            <div className="px-3 py-2 text-xs font-semibold text-th-text-tertiary uppercase tracking-wide">
              Change Role
            </div>
            {ALL_ROLES.filter(
              (r) =>
                r !== member.role &&
                currentRole &&
                ORG_ROLE_HIERARCHY[r] > ORG_ROLE_HIERARCHY[currentRole]
            ).map((r) => {
              const Icon = ROLE_ICONS[r];
              return (
                <button
                  key={r}
                  onClick={() => {
                    onChangeRole(member, r);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <Icon className="w-4 h-4 text-th-text-tertiary" />
                  {ORG_ROLE_LABELS[r]}
                </button>
              );
            })}

            <div className="border-t border-th-border my-1" />

            {member.status === 'active' ? (
              <button
                onClick={() => {
                  onSuspend(member);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-surface-secondary transition-colors"
              >
                <Ban className="w-4 h-4" />
                Suspend
              </button>
            ) : (
              <button
                onClick={() => {
                  onReactivate(member);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-surface-secondary transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Reactivate
              </button>
            )}

            <button
              onClick={() => {
                onRemove(member);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-surface-secondary transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove from org
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite Modal
// ---------------------------------------------------------------------------

function InviteModal({
  open,
  orgId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('advisor');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setRole('advisor');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const result = await orgService.inviteMember(orgId, email.trim(), role);
      if (result.success) {
        toast.success(`Invitation sent to ${email}`);
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(result.error ?? 'Failed to send invitation');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface-primary rounded-xl border border-th-border shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-th-accent-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-th-text-primary">Invite Team Member</h3>
              <p className="text-sm text-th-text-secondary">Send an invitation to join your organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1.5">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                aria-label="Role"
                className="w-full appearance-none px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent pr-10"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ORG_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1.5">
              Personal message <span className="text-th-text-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a welcome note..."
              className="w-full px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-secondary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="px-4 py-2.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------

function MembersTab({
  members,
  loading,
  error,
  currentUserId,
  currentRole,
  canManage,
  onRefresh,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
  onInvite,
  onCreateUser,
}: {
  members: MemberWithProfile[];
  loading: boolean;
  error: string | null;
  currentUserId: string | undefined;
  currentRole: OrgRole | null;
  canManage: boolean;
  onRefresh: () => void;
  onChangeRole: (member: MemberWithProfile, role: OrgRole) => void;
  onSuspend: (member: MemberWithProfile) => void;
  onReactivate: (member: MemberWithProfile) => void;
  onRemove: (member: MemberWithProfile) => void;
  onInvite: () => void;
  onCreateUser: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((m) => {
      const name = displayName(m.profile).toLowerCase();
      const email = (m.profile?.email ?? '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-th-text-secondary">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-sm"
          />
        </div>
        {canManage && (
          <>
            <button
              onClick={onCreateUser}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors flex-shrink-0"
              title="Create a new CRM user with a temporary password"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
            <button
              onClick={onInvite}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-secondary text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors flex-shrink-0"
              title="Send an email invite — the recipient sets their own password"
            >
              <UserCheck className="w-4 h-4" />
              Invite Existing
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10 text-th-text-tertiary" />
          <p className="text-th-text-secondary text-sm">
            {search ? 'No members match your search' : 'No members found'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-th-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider hidden md:table-cell">
                  Job Title
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="w-12 py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
              {filtered.map((member) => (
                <tr key={member.id} className="group hover:bg-surface-secondary/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-th-accent-100 flex items-center justify-center text-th-accent-700 font-semibold text-sm">
                          {avatarInitial(member.profile)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-th-text-primary font-medium truncate">
                          {displayName(member.profile)}
                          {member.user_id === currentUserId && (
                            <span className="ml-1.5 text-xs text-th-text-tertiary font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-th-text-tertiary text-xs truncate">
                          {member.profile?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-th-text-secondary text-sm">
                      {member.profile?.job_title || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ActionsDropdown
                      member={member}
                      currentUserId={currentUserId}
                      currentRole={currentRole}
                      canManage={canManage}
                      onChangeRole={onChangeRole}
                      onSuspend={onSuspend}
                      onReactivate={onReactivate}
                      onRemove={onRemove}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invitations Tab
// ---------------------------------------------------------------------------

function InvitationsTab({
  invites,
  loading,
  error,
  canManage,
  onResend,
  onRevoke,
  onRefresh,
}: {
  invites: Invite[];
  loading: boolean;
  error: string | null;
  canManage: boolean;
  onResend: (invite: Invite) => void;
  onRevoke: (invite: Invite) => void;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-th-text-secondary">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Mail className="w-10 h-10 text-th-text-tertiary" />
        <p className="text-th-text-secondary text-sm">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-th-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
              Email
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
              Role
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider hidden sm:table-cell">
              Invited
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider hidden md:table-cell">
              Status
            </th>
            {canManage && <th className="w-24 py-3 px-4" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-th-border">
          {invites.map((invite) => (
            <tr key={invite.id} className="hover:bg-surface-secondary/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />
                  <span className="text-th-text-primary truncate">{invite.email}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <RoleBadge role={invite.role} />
              </td>
              <td className="py-3 px-4 text-th-text-secondary hidden sm:table-cell">
                {formatDate(invite.created_at)}
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Pending
                </span>
              </td>
              {canManage && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => onResend(invite)}
                      title="Resend"
                      className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary hover:text-th-accent-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRevoke(invite)}
                      title="Revoke"
                      className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles & Permissions Tab
// ---------------------------------------------------------------------------

function PermissionsTab({
  orgId,
  canManage,
}: {
  orgId: string;
  canManage: boolean;
}) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allPerms, rpResult] = await Promise.all([
        permissionService.getAllPermissions(),
        supabase
          .from('role_permissions')
          .select('id, org_id, role, permission_id, permission:permissions(key)')
          .eq('org_id', orgId),
      ]);

      if (rpResult.error) throw rpResult.error;

      setPermissions(allPerms);
      setRolePerms((rpResult.data ?? []) as unknown as RolePermission[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const mod = p.module || 'general';
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    }
    return map;
  }, [permissions]);

  const hasRolePerm = useCallback(
    (role: OrgRole, permissionId: string) =>
      rolePerms.some((rp) => rp.role === role && rp.permission_id === permissionId),
    [rolePerms]
  );

  const togglePermission = async (role: OrgRole, permission: Permission) => {
    const key = `${role}:${permission.id}`;
    setToggling(key);

    const existing = rolePerms.find(
      (rp) => rp.role === role && rp.permission_id === permission.id
    );

    try {
      if (existing) {
        const { error: delErr } = await supabase
          .from('role_permissions')
          .delete()
          .eq('id', existing.id);
        if (delErr) throw delErr;
        setRolePerms((prev) => prev.filter((rp) => rp.id !== existing.id));
      } else {
        const { data, error: insErr } = await supabase
          .from('role_permissions')
          .insert({ org_id: orgId, role, permission_id: permission.id })
          .select('id, org_id, role, permission_id, permission:permissions(key)')
          .single();
        if (insErr) throw insErr;
        setRolePerms((prev) => [...prev, data as unknown as RolePermission]);
      }
    } catch (err) {
      toast.error('Failed to update permission');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-th-text-secondary">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Shield className="w-10 h-10 text-th-text-tertiary" />
        <p className="text-th-text-secondary text-sm">No permissions configured</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-th-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider min-w-[200px]">
              Permission
            </th>
            {ALL_ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              return (
                <th
                  key={role}
                  className="text-center py-3 px-4 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {ORG_ROLE_LABELS[role]}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from(grouped.entries()).map(([module, perms]) => (
            <Fragment key={module}>
              <tr>
                <td
                  colSpan={ALL_ROLES.length + 1}
                  className="py-2.5 px-4 bg-surface-secondary/60 text-xs font-bold text-th-text-secondary uppercase tracking-wider"
                >
                  {module}
                </td>
              </tr>
              {perms.map((perm) => (
                <tr
                  key={perm.id}
                  className="border-b border-th-border/50 hover:bg-surface-secondary/30 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <div>
                      <p className="text-th-text-primary font-medium text-sm">{perm.key}</p>
                      {perm.description && (
                        <p className="text-th-text-tertiary text-xs mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </td>
                  {ALL_ROLES.map((role) => {
                    const isOwner = role === 'owner';
                    const checked = isOwner || hasRolePerm(role, perm.id);
                    const key = `${role}:${perm.id}`;
                    const isToggling = toggling === key;

                    return (
                      <td key={role} className="py-2.5 px-4 text-center">
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin text-th-accent-500 mx-auto" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isOwner || !canManage}
                            onChange={() => togglePermission(role, perm)}
                            aria-label={`${perm.key} for ${ORG_ROLE_LABELS[role]}`}
                            className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TeamManagement() {
  const { activeOrgId, orgRole, can } = useOrg();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('members');

  // Members state
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Invitations state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [invitesError, setInvitesError] = useState<string | null>(null);

  // Modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Confirm dialog
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    destructive: boolean;
    loading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    destructive: false,
    loading: false,
    onConfirm: async () => {},
  });

  const canManage = orgRole === 'owner' || orgRole === 'admin' || can('team.manage');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchMembers = useCallback(async () => {
    if (!activeOrgId) return;
    setMembersLoading(true);
    setMembersError(null);
    try {
      const { data, error } = await supabase
        .from('org_memberships')
        .select(
          '*, profile:profiles(id, first_name, last_name, display_name, email, avatar_url, job_title)'
        )
        .eq('org_id', activeOrgId)
        .in('status', ['active', 'suspended'])
        .order('role');

      if (error) throw error;
      setMembers((data ?? []) as unknown as MemberWithProfile[]);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [activeOrgId]);

  const fetchInvites = useCallback(async () => {
    if (!activeOrgId) return;
    setInvitesLoading(true);
    setInvitesError(null);
    try {
      const { data, error } = await supabase
        .from('org_invites')
        .select('id, org_id, email, role, status, invited_by, token, created_at, expires_at')
        .eq('org_id', activeOrgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites((data ?? []) as unknown as Invite[]);
    } catch (err) {
      setInvitesError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setInvitesLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [fetchMembers, fetchInvites]);

  // ---------------------------------------------------------------------------
  // Member actions
  // ---------------------------------------------------------------------------

  const handleChangeRole = (member: MemberWithProfile, newRole: OrgRole) => {
    setConfirmState({
      open: true,
      title: 'Change Role',
      message: `Change ${displayName(member.profile)}'s role to ${ORG_ROLE_LABELS[newRole]}?`,
      confirmLabel: 'Change Role',
      destructive: false,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const result = await orgService.updateMemberRole(activeOrgId!, member.user_id, newRole);
          if (result.success) {
            toast.success(`Role updated to ${ORG_ROLE_LABELS[newRole]}`);
            fetchMembers();
          } else {
            toast.error(result.error ?? 'Failed to change role');
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to change role');
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };

  const handleSuspend = (member: MemberWithProfile) => {
    setConfirmState({
      open: true,
      title: 'Suspend Member',
      message: `Are you sure you want to suspend ${displayName(member.profile)}? They will lose access to the organization.`,
      confirmLabel: 'Suspend',
      destructive: true,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const result = await orgService.suspendMember(activeOrgId!, member.user_id);
          if (result.success) {
            toast.success('Member suspended');
            fetchMembers();
          } else {
            toast.error(result.error ?? 'Failed to suspend member');
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to suspend member');
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };

  const handleReactivate = async (member: MemberWithProfile) => {
    try {
      const { error } = await supabase
        .from('org_memberships')
        .update({ status: 'active', suspended_at: null, suspended_reason: null })
        .eq('id', member.id);

      if (error) throw error;
      toast.success('Member reactivated');
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reactivate member');
    }
  };

  const handleRemove = (member: MemberWithProfile) => {
    setConfirmState({
      open: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${displayName(member.profile)} from the organization? This action cannot be undone.`,
      confirmLabel: 'Remove',
      destructive: true,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const result = await orgService.removeMember(activeOrgId!, member.user_id);
          if (result.success) {
            toast.success('Member removed');
            fetchMembers();
          } else {
            toast.error(result.error ?? 'Failed to remove member');
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to remove member');
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Invitation actions
  // ---------------------------------------------------------------------------

  const handleResendInvite = async (invite: Invite) => {
    try {
      const result = await orgService.inviteMember(activeOrgId!, invite.email, invite.role);
      if (result.success) {
        toast.success(`Invitation resent to ${invite.email}`);
        fetchInvites();
      } else {
        toast.error(result.error ?? 'Failed to resend invitation');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  };

  const handleRevokeInvite = (invite: Invite) => {
    setConfirmState({
      open: true,
      title: 'Revoke Invitation',
      message: `Revoke the invitation sent to ${invite.email}?`,
      confirmLabel: 'Revoke',
      destructive: true,
      loading: false,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const { error } = await supabase.from('org_invites').delete().eq('id', invite.id);
          if (error) throw error;
          toast.success('Invitation revoked');
          fetchInvites();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation');
        } finally {
          setConfirmState((s) => ({ ...s, open: false, loading: false }));
        }
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Guard
  // ---------------------------------------------------------------------------

  if (!activeOrgId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Users className="w-12 h-12 text-th-text-tertiary" />
        <p className="text-th-text-secondary">Select an organization to manage your team</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-th-accent-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-th-accent-600" />
          </div>
          Team Management
        </h1>
        <p className="text-th-text-secondary mt-1 ml-[52px]">
          Manage members, invitations, and permissions for your organization
        </p>
      </div>

      {/* Tabs + Content */}
      <div className="bg-surface-primary rounded-xl border border-th-border shadow-sm">
        {/* Tab Bar */}
        <div className="border-b border-th-border px-4 flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                activeTab === key
                  ? 'border-th-accent-600 text-th-accent-600'
                  : 'border-transparent text-th-text-tertiary hover:text-th-text-primary hover:border-th-border'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'members' && !membersLoading && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-secondary text-th-text-tertiary">
                  {members.length}
                </span>
              )}
              {key === 'invitations' && !invitesLoading && invites.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {invites.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'members' && (
              <motion.div key="members" {...TAB_MOTION}>
                <MembersTab
                  members={members}
                  loading={membersLoading}
                  error={membersError}
                  currentUserId={user?.id}
                  currentRole={orgRole}
                  canManage={canManage}
                  onRefresh={fetchMembers}
                  onChangeRole={handleChangeRole}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onRemove={handleRemove}
                  onInvite={() => setInviteOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'invitations' && (
              <motion.div key="invitations" {...TAB_MOTION}>
                <InvitationsTab
                  invites={invites}
                  loading={invitesLoading}
                  error={invitesError}
                  canManage={canManage}
                  onResend={handleResendInvite}
                  onRevoke={handleRevokeInvite}
                  onRefresh={fetchInvites}
                />
              </motion.div>
            )}

            {activeTab === 'permissions' && (
              <motion.div key="permissions" {...TAB_MOTION}>
                <PermissionsTab orgId={activeOrgId} canManage={canManage} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        open={inviteOpen}
        orgId={activeOrgId}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          fetchInvites();
          fetchMembers();
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
