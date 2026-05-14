import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createCaseService,
  formatTimeAgo,
  type CaseWithRelations,
  type CaseComment,
  type CaseStatus,
  type CasePriority,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Status badge colors
function getStatusColors(status: CaseStatus) {
  switch (status) {
    case 'new':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'assigned':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'in_progress':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    case 'on_hold':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'escalated':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'resolved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'closed':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Priority badge colors
function getPriorityColors(priority: CasePriority) {
  switch (priority) {
    case 'low':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'medium':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'high':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'urgent':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Format status label: replace underscores with spaces, capitalize
function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calculate days open
function getDaysOpen(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize case service
  const [caseService] = useState(() => createCaseService(supabase));

  // State
  const [caseData, setCaseData] = useState<CaseWithRelations | null>(null);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load case data
  const loadCase = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [caseResult, commentsResult] = await Promise.all([
        caseService.getCase(id),
        caseService.getCaseComments(id),
      ]);

      setCaseData(caseResult);
      setComments(commentsResult);
    } catch (error) {
      console.error('Failed to load case:', error);
      toast.error('Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [id, caseService]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  // Action handlers
  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!caseData) return;
    setActionLoading(true);
    try {
      await caseService.updateCase(caseData.id, { status: newStatus });
      toast.success(`Case ${formatStatusLabel(newStatus).toLowerCase()}`);
      loadCase();
    } catch (error) {
      console.error('Failed to update case status:', error);
      toast.error('Failed to update case status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!caseData) return;
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await caseService.updateCase(caseData.id, { assigned_to: user.id, status: 'assigned' });
      toast.success('Case assigned to you');
      loadCase();
    } catch (error) {
      console.error('Failed to assign case:', error);
      toast.error('Failed to assign case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !commentBody.trim()) return;

    setSubmittingComment(true);
    try {
      await caseService.addComment(caseData.id, {
        body: commentBody.trim(),
        is_internal: isInternal,
      });
      toast.success('Comment added');
      setCommentBody('');
      setIsInternal(false);
      // Reload comments
      const commentsResult = await caseService.getCaseComments(caseData.id);
      setComments(commentsResult);
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Case not found</p>
        <Link to="/cases" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to cases
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColors(caseData.status);
  const priorityColors = getPriorityColors(caseData.priority);
  const daysOpen = getDaysOpen(caseData.created_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{caseData.case_number}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors.bg} ${priorityColors.text}`}
                >
                  {formatStatusLabel(caseData.priority)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                >
                  {formatStatusLabel(caseData.status)}
                </span>
              </div>
              <p className="text-th-text-tertiary text-sm">{caseData.subject}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <PermissionGate permission="cases.write">
          <div className="flex items-center space-x-3">
            {caseData.status === 'new' && (
              <button
                onClick={handleAssignToMe}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
              >
                <span>Assign to Me</span>
              </button>
            )}
            {(caseData.status === 'assigned' || caseData.status === 'in_progress') && (
              <>
                <button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Resolve</span>
                </button>
                <button
                  onClick={() => handleStatusChange('escalated')}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Escalate</span>
                </button>
              </>
            )}
            {(caseData.status === 'on_hold' || caseData.status === 'escalated') && (
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Resolve</span>
              </button>
            )}
            {caseData.status === 'resolved' && (
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
              >
                <span>Close Case</span>
              </button>
            )}
          </div>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{daysOpen}</p>
              <p className="text-xs text-th-text-tertiary">Days Open</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{comments.length}</p>
              <p className="text-xs text-th-text-tertiary">Comments</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${priorityColors.bg} rounded-lg flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${priorityColors.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary capitalize">{caseData.priority}</p>
              <p className="text-xs text-th-text-tertiary">Priority</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary capitalize">{caseData.origin || '-'}</p>
              <p className="text-xs text-th-text-tertiary">Origin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex border-b border-th-border">
          {(['overview', 'comments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {tab}
              {tab === 'comments' && ` (${comments.length})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Case Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Case Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Case Number
                      </label>
                      <p className="text-sm text-th-text-primary">{caseData.case_number}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Subject
                      </label>
                      <p className="text-sm text-th-text-primary">{caseData.subject}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                      >
                        {formatStatusLabel(caseData.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Priority
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors.bg} ${priorityColors.text}`}
                      >
                        {formatStatusLabel(caseData.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Origin
                      </label>
                      <p className="text-sm text-th-text-primary capitalize">{caseData.origin || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <p className="text-sm text-th-text-primary">{caseData.category || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Account
                      </label>
                      {caseData.account ? (
                        <Link
                          to={`/accounts/${caseData.account.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {caseData.account.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Contact
                      </label>
                      {caseData.contact ? (
                        <Link
                          to={`/members/${caseData.contact.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {caseData.contact.first_name} {caseData.contact.last_name}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Owner
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {caseData.owner?.full_name || caseData.owner?.email || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Assigned To
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {caseData.assigned_user?.full_name || caseData.assigned_user?.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Due Date
                    </label>
                    <p className="text-sm text-th-text-primary">
                      {caseData.due_date
                        ? new Date(caseData.due_date).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Description, Resolution, Tags, Dates */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                      {caseData.description || 'No description provided'}
                    </p>
                  </div>
                  {(caseData.status === 'resolved' || caseData.status === 'closed') && caseData.resolution && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Resolution
                      </label>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                        {caseData.resolution}
                      </p>
                    </div>
                  )}
                  {caseData.tags && caseData.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {caseData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-th-accent-100 text-th-accent-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                        <p className="text-sm text-th-text-primary">{formatTimeAgo(caseData.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Updated</label>
                        <p className="text-sm text-th-text-primary">{formatTimeAgo(caseData.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-th-text-primary">
                Comments ({comments.length})
              </h3>

              {/* Comment Timeline */}
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No comments yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Add a comment to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`border rounded-lg p-4 ${
                        comment.is_internal
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-th-border bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-th-accent-100 rounded-full flex items-center justify-center">
                            <span className="text-th-accent-700 font-medium text-xs">
                              {(comment.author?.full_name || comment.author?.email || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary">
                              {comment.author?.full_name || comment.author?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-th-text-tertiary">
                              {formatTimeAgo(comment.created_at)}
                            </p>
                          </div>
                        </div>
                        {comment.is_internal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap pl-10">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <PermissionGate permission="cases.write">
                <form onSubmit={handleAddComment} className="border border-th-border rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-primary mb-2">
                      Add Comment
                    </label>
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Write your comment..."
                      rows={4}
                      className="w-full px-3 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary placeholder-th-text-tertiary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                      <span className="text-sm text-th-text-secondary">Internal note</span>
                    </label>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentBody.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submittingComment ? 'Sending...' : 'Submit'}</span>
                    </button>
                  </div>
                </form>
              </PermissionGate>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
