// ============================================================================
// Audit Log Page — View all system activity and compliance events
// ============================================================================

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  MessageSquare,
  Settings,
  Shield,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import { useAuditLogs } from '../hooks/useCompliance';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { PageQueryBoundary } from '../components/loading';

const ACTION_ICONS: Record<string, typeof User> = {
  lead: User,
  message: MessageSquare,
  document: FileText,
  compliance: Shield,
  settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-gray-100 text-gray-800',
  login: 'bg-blue-100 text-blue-800',
  logout: 'bg-gray-100 text-gray-800',
};

export default function AuditLog() {
  useAdvisorPageDebugLog('AuditLog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { logs, total, loading, error, refresh } = useAuditLogs({
    action: selectedAction || undefined,
    resourceType: selectedResourceType || undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: pageSize,
    offset: page * pageSize,
  });

  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(log => {
      if (log.resource_type) types.add(log.resource_type);
    });
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log =>
      log.action?.toLowerCase().includes(query) ||
      log.resource_type?.toLowerCase().includes(query) ||
      log.user_name?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  const getActionColor = (action: string) => {
    const actionType = action.split('.')[0] || action;
    return ACTION_COLORS[actionType] || 'bg-gray-100 text-gray-800';
  };

  const getResourceIcon = (resourceType: string) => {
    return ACTION_ICONS[resourceType] || FileText;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Audit Log</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Track all system activity and compliance-related events
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-th-text-tertiary" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resource Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-th-text-tertiary" />
            <select
              value={selectedResourceType}
              onChange={(e) => {
                setSelectedResourceType(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-surface-primary"
            >
              <option value="">All Resources</option>
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-surface-primary"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              onChange={(e) => {
                setDateRange(prev => ({
                  ...prev,
                  start: e.target.value ? new Date(e.target.value) : undefined,
                }));
                setPage(0);
              }}
              className="flex-1 px-3 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start date"
            />
            <input
              type="date"
              onChange={(e) => {
                setDateRange(prev => ({
                  ...prev,
                  end: e.target.value ? new Date(e.target.value) : undefined,
                }));
                setPage(0);
              }}
              className="flex-1 px-3 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-th-text-secondary">
        <span>
          Showing {filteredLogs.length} of {total} events
        </span>
        {totalPages > 1 && (
          <span>
            Page {page + 1} of {totalPages}
          </span>
        )}
      </div>

      {/* Log List */}
      <PageQueryBoundary
        isLoading={loading && logs.length === 0}
        loadingMessage="Loading audit logs…"
        loadingSubtitle="Fetching recent activity for your organization."
        isError={Boolean(error) && logs.length === 0}
        errorMessage={
          error instanceof Error ? error.message : 'Something went wrong while loading audit logs.'
        }
        onRetry={refresh}
        compact
      >
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-th-text-secondary">
            <Clock className="h-8 w-8 mx-auto mb-2 text-th-text-tertiary" />
            <p>No audit events found</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filteredLogs.map((log) => {
              const Icon = getResourceIcon(log.resource_type);
              const isExpanded = expandedId === log.id;

              return (
                <div key={log.id} className="hover:bg-surface-secondary transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full px-4 py-3 flex items-center gap-4 text-left"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-surface-tertiary rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-th-text-secondary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.resource_type && (
                          <span className="text-sm text-th-text-secondary">
                            {log.resource_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {log.user_name || log.user_email ? (
                          <span className="text-sm font-medium text-th-text-primary">
                            {log.user_name || log.user_email}
                          </span>
                        ) : (
                          <span className="text-sm text-th-text-secondary italic">System</span>
                        )}
                        {log.resource_id && (
                          <>
                            <ArrowRight className="h-3 w-3 text-th-text-tertiary" />
                            <span className="text-sm text-th-text-secondary font-mono truncate max-w-[200px]">
                              {log.resource_id}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Expand */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-th-text-secondary">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-th-text-tertiary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-th-text-tertiary" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-14 bg-surface-secondary rounded-lg p-4 space-y-3">
                        {/* User Info */}
                        {(log.user_name || log.user_email) && (
                          <div>
                            <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wide mb-1">User</h4>
                            <p className="text-sm text-th-text-primary">
                              {log.user_name && <span className="font-medium">{log.user_name}</span>}
                              {log.user_email && (
                                <span className="text-th-text-secondary ml-2">({log.user_email})</span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* IP & User Agent */}
                        <div className="grid grid-cols-2 gap-4">
                          {log.ip_address && (
                            <div>
                              <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wide mb-1">IP Address</h4>
                              <p className="text-sm text-th-text-primary font-mono">{log.ip_address}</p>
                            </div>
                          )}
                          {log.user_agent && (
                            <div>
                              <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wide mb-1">User Agent</h4>
                              <p className="text-sm text-th-text-primary truncate" title={log.user_agent}>
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wide mb-1">Details</h4>
                            <pre className="text-sm text-th-text-primary bg-surface-primary rounded border border-th-border p-3 overflow-x-auto max-h-40">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Full Timestamp */}
                        <div>
                          <h4 className="text-xs font-medium text-th-text-secondary uppercase tracking-wide mb-1">Timestamp</h4>
                          <p className="text-sm text-th-text-primary">
                            {format(new Date(log.created_at), 'EEEE, MMMM d, yyyy \'at\' h:mm:ss a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </PageQueryBoundary>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="min-h-[44px] min-w-[44px]"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page < 2 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i;
              if (pageNum < 0 || pageNum >= totalPages) return null;
              return (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'text-th-text-primary hover:bg-surface-tertiary'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="min-h-[44px] min-w-[44px]"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
