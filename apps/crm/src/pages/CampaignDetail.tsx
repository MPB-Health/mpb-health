import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Play,
  Pause,
  CheckCircle,
  Plus,
  Trash2,
  Mail,
  MousePointer,
  MessageSquare,
  UserCheck,
  UserX,
  AlertCircle,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddCampaignModal } from '../components/AddCampaignModal';
import { AddCampaignMembersModal } from '../components/AddCampaignMembersModal';
import { Modal } from '../components/Modal';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  CampaignWithRelations,
  CampaignMember,
  CampaignStats,
  CampaignStatus,
  MemberStatus,
} from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

type TabType = 'overview' | 'members' | 'stats';

const statusColors: Record<CampaignStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { bg: 'bg-purple-100', text: 'text-purple-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

const memberStatusColors: Record<MemberStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  opened: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  clicked: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  responded: { bg: 'bg-green-100', text: 'text-green-700' },
  converted: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  unsubscribed: { bg: 'bg-orange-100', text: 'text-orange-700' },
  bounced: { bg: 'bg-red-100', text: 'text-red-700' },
};

const typeLabels: Record<string, string> = {
  email: 'Email',
  social: 'Social Media',
  event: 'Event',
  webinar: 'Webinar',
  advertisement: 'Advertisement',
  referral: 'Referral',
  other: 'Other',
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaignService } = useCRM();
  const { activeOrgId } = useOrg();

  const [campaign, setCampaign] = useState<CampaignWithRelations | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState<'start' | 'pause' | 'complete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const membersPageSize = 20;

  const loadCampaign = async () => {
    if (!id) return;

    setLoading(true);
    const [campaignData, statsData] = await Promise.all([
      campaignService.getCampaign(id),
      campaignService.getCampaignStats(id),
    ]);

    setCampaign(campaignData);
    setStats(statsData);
    setLoading(false);
  };

  const loadMembers = async () => {
    if (!id) return;

    const { members, total } = await campaignService.getCampaignMembers(
      id,
      membersPageSize,
      membersPage * membersPageSize
    );
    setMembers(members);
    setMembersTotal(total);
  };

  useEffect(() => {
    loadCampaign();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, membersPage, id]);

  const handleStartCampaign = async () => {
    if (!campaign) return;

    setActionLoading(true);
    const result = await campaignService.startCampaign(campaign.id);
    setActionLoading(false);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'campaign.started',
        entityType: 'campaign',
        entityId: campaign.id,
        after: { status: 'active' },
      }).catch(console.error);
      toast.success('Campaign started');
      setShowConfirmAction(null);
      loadCampaign();
    } else {
      toast.error(result.error || 'Failed to start campaign');
    }
  };

  const handlePauseCampaign = async () => {
    if (!campaign) return;

    setActionLoading(true);
    const result = await campaignService.pauseCampaign(campaign.id);
    setActionLoading(false);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'campaign.paused',
        entityType: 'campaign',
        entityId: campaign.id,
        after: { status: 'paused' },
      }).catch(console.error);
      toast.success('Campaign paused');
      setShowConfirmAction(null);
      loadCampaign();
    } else {
      toast.error(result.error || 'Failed to pause campaign');
    }
  };

  const handleCompleteCampaign = async () => {
    if (!campaign) return;

    setActionLoading(true);
    const result = await campaignService.completeCampaign(campaign.id);
    setActionLoading(false);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'campaign.completed',
        entityType: 'campaign',
        entityId: campaign.id,
        after: { status: 'completed' },
      }).catch(console.error);
      toast.success('Campaign completed');
      setShowConfirmAction(null);
      loadCampaign();
    } else {
      toast.error(result.error || 'Failed to complete campaign');
    }
  };

  const handleRemoveMembers = async () => {
    if (!campaign || selectedMembers.size === 0) return;

    const memberIds = Array.from(selectedMembers);
    const result = await campaignService.removeMembers(campaign.id, memberIds);

    if (result.success) {
      toast.success(`Removed ${memberIds.length} member(s)`);
      setSelectedMembers(new Set());
      loadMembers();
      loadCampaign();
    } else {
      toast.error(result.error || 'Failed to remove members');
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const toggleSelectAllMembers = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Campaign not found</p>
        <Link to="/campaigns" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const statusStyle = statusColors[campaign.status] || statusColors.draft;
  const canStart = campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'paused';
  const canPause = campaign.status === 'active';
  const canComplete = campaign.status === 'active' || campaign.status === 'paused';
  const isClosed = campaign.status === 'completed' || campaign.status === 'cancelled';

  const membersTotalPages = Math.ceil(membersTotal / membersPageSize);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
    { id: 'members', label: `Members (${campaign.members_count || 0})`, icon: <Users className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/campaigns')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{campaign.name}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
              >
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-th-text-tertiary mt-1">
              {typeLabels[campaign.campaign_type] || campaign.campaign_type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isClosed && (
            <PermissionGate permission="campaigns.write">
              {canPause && (
                <button
                  onClick={() => setShowConfirmAction('pause')}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}
              {canStart && (
                <button
                  onClick={() => setShowConfirmAction('start')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setShowConfirmAction('complete')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              )}
            </PermissionGate>
          )}
          <PermissionGate permission="campaigns.write">
            <button
              onClick={() => setShowEditCampaign(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">ROI</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {stats?.roi !== null ? formatPercent(stats?.roi || 0) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Open Rate</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatPercent(stats?.openRate || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Click Rate</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatPercent(stats?.clickRate || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Conversion Rate</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatPercent(stats?.conversionRate || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-th-accent-600 border-th-accent-600'
                  : 'text-th-text-tertiary border-transparent hover:text-th-text-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-6">
              <h2 className="text-lg font-semibold text-th-text-primary">Campaign Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Type</label>
                  <p className="text-th-text-primary">
                    {typeLabels[campaign.campaign_type] || campaign.campaign_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Budget</label>
                  <p className="text-th-text-primary font-medium">{formatCurrency(campaign.budget)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Actual Cost</label>
                  <p className="text-th-text-primary">{formatCurrency(campaign.actual_cost)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Expected Revenue</label>
                  <p className="text-th-text-primary">{formatCurrency(campaign.expected_revenue)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Actual Revenue</label>
                  <p className="text-th-text-primary">{formatCurrency(campaign.actual_revenue)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Start Date</label>
                  <p className="text-th-text-primary">{formatDate(campaign.start_date)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">End Date</label>
                  <p className="text-th-text-primary">{formatDate(campaign.end_date)}</p>
                </div>
              </div>

              {campaign.description && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Description</label>
                  <p className="text-th-text-secondary whitespace-pre-wrap">{campaign.description}</p>
                </div>
              )}

              {campaign.tags && campaign.tags.length > 0 && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {campaign.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-surface-tertiary rounded text-sm text-th-text-secondary"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {campaign.parent_campaign && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Parent Campaign</label>
                  <Link
                    to={`/campaigns/${campaign.parent_campaign.id}`}
                    className="text-th-accent-600 hover:underline"
                  >
                    {campaign.parent_campaign.name}
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-surface-primary rounded-xl border border-th-border">
              <div className="flex items-center justify-between p-4 border-b border-th-border">
                <h2 className="text-lg font-semibold text-th-text-primary">Campaign Members</h2>
                <div className="flex items-center gap-2">
                  {selectedMembers.size > 0 && (
                    <PermissionGate permission="campaigns.write">
                      <button
                        onClick={handleRemoveMembers}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove ({selectedMembers.size})
                      </button>
                    </PermissionGate>
                  )}
                  <PermissionGate permission="campaigns.write">
                    <button
                      onClick={() => setShowAddMembers(true)}
                      className="flex items-center gap-1 text-sm text-th-accent-600 hover:bg-th-accent-50 px-3 py-1.5 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add Members
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-th-text-tertiary">
                  <Users className="w-12 h-12 mb-4 opacity-50" />
                  <p>No members in this campaign</p>
                  <p className="text-sm mt-1">Add leads or contacts to get started</p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-th-border">
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedMembers.size === members.length && members.length > 0}
                            onChange={toggleSelectAllMembers}
                            className="w-4 h-4 rounded border-th-border"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Added
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                      {members.map((member) => {
                        const memberName = member.lead
                          ? `${member.lead.first_name || ''} ${member.lead.last_name || ''}`.trim()
                          : member.contact
                          ? `${member.contact.first_name} ${member.contact.last_name}`
                          : 'Unknown';
                        const memberEmail = member.lead?.email || member.contact?.email || '-';
                        const memberType = member.lead_id ? 'Lead' : member.contact_id ? 'Contact' : '-';
                        const memberStatusStyle = memberStatusColors[member.status] || memberStatusColors.pending;
                        const isSelected = selectedMembers.has(member.id);

                        return (
                          <tr
                            key={member.id}
                            className={`hover:bg-surface-secondary ${isSelected ? 'bg-th-accent-50' : ''}`}
                          >
                            <td className="w-12 px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleMemberSelection(member.id)}
                                className="w-4 h-4 rounded border-th-border"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-th-accent-100 rounded-full flex items-center justify-center">
                                  <span className="text-th-accent-700 font-medium text-sm">
                                    {memberName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-th-text-primary">
                                  {memberName || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-th-text-secondary">{memberEmail}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-th-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded">
                                {memberType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${memberStatusStyle.bg} ${memberStatusStyle.text}`}
                              >
                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-th-text-tertiary">
                              {formatTimeAgo(member.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Members Pagination */}
                  {membersTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-th-border">
                      <p className="text-sm text-th-text-tertiary">
                        Showing {membersPage * membersPageSize + 1} to{' '}
                        {Math.min((membersPage + 1) * membersPageSize, membersTotal)} of {membersTotal}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setMembersPage((p) => Math.max(0, p - 1))}
                          disabled={membersPage === 0}
                          className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setMembersPage((p) => Math.min(membersTotalPages - 1, p + 1))}
                          disabled={membersPage >= membersTotalPages - 1}
                          className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Funnel Stats */}
              <div className="bg-surface-primary rounded-xl border border-th-border p-6">
                <h2 className="text-lg font-semibold text-th-text-primary mb-4">Campaign Funnel</h2>
                <div className="space-y-4">
                  <StatRow
                    label="Total Members"
                    value={stats.totalMembers}
                    icon={<Users className="w-4 h-4" />}
                    color="gray"
                  />
                  <StatRow
                    label="Sent"
                    value={stats.sentCount}
                    icon={<Mail className="w-4 h-4" />}
                    color="blue"
                    percentage={stats.totalMembers > 0 ? (stats.sentCount / stats.totalMembers) * 100 : 0}
                  />
                  <StatRow
                    label="Opened"
                    value={stats.openedCount}
                    icon={<Mail className="w-4 h-4" />}
                    color="cyan"
                    percentage={stats.openRate}
                  />
                  <StatRow
                    label="Clicked"
                    value={stats.clickedCount}
                    icon={<MousePointer className="w-4 h-4" />}
                    color="indigo"
                    percentage={stats.clickRate}
                  />
                  <StatRow
                    label="Responded"
                    value={stats.respondedCount}
                    icon={<MessageSquare className="w-4 h-4" />}
                    color="green"
                    percentage={stats.responseRate}
                  />
                  <StatRow
                    label="Converted"
                    value={stats.convertedCount}
                    icon={<UserCheck className="w-4 h-4" />}
                    color="emerald"
                    percentage={stats.conversionRate}
                  />
                </div>
              </div>

              {/* Negative Stats */}
              <div className="bg-surface-primary rounded-xl border border-th-border p-6">
                <h2 className="text-lg font-semibold text-th-text-primary mb-4">Issues</h2>
                <div className="space-y-4">
                  <StatRow
                    label="Unsubscribed"
                    value={stats.unsubscribedCount}
                    icon={<UserX className="w-4 h-4" />}
                    color="orange"
                  />
                  <StatRow
                    label="Bounced"
                    value={stats.bouncedCount}
                    icon={<AlertCircle className="w-4 h-4" />}
                    color="red"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Campaign Info */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Campaign Info</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatDate(campaign.created_at)}</p>
                </div>
              </div>
              {campaign.start_date && (
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Start Date</p>
                    <p className="text-th-text-primary">{formatDate(campaign.start_date)}</p>
                  </div>
                </div>
              )}
              {campaign.end_date && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">End Date</p>
                    <p className="text-th-text-primary">{formatDate(campaign.end_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Summary */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Budget Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-tertiary">Budget</span>
                <span className="text-th-text-primary font-medium">{formatCurrency(campaign.budget)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-tertiary">Actual Cost</span>
                <span className="text-th-text-primary">{formatCurrency(campaign.actual_cost)}</span>
              </div>
              <div className="border-t border-th-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-th-text-tertiary">Expected Revenue</span>
                  <span className="text-th-text-primary">{formatCurrency(campaign.expected_revenue)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-th-text-tertiary">Actual Revenue</span>
                  <span className="text-th-text-primary font-medium">
                    {formatCurrency(campaign.actual_revenue)}
                  </span>
                </div>
              </div>
              {stats?.roi !== null && (
                <div className="border-t border-th-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-th-text-secondary">ROI</span>
                    <span
                      className={`text-lg font-bold ${
                        (stats?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(stats?.roi || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Member Summary */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Members</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-tertiary">Total Members</span>
                <span className="text-th-text-primary font-medium">{campaign.members_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-tertiary">Leads</span>
                <span className="text-th-text-primary">{campaign.leads_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-tertiary">Contacts</span>
                <span className="text-th-text-primary">{campaign.contacts_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCampaignModal
        open={showEditCampaign}
        onClose={() => setShowEditCampaign(false)}
        campaign={campaign}
        onSuccess={() => loadCampaign()}
      />

      <AddCampaignMembersModal
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        campaignId={campaign.id}
        onSuccess={() => {
          loadMembers();
          loadCampaign();
        }}
      />

      {/* Confirm Action Modal */}
      <Modal
        open={showConfirmAction !== null}
        onClose={() => setShowConfirmAction(null)}
        title={
          showConfirmAction === 'start'
            ? 'Start Campaign'
            : showConfirmAction === 'pause'
            ? 'Pause Campaign'
            : 'Complete Campaign'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            {showConfirmAction === 'start'
              ? 'Are you sure you want to start this campaign? Members will begin receiving communications.'
              : showConfirmAction === 'pause'
              ? 'Are you sure you want to pause this campaign? Communications will be temporarily stopped.'
              : 'Are you sure you want to mark this campaign as completed? This action cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmAction(null)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={
                showConfirmAction === 'start'
                  ? handleStartCampaign
                  : showConfirmAction === 'pause'
                  ? handlePauseCampaign
                  : handleCompleteCampaign
              }
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                showConfirmAction === 'start'
                  ? 'bg-green-600 hover:bg-green-700'
                  : showConfirmAction === 'pause'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {actionLoading
                ? 'Processing...'
                : showConfirmAction === 'start'
                ? 'Start Campaign'
                : showConfirmAction === 'pause'
                ? 'Pause Campaign'
                : 'Complete Campaign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper component for stats rows
function StatRow({
  label,
  value,
  icon,
  color,
  percentage,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  percentage?: number;
}) {
  const colorClasses: Record<string, { bg: string; text: string; bar: string }> = {
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-400' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
    green: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
    red: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  };

  const colorClass = colorClasses[color] || colorClasses.gray;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${colorClass.bg} rounded flex items-center justify-center`}>
            <span className={colorClass.text}>{icon}</span>
          </div>
          <span className="text-sm text-th-text-secondary">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-th-text-primary">{value}</span>
          {percentage !== undefined && (
            <span className="text-xs text-th-text-tertiary">({percentage.toFixed(1)}%)</span>
          )}
        </div>
      </div>
      {percentage !== undefined && (
        <div className="w-full bg-surface-tertiary rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${colorClass.bar}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
