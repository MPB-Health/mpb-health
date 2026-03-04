import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Shield,
  Heart, Users as UsersIcon, FileText, CreditCard,
} from 'lucide-react';
import {
  memberService,
  type MemberProfile,
  type MemberDependent,
  type MemberClaim,
} from '@mpbhealth/admin-core';

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

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [dependents, setDependents] = useState<MemberDependent[]>([]);
  const [claims, setClaims] = useState<MemberClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!memberId) return;

    const loadData = async () => {
      try {
        const [memberData, depsData, claimsData] = await Promise.all([
          memberService.getMember(memberId),
          memberService.getDependents(memberId),
          memberService.getClaims(memberId),
        ]);

        if (!memberData) {
          toast.error('Member not found');
          navigate('/members');
          return;
        }

        setMember(memberData);
        setDependents(depsData);
        setClaims(claimsData);
      } catch {
        toast.error('Failed to load member');
        navigate('/members');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [memberId, navigate]);

  const handleStatusChange = async (status: MemberProfile['membership_status']) => {
    if (!memberId) return;
    setUpdatingStatus(true);
    try {
      const updated = await memberService.updateMember(memberId, { membership_status: status });
      setMember(updated);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
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

        {/* Status actions */}
        <div className="flex gap-2">
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
