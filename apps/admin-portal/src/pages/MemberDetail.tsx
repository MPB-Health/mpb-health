import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Shield,
  Users as UsersIcon, FileText, CreditCard,
  Bell, Clock, ChevronDown, Send,
} from 'lucide-react';
import {
  memberService,
  memberNotificationService,
  getDepartmentLabel,
  DEPARTMENT_OPTIONS,
  type MemberProfile,
  type MemberDependent,
  type MemberClaim,
  type MemberNotificationAdmin,
  type ActorDepartment,
  type AccountEventType,
  EVENT_TYPE_LABELS,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const CLAIM_STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  denied: 'bg-red-100 text-red-700',
  draft: 'bg-neutral-100 text-neutral-600',
};

export default function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [dependents, setDependents] = useState<MemberDependent[]>([]);
  const [claims, setClaims] = useState<MemberClaim[]>([]);
  const [notifications, setNotifications] = useState<MemberNotificationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [selectedDept, setSelectedDept] = useState<ActorDepartment>('administration');
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  // Manual notification form
  const [showSendForm, setShowSendForm] = useState(false);
  const [manualEventType, setManualEventType] = useState<AccountEventType>('general_update');
  const [manualMessage, setManualMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    if (!memberId) return;

    const loadData = async () => {
      try {
        const [memberData, depsData, claimsData, notifData] = await Promise.all([
          memberService.getMember(memberId),
          memberService.getDependents(memberId),
          memberService.getClaims(memberId),
          memberNotificationService.getMemberNotifications({ member_id: memberId, limit: 20 }).catch(() => ({ notifications: [], total: 0 })),
        ]);

        if (!memberData) {
          toast.error('Member not found');
          navigate('/members');
          return;
        }

        setMember(memberData);
        setDependents(depsData);
        setClaims(claimsData);
        setNotifications(notifData.notifications);
      } catch {
        toast.error('Failed to load member');
        navigate('/members');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [memberId, navigate]);

  const emitAccountEvent = async (
    eventType: AccountEventType,
    changes: Record<string, unknown>,
    entityType = 'member_profile',
  ) => {
    if (!memberId || !user) return;
    try {
      await memberNotificationService.createAccountEvent({
        member_id: memberId,
        actor_user_id: user.id,
        actor_department: selectedDept,
        event_type: eventType,
        entity_type: entityType,
        entity_id: memberId,
        changes,
        payload_summary: { actor_email: user.email },
      });

      const { notifications: fresh } = await memberNotificationService.getMemberNotifications({ member_id: memberId, limit: 20 });
      setNotifications(fresh);
    } catch (err) {
      console.error('Failed to create account event:', err);
      toast.error('Member was updated but notification may not have been sent');
    }
  };

  const handleStatusChange = async (status: MemberProfile['membership_status']) => {
    if (!memberId) return;
    setUpdatingStatus(true);
    try {
      const oldStatus = member?.membership_status;
      const updated = await memberService.updateMember(memberId, { membership_status: status });
      setMember(updated);
      toast.success(`Status updated to ${status}`);

      await emitAccountEvent('membership_status_change', {
        old_status: oldStatus,
        new_status: status,
      });
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendManualNotification = async () => {
    if (!memberId || !user || !manualMessage.trim()) return;
    setSendingNotification(true);
    try {
      await memberNotificationService.createAccountEvent({
        member_id: memberId,
        actor_user_id: user.id,
        actor_department: selectedDept,
        event_type: manualEventType,
        entity_type: 'member_profile',
        entity_id: memberId,
        changes: {},
        payload_summary: {
          actor_email: user.email,
          custom_message: manualMessage.trim(),
        },
      });
      toast.success('Notification sent to member');
      setManualMessage('');
      setShowSendForm(false);

      const { notifications: fresh } = await memberNotificationService.getMemberNotifications({ member_id: memberId, limit: 20 });
      setNotifications(fresh);
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/members')}
            aria-label="Back to members list"
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-th-text-tertiary">
              {member.membership_number ? `#${member.membership_number}` : 'No membership number'}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${STATUS_COLORS[member.membership_status]}`}>
            {member.membership_status}
          </span>
        </div>

        {/* Department picker + Status actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDeptPicker(!showDeptPicker)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <span className="text-th-text-tertiary">Acting as:</span>
              <span className="font-medium text-th-text-primary">{getDepartmentLabel(selectedDept)}</span>
              <ChevronDown className="w-4 h-4 text-th-text-tertiary" />
            </button>
            {showDeptPicker && (
              <div className="absolute right-0 mt-1 w-56 bg-surface-primary border border-th-border rounded-lg shadow-lg z-20 py-1">
                {DEPARTMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedDept(opt.value as ActorDepartment); setShowDeptPicker(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                      selectedDept === opt.value ? 'text-th-accent-600 font-medium' : 'text-th-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {member.membership_status !== 'active' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updatingStatus}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
          )}
          {member.membership_status !== 'suspended' && member.membership_status !== 'cancelled' && (
            <button
              onClick={() => handleStatusChange('suspended')}
              disabled={updatingStatus}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Birth" value={member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : '-'} />
              <Field label="Gender" value={member.gender || '-'} />
              <Field label="Phone" value={member.phone || '-'} icon={Phone} />
              <Field label="Language" value={member.preferred_language || 'en'} />
            </div>
          </Section>

          {/* Address */}
          <Section title="Address" icon={MapPin}>
            <p className="text-th-text-secondary">
              {member.address_line1 || '-'}
              {member.city && <>, {member.city}</>}
              {member.state && <>, {member.state}</>}
              {member.zip_code && <> {member.zip_code}</>}
            </p>
          </Section>

          {/* Dependents */}
          <Section title={`Dependents (${dependents.length})`} icon={UsersIcon}>
            {dependents.length > 0 ? (
              <div className="divide-y divide-th-border-subtle">
                {dependents.map((dep) => (
                  <div key={dep.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-th-text-primary">
                        {dep.first_name} {dep.last_name}
                      </p>
                      <p className="text-sm text-th-text-tertiary capitalize">
                        {dep.relationship}
                        {dep.date_of_birth && ` | DOB: ${new Date(dep.date_of_birth).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${dep.is_covered ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {dep.is_covered ? 'Covered' : 'Not Covered'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-th-text-tertiary">No dependents on file</p>
            )}
          </Section>

          {/* Claims */}
          <Section title={`Claims (${claims.length})`} icon={FileText}>
            {claims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-th-border">
                      <th className="text-left py-2 text-th-text-tertiary font-medium">Claim #</th>
                      <th className="text-left py-2 text-th-text-tertiary font-medium">Type</th>
                      <th className="text-left py-2 text-th-text-tertiary font-medium">Status</th>
                      <th className="text-right py-2 text-th-text-tertiary font-medium">Amount</th>
                      <th className="text-right py-2 text-th-text-tertiary font-medium">Paid</th>
                      <th className="text-left py-2 text-th-text-tertiary font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border-subtle">
                    {claims.map((claim) => (
                      <tr key={claim.id}>
                        <td className="py-2 font-mono text-th-text-primary">{claim.claim_number}</td>
                        <td className="py-2 capitalize text-th-text-secondary">{claim.claim_type}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${CLAIM_STATUS_COLORS[claim.status] || 'bg-neutral-100 text-neutral-600'}`}>
                            {claim.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 text-right text-th-text-secondary">${Number(claim.total_amount).toLocaleString()}</td>
                        <td className="py-2 text-right text-th-text-secondary">${Number(claim.paid_amount).toLocaleString()}</td>
                        <td className="py-2 text-th-text-tertiary">
                          {claim.service_date ? new Date(claim.service_date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-th-text-tertiary">No claims on file</p>
            )}
          </Section>

          {/* Member Notification History */}
          <Section title={`Notifications Sent (${notifications.length})`} icon={Bell}>
            <button
              onClick={() => setNotificationsExpanded(!notificationsExpanded)}
              className="text-sm text-th-accent-600 hover:underline mb-3"
            >
              {notificationsExpanded ? 'Collapse' : 'Show all'}
            </button>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {(notificationsExpanded ? notifications : notifications.slice(0, 5)).map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-neutral-300' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-th-text-primary truncate">{notif.title}</span>
                        {notif.priority === 'high' || notif.priority === 'urgent' ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex-shrink-0">
                            {notif.priority}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-th-text-secondary line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {notif.actor_department && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-th-accent-100 text-th-accent-700 dark:bg-th-accent-900/30 dark:text-th-accent-300">
                            {notif.actor_department}
                          </span>
                        )}
                        {notif.category && (
                          <span className="text-[10px] text-th-text-tertiary capitalize">{notif.category}</span>
                        )}
                        <span className="text-[10px] text-th-text-tertiary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-th-text-tertiary">
                          {notif.is_read ? `Read ${notif.read_at ? new Date(notif.read_at).toLocaleDateString() : ''}` : 'Unread'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-th-text-tertiary">No notifications sent to this member yet</p>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Membership details */}
          <Section title="Membership" icon={Shield}>
            <div className="space-y-3">
              <Field label="Start Date" value={member.membership_start_date ? new Date(member.membership_start_date).toLocaleDateString() : '-'} />
              <Field label="End Date" value={member.membership_end_date ? new Date(member.membership_end_date).toLocaleDateString() : '-'} />
              <Field label="Plan ID" value={member.plan_id || '-'} />
              <Field label="Assigned Advisor" value={member.assigned_advisor_id || 'Unassigned'} />
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline" icon={Calendar}>
            <div className="space-y-3">
              <Field label="Created" value={new Date(member.created_at).toLocaleDateString()} />
              <Field label="Last Updated" value={new Date(member.updated_at).toLocaleDateString()} />
            </div>
          </Section>

          {/* Quick stats */}
          <Section title="Summary" icon={CreditCard}>
            <div className="space-y-3">
              <Field label="Dependents" value={String(dependents.length)} />
              <Field label="Total Claims" value={String(claims.length)} />
              <Field
                label="Total Claimed"
                value={`$${claims.reduce((s, c) => s + Number(c.total_amount), 0).toLocaleString()}`}
              />
              <Field
                label="Total Paid"
                value={`$${claims.reduce((s, c) => s + Number(c.paid_amount), 0).toLocaleString()}`}
              />
            </div>
          </Section>

          {/* Send Manual Notification */}
          <Section title="Send Notification" icon={Send}>
            {!showSendForm ? (
              <button
                onClick={() => setShowSendForm(true)}
                className="w-full px-4 py-2.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
              >
                Notify Member
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="notif-type" className="block text-xs text-th-text-tertiary mb-1">Change Type</label>
                  <select
                    id="notif-type"
                    value={manualEventType}
                    onChange={(e) => setManualEventType(e.target.value as AccountEventType)}
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notif-msg" className="block text-xs text-th-text-tertiary mb-1">Internal Note (optional)</label>
                  <textarea
                    id="notif-msg"
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    placeholder="Internal reference note (not shown to member)..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary resize-none"
                  />
                </div>
                <p className="text-[10px] text-th-text-tertiary leading-tight">
                  The member will receive a notification based on the configured rule for this change type, sent from the {getDepartmentLabel(selectedDept)}.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendManualNotification}
                    disabled={sendingNotification}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingNotification ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    onClick={() => { setShowSendForm(false); setManualMessage(''); }}
                    className="px-4 py-2 text-sm text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-th-text-tertiary" />
        <h2 className="text-lg font-semibold text-th-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, icon: Icon }: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <p className="text-xs text-th-text-tertiary mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-th-text-tertiary" />}
        <p className="text-sm text-th-text-primary">{value}</p>
      </div>
    </div>
  );
}
