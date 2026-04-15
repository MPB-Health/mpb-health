import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Send, List, Undo2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import ApprovalCard from '../components/approvals/ApprovalCard';
import ApprovalBadge from '../components/approvals/ApprovalBadge';
import ApprovalTimeline from '../components/approvals/ApprovalTimeline';
import type { ApprovalRequestWithRelations, ApprovalStatus } from '@mpbhealth/crm-core';
import { HelpBanner } from '../components/help';

type TabId = 'pending' | 'submitted' | 'all';

const TABS: { id: TabId; label: string; icon: typeof CheckCircle2 }[] = [
  { id: 'pending', label: 'My Approvals', icon: CheckCircle2 },
  { id: 'submitted', label: 'My Submissions', icon: Send },
  { id: 'all', label: 'All Requests', icon: List },
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'recalled', label: 'Recalled' },
];

export default function Approvals() {
  const { approvalService } = useCRM();
  const { activeOrgId, can } = useOrg();
  const { user } = useAuth();
  const isAdmin = can('settings.manage');

  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequestWithRelations[]>([]);
  const [submissions, setSubmissions] = useState<ApprovalRequestWithRelations[]>([]);
  const [allRequests, setAllRequests] = useState<ApprovalRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!activeOrgId || !user) return;
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const data = await approvalService.getMyPendingApprovals(user.id, activeOrgId);
        setPendingApprovals(data);
      } else if (activeTab === 'submitted') {
        const data = await approvalService.getMySubmissions(user.id, activeOrgId);
        setSubmissions(data);
      } else if (activeTab === 'all' && isAdmin) {
        const data = await approvalService.getAllRequests(activeOrgId);
        setAllRequests(data);
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeOrgId, user, approvalService, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (requestId: string, comments: string) => {
    if (!user) return;
    const result = await approvalService.approveStep(requestId, user.id, comments || undefined);
    if (result.success) {
      toast.success('Approved');
      loadData();
    } else {
      toast.error(result.error || 'Failed to approve');
    }
  };

  const handleReject = async (requestId: string, comments: string) => {
    if (!user) return;
    const result = await approvalService.rejectStep(requestId, user.id, comments || undefined);
    if (result.success) {
      toast.success('Rejected');
      loadData();
    } else {
      toast.error(result.error || 'Failed to reject');
    }
  };

  const handleRecall = async (requestId: string) => {
    if (!user) return;
    const result = await approvalService.recallRequest(requestId, user.id);
    if (result.success) {
      toast.success('Recalled');
      loadData();
    } else {
      toast.error(result.error || 'Failed to recall');
    }
  };

  const getFilteredRequests = (requests: ApprovalRequestWithRelations[]) => {
    if (statusFilter === 'all') return requests;
    return requests.filter((r) => r.status === statusFilter);
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle2 className="w-12 h-12 text-th-text-tertiary mb-3" />
      <p className="text-th-text-secondary font-medium">{message}</p>
      <p className="text-sm text-th-text-tertiary mt-1">Check back later or switch tabs.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Approvals"
        subtitle="Review and manage approval requests across your organization."
      />
      <HelpBanner pageKey="approvals" title="Welcome to Approvals" tip="Review and approve pending requests from your team. Approval workflows ensure proper oversight for discounts, deals, and other actions that need manager sign-off." />

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex gap-0">
          {TABS.map((tab) => {
            if (tab.id === 'all' && !isAdmin) return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'pending'
                ? pendingApprovals.length
                : tab.id === 'submitted'
                ? submissions.length
                : allRequests.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-th-accent-600 text-th-accent-600'
                    : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && !loading && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-th-accent-100 text-th-accent-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar for submitted / all tabs */}
      {(activeTab === 'submitted' || activeTab === 'all') && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      )}

      {/* Pending tab */}
      {!loading && activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingApprovals.length === 0
            ? renderEmptyState('No approvals waiting for your action')
            : pendingApprovals.map((req) => (
                <ApprovalCard
                  key={req.id}
                  request={req}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  showActions={true}
                />
              ))}
        </div>
      )}

      {/* Submitted tab */}
      {!loading && activeTab === 'submitted' && (
        <div className="space-y-3">
          {getFilteredRequests(submissions).length === 0
            ? renderEmptyState('No submissions found')
            : getFilteredRequests(submissions).map((req) => (
                <div key={req.id} className="bg-surface-primary border border-th-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-th-text-primary">
                          {req.process?.name ?? 'Approval Request'}
                        </span>
                        <ApprovalBadge status={req.status} />
                      </div>
                      <p className="text-xs text-th-text-tertiary mt-0.5">
                        {req.entity_type} &middot; Step {req.current_step} of {req.steps?.length ?? '?'}
                      </p>
                    </div>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleRecall(req.id)}
                        className="flex items-center gap-1 text-xs text-th-text-secondary hover:text-th-text-primary px-2 py-1 rounded border border-th-border hover:bg-surface-secondary transition-colors"
                      >
                        <Undo2 className="w-3 h-3" />
                        Recall
                      </button>
                    )}
                  </div>

                  {req.steps && req.steps.length > 0 && (
                    <ApprovalTimeline
                      steps={req.steps}
                      actions={req.actions || []}
                      currentStep={req.current_step}
                      status={req.status}
                    />
                  )}
                </div>
              ))}
        </div>
      )}

      {/* All requests tab (admin) */}
      {!loading && activeTab === 'all' && isAdmin && (
        <div className="space-y-3">
          {getFilteredRequests(allRequests).length === 0
            ? renderEmptyState('No approval requests found')
            : getFilteredRequests(allRequests).map((req) => (
                <ApprovalCard
                  key={req.id}
                  request={req}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  showActions={req.status === 'pending'}
                />
              ))}
        </div>
      )}
    </div>
  );
}
