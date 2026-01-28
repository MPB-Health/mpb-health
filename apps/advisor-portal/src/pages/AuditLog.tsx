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
import { useAuditLogs } from '../hooks/useCompliance';

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
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
};

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { logs, total, loading, refresh } = useAuditLogs({
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all system activity and compliance-related events
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resource Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedResourceType}
              onChange={(e) => {
                setSelectedResourceType(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No audit events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const Icon = getResourceIcon(log.resource_type);
              const isExpanded = expandedId === log.id;

              return (
                <div key={log.id} className="hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full px-4 py-3 flex items-center gap-4 text-left"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.resource_type && (
                          <span className="text-sm text-gray-500">
                            {log.resource_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {log.user_name || log.user_email ? (
                          <span className="text-sm font-medium text-gray-900">
                            {log.user_name || log.user_email}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">System</span>
                        )}
                        {log.resource_id && (
                          <>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-500 font-mono truncate max-w-[200px]">
                              {log.resource_id}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Expand */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-14 bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* User Info */}
                        {(log.user_name || log.user_email) && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User</h4>
                            <p className="text-sm text-gray-900">
                              {log.user_name && <span className="font-medium">{log.user_name}</span>}
                              {log.user_email && (
                                <span className="text-gray-500 ml-2">({log.user_email})</span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* IP & User Agent */}
                        <div className="grid grid-cols-2 gap-4">
                          {log.ip_address && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">IP Address</h4>
                              <p className="text-sm text-gray-900 font-mono">{log.ip_address}</p>
                            </div>
                          )}
                          {log.user_agent && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User Agent</h4>
                              <p className="text-sm text-gray-900 truncate" title={log.user_agent}>
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Details</h4>
                            <pre className="text-sm text-gray-900 bg-white rounded border border-gray-200 p-3 overflow-x-auto max-h-40">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Full Timestamp */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Timestamp</h4>
                          <p className="text-sm text-gray-900">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page < 2 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i;
              if (pageNum < 0 || pageNum >= totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
