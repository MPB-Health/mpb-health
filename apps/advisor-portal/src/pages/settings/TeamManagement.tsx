// ============================================================================
// Team Management Page — Manage organization members and invitations
// ============================================================================

import { useState } from 'react';
import {
  Users,
  Mail,
  UserPlus,
  MoreHorizontal,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useTeamManagement } from '../../hooks/useSettings';
import type { OrgMember, OrganizationInvitation, CreateInvitationInput } from '@mpbhealth/champion-core';
import { Button } from '@mpbhealth/ui';
import { useAdvisorPageDebugLog } from '../../hooks/useAdvisorPageDebugLog';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'manager', label: 'Manager', description: 'Manage team members and view reports' },
  { value: 'advisor', label: 'Advisor', description: 'Standard user access' },
  { value: 'readonly', label: 'Read Only', description: 'View-only access' },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-blue-100 text-blue-700';
    case 'manager':
      return 'bg-blue-100 text-blue-700';
    case 'advisor':
      return 'bg-green-100 text-green-700';
    case 'readonly':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatusBadge(status: string): { color: string; icon: typeof CheckCircle } {
  switch (status) {
    case 'pending':
      return { color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'accepted':
      return { color: 'bg-green-100 text-green-700', icon: CheckCircle };
    case 'expired':
      return { color: 'bg-red-100 text-red-700', icon: XCircle };
    case 'revoked':
      return { color: 'bg-gray-100 text-gray-700', icon: XCircle };
    default:
      return { color: 'bg-gray-100 text-gray-700', icon: Clock };
  }
}

export default function TeamManagement() {
  useAdvisorPageDebugLog('TeamManagement');
  const {    members,
    invitations,
    loading,
    error,
    updateMemberRole,
    removeMember,
    inviteMember,
    revokeInvitation,
    resendInvitation,
  } = useTeamManagement();

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState<CreateInvitationInput>({
    email: '',
    role: 'advisor',
    message: '',
  });
  const [inviteError, setInviteError] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

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

  const handleInvite = async () => {
    if (!inviteForm.email) {
      setInviteError('Email is required');
      return;
    }

    try {
      setActionLoading('invite');
      setInviteError(null);
      await inviteMember(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'advisor', message: '' });
    } catch (err) {
      setInviteError('Failed to send invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      setActionLoading(memberId);
      await updateMemberRole(memberId, role);
    } finally {
      setActionLoading(null);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setActionLoading(memberId);
      await removeMember(memberId);
    } finally {
      setActionLoading(null);
      setSelectedMember(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await revokeInvitation(invitationId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await resendInvitation(invitationId);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Team Management</h1>
            <p className="text-th-text-secondary mt-1">
              Manage team members and send invitations
            </p>
          </div>

          <Button
            onClick={() => setShowInviteModal(true)}
            variant="primary"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab('members')}
            variant={activeTab === 'members' ? 'primary' : 'secondary'}
          >
            <Users className="w-4 h-4" />
            Members ({members.length})
          </Button>

          <Button
            onClick={() => setActiveTab('invitations')}
            variant={activeTab === 'invitations' ? 'primary' : 'secondary'}
          >
            <Mail className="w-4 h-4" />
            Invitations ({pendingInvitations.length})
          </Button>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-surface-primary rounded-xl border border-th-border-primary overflow-hidden">
            <div className="divide-y divide-th-border-primary">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="p-4 flex items-center gap-4 hover:bg-surface-secondary transition-colors"
                >
                  {/* Avatar */}
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      aria-hidden="true"
                      role="presentation"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-th-accent-100 flex items-center justify-center text-th-accent-600 font-medium ${member.avatar_url ? 'hidden' : ''}`}>
                    {getInitials(member.first_name, member.last_name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-th-text-primary truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-th-text-secondary truncate">{member.email}</p>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>

                  {/* Last Active */}
                  <div className="text-sm text-th-text-muted w-28 text-right">
                    <span className="block text-xs text-th-text-muted">Last active</span>
                    {formatRelativeTime(member.last_active_at)}
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <Button
                      onClick={() => setSelectedMember(selectedMember?.user_id === member.user_id ? null : member)}
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>

                    {/* Dropdown */}
                    {selectedMember?.user_id === member.user_id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary rounded-lg border border-th-border-primary shadow-lg z-10">
                        <div className="p-2">
                          <p className="text-xs text-th-text-muted px-2 py-1">Change Role</p>
                          {ROLES.map((role) => (
                            <button
                              key={role.value}
                              onClick={() => handleUpdateRole(member.user_id, role.value)}
                              disabled={actionLoading === member.user_id}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-surface-secondary ${
                                member.role === role.value
                                  ? 'text-th-accent-600 font-medium'
                                  : 'text-th-text-primary'
                              }`}
                            >
                              {role.label}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-th-border-primary p-2">
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={actionLoading === member.user_id}
                            className="w-full text-left px-2 py-1.5 rounded text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                  <p className="text-th-text-secondary">No team members yet</p>
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    variant="ghost"
                    className="mt-4 text-th-accent-600 hover:text-th-accent-700"
                  >
                    Invite your first team member
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="bg-surface-primary rounded-xl border border-th-border-primary overflow-hidden">
            <div className="divide-y divide-th-border-primary">
              {invitations.map((invitation) => {
                const status = getStatusBadge(invitation.status);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={invitation.id}
                    className="p-4 flex items-center gap-4 hover:bg-surface-secondary transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center">
                      <Mail className="w-5 h-5 text-th-text-muted" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary truncate">{invitation.email}</p>
                      <p className="text-sm text-th-text-secondary">
                        Invited {formatRelativeTime(invitation.created_at)}
                      </p>
                    </div>

                    {/* Role */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                        invitation.role
                      )}`}
                    >
                      {invitation.role}
                    </span>

                    {/* Status */}
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${status.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {invitation.status}
                    </span>

                    {/* Actions */}
                    {invitation.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px]"
                          title="Resend invitation"
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] hover:text-red-600 hover:bg-red-50"
                          title="Revoke invitation"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {invitations.length === 0 && (
                <div className="p-12 text-center">
                  <Mail className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                  <p className="text-th-text-secondary">No invitations sent</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-th-border-primary">
              <h2 className="text-lg font-semibold text-th-text-primary">Invite Team Member</h2>
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-th-text-muted mt-1">
                  {ROLES.find((r) => r.value === inviteForm.role)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Personal Message (optional)
                </label>
                <textarea
                  value={inviteForm.message || ''}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Welcome to the team! Looking forward to working with you."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-th-border-primary">
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={actionLoading === 'invite'}
                variant="primary"
              >
                {actionLoading === 'invite' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
