// ============================================================================
// Compliance Dashboard — View compliance status, documents, and violations
// ============================================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  ChevronRight,
  AlertCircle,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Eye,
} from 'lucide-react';
import {
  useOrgComplianceSummary,
  useUserComplianceStatus,
  usePendingAcknowledgments,
  useViolations,
  useComplianceDocuments,
} from '../hooks/useCompliance';
import { useAuth } from '../hooks/useAuth';

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export default function Compliance() {
  const { user } = useAuth();
  const [violationFilter, setViolationFilter] = useState<string>('open');

  const { summary, loading: summaryLoading } = useOrgComplianceSummary();
  const { status: userStatus, loading: statusLoading } = useUserComplianceStatus(user?.id);
  const { pending, loading: pendingLoading } = usePendingAcknowledgments(user?.id);
  const { violations, loading: violationsLoading } = useViolations({
    status: violationFilter || undefined,
    limit: 10,
  });
  const { documents, loading: docsLoading } = useComplianceDocuments({ activeOnly: true });

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, typeof documents> = {};
    documents.forEach(doc => {
      const category = doc.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });
    return grouped;
  }, [documents]);

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your compliance status and complete required training
          </p>
        </div>
        <Link
          to="/audit-log"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View Audit Log
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Your Compliance Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Your Score</p>
              <p className={`text-3xl font-bold mt-1 ${getComplianceScoreColor(userStatus?.compliance_score || 0)}`}>
                {statusLoading ? '...' : `${userStatus?.compliance_score || 0}%`}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              (userStatus?.compliance_score || 0) >= 90 ? 'bg-green-100' :
              (userStatus?.compliance_score || 0) >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Shield className={`h-6 w-6 ${getComplianceScoreColor(userStatus?.compliance_score || 0)}`} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getComplianceScoreBg(userStatus?.compliance_score || 0)} transition-all duration-500`}
                style={{ '--progress-width': `${userStatus?.compliance_score || 0}%`, width: 'var(--progress-width)' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {statusLoading ? '...' : userStatus?.total_pending || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {(userStatus?.total_overdue || 0) > 0 ? (
              <span className="text-red-600 font-medium">{userStatus?.total_overdue} overdue</span>
            ) : (
              'All tasks on track'
            )}
          </p>
        </div>

        {/* Org Compliance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Team Average</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summaryLoading ? '...' : `${Math.round(summary?.avg_compliance_score || 0)}%`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {summary?.fully_compliant || 0} of {summary?.total_users || 0} fully compliant
          </p>
        </div>

        {/* Open Violations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Violations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summaryLoading ? '...' : summary?.open_violations || 0}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              (summary?.open_violations || 0) > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {(summary?.open_violations || 0) > 0 ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {(summary?.open_violations || 0) > 0 ? 'Requires attention' : 'No issues found'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Acknowledgments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Pending Tasks</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingLoading ? (
              <div className="p-5 text-center text-gray-500">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">All caught up!</p>
                <p className="text-sm text-gray-500 mt-1">No pending compliance tasks</p>
              </div>
            ) : (
              pending.slice(0, 5).map((ack) => {
                const isOverdue = ack.due_date && isPast(new Date(ack.due_date));
                return (
                  <Link
                    key={ack.id}
                    to={`/compliance/acknowledge/${ack.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isOverdue ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <FileText className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {ack.document?.title || 'Compliance Document'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {ack.document?.category || 'General'}
                        {ack.document?.document_type === 'quiz' && ' • Quiz required'}
                      </p>
                    </div>
                    <div className="text-right">
                      {ack.due_date ? (
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {isOverdue ? 'Overdue' : `Due ${formatDistanceToNow(new Date(ack.due_date), { addSuffix: true })}`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">No deadline</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                );
              })
            )}
          </div>
          {pending.length > 5 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                to="/compliance/tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all {pending.length} tasks
              </Link>
            </div>
          )}
        </div>

        {/* Recent Violations */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Violations</h2>
            <select
              value={violationFilter}
              onChange={(e) => setViolationFilter(e.target.value)}
              aria-label="Filter violations by status"
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="divide-y divide-gray-200">
            {violationsLoading ? (
              <div className="p-5 text-center text-gray-500">Loading...</div>
            ) : violations.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">No violations found</p>
                <p className="text-sm text-gray-500 mt-1">Great job maintaining compliance!</p>
              </div>
            ) : (
              violations.slice(0, 5).map((violation) => (
                <div key={violation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      violation.severity === 'critical' ? 'bg-red-100' :
                      violation.severity === 'high' ? 'bg-orange-100' :
                      violation.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertCircle className={`h-4 w-4 ${
                        violation.severity === 'critical' ? 'text-red-600' :
                        violation.severity === 'high' ? 'text-orange-600' :
                        violation.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[violation.severity]}`}>
                          {violation.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[violation.status]}`}>
                          {violation.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {violation.violation_type}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {violation.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(violation.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Documents</h2>
        </div>
        {docsLoading ? (
          <div className="p-5 text-center text-gray-500">Loading documents...</div>
        ) : Object.keys(documentsByCategory).length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No compliance documents available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {Object.entries(documentsByCategory).map(([category, docs]) => {
              const totalRequired = docs.reduce((sum, d) => sum + (d.total_required || 0), 0);
              const totalCompleted = docs.reduce((sum, d) => sum + (d.total_completed || 0), 0);
              const completionRate = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 100;

              return (
                <Link
                  key={category}
                  to={`/compliance/category/${encodeURIComponent(category)}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{category}</h3>
                    <span className={`text-sm font-medium ${getComplianceScoreColor(completionRate)}`}>
                      {Math.round(completionRate)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${getComplianceScoreBg(completionRate)} transition-all duration-500`}
                      style={{ '--progress-width': `${completionRate}%`, width: 'var(--progress-width)' } as React.CSSProperties}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {docs.length} document{docs.length !== 1 ? 's' : ''} • {totalCompleted}/{totalRequired} completed
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
